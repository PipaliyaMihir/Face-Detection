"""
face_engine.py — Face recognition engine.

Loads known face encodings from MongoDB into memory at startup.
Processes webcam frames: detects faces, compares encodings, marks attendance.
"""

import time
import numpy as np
import cv2
import face_recognition
from typing import Dict, List, Any

from database import get_all_people_with_encodings, record_attendance

# ---------------------------------------------------------------------------
# In-memory face data (loaded from MongoDB at startup)
# ---------------------------------------------------------------------------
known_face_encodings: List[np.ndarray] = []
known_face_names: List[str] = []
known_face_ids: List[str] = []

# Cooldown tracking: { person_id: last_marked_timestamp }
_cooldown: Dict[str, float] = {}
COOLDOWN_SECONDS = 15  # 15s cooldown per person to prevent spamming

# Matching tolerance (lower = stricter)
MATCH_TOLERANCE = 0.6


async def load_known_faces():
    """Load all face encodings from MongoDB into memory."""
    global known_face_encodings, known_face_names, known_face_ids

    people = await get_all_people_with_encodings()

    encodings = []
    names = []
    ids = []

    for person in people:
        if person.get("face_encoding"):
            enc = np.array(person["face_encoding"], dtype=np.float64)
            encodings.append(enc)
            names.append(person["name"])
            ids.append(person["id"])

    known_face_encodings = encodings
    known_face_names = names
    known_face_ids = ids

    print(f"🧠 Loaded {len(encodings)} face encoding(s) into memory.")


async def process_frame(image_bytes: bytes) -> Dict[str, Any]:
    """
    Process a single JPEG frame from the webcam.

    Steps:
        1. Decode the image bytes into an OpenCV frame.
        2. Shrink to 1/4 size for faster detection.
        3. Detect face locations and compute encodings.
        4. Compare each face against known encodings.
        5. If matched, mark attendance (respecting cooldown).

    Returns:
        {
            "faces": [
                {
                    "name": "John" | "Unknown",
                    "person_id": "abc123" | null,
                    "matched": true | false,
                    "confidence": 0.85,
                    "box": {"top": y, "right": x2, "bottom": y2, "left": x}
                },
                ...
            ],
            "attendance_marked": ["John", ...]
        }
    """
    # Decode JPEG bytes → OpenCV BGR image
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"faces": [], "attendance_marked": []}

    # Convert BGR → RGB (face_recognition expects RGB)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Shrink to 1/4 for speed
    small_frame = cv2.resize(rgb_frame, (0, 0), fx=0.25, fy=0.25)

    # Detect faces and compute encodings on the small frame
    face_locations = face_recognition.face_locations(small_frame, model="hog")
    face_encodings = face_recognition.face_encodings(small_frame, face_locations)

    faces = []
    attendance_marked = []
    now = time.time()

    for encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
        # Scale bounding box back up (×4)
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        name = "Unknown"
        person_id = None
        matched = False
        confidence = 0.0

        if known_face_encodings:
            # Compare against all known faces
            distances = face_recognition.face_distance(known_face_encodings, encoding)
            best_idx = int(np.argmin(distances))
            best_distance = distances[best_idx]

            if best_distance <= MATCH_TOLERANCE:
                name = known_face_names[best_idx]
                person_id = known_face_ids[best_idx]
                matched = True
                confidence = round(1.0 - best_distance, 3)

                # Mark attendance with cooldown check
                last_marked = _cooldown.get(person_id, 0)
                if now - last_marked > COOLDOWN_SECONDS:
                    punch = await record_attendance(person_id, name)
                    if punch:
                        attendance_marked.append(punch)
                        _cooldown[person_id] = now

        faces.append({
            "name": name,
            "person_id": person_id,
            "matched": matched,
            "confidence": confidence,
            "box": {
                "top": top,
                "right": right,
                "bottom": bottom,
                "left": left,
            },
        })

    return {
        "faces": faces,
        "attendance_marked": attendance_marked,
    }
