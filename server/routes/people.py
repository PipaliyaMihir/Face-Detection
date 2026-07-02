"""
routes/people.py — CRUD endpoints for managing people (faces).

Handles image upload, face encoding computation, and MongoDB storage.
"""

import os
import face_recognition
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional

from database import (
    add_person,
    get_all_people,
    get_person,
    update_person,
    delete_person,
)
from face_engine import load_known_faces

router = APIRouter(prefix="/api/people", tags=["People"])

KNOWN_FACES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "known_faces")


def _compute_encoding(image_bytes: bytes) -> list:
    """
    Compute the 128-dim face encoding from image bytes.
    Raises HTTPException if no face is detected.
    """
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file.")

    nparr = np.frombuffer(image_bytes, np.uint8)
    import cv2
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb)

    if not encodings:
        raise HTTPException(
            status_code=400,
            detail="No face detected in the image. Please upload a clear photo with a visible face.",
        )

    # Return the first face's encoding as a plain list of floats
    return encodings[0].tolist()


@router.get("/")
async def list_people(department: Optional[str] = Query(None)):
    """List all registered people, optionally filtered by department."""
    people = await get_all_people(department=department)
    # Build image URLs
    for p in people:
        if p.get("image_path"):
            filename = os.path.basename(p["image_path"])
            p["image_url"] = f"/known_faces/{filename}"
        else:
            p["image_url"] = None
        # Format created_at
        if p.get("created_at"):
            p["created_at"] = p["created_at"].isoformat()
    return people


@router.post("/")
async def create_person(
    name: str = Form(...),
    department: Optional[str] = Form("General"),
    image: UploadFile = File(...),
):
    """
    Register a new person.
    Accepts a name, department, and face image. Computes face encoding and stores everything.
    """
    image_bytes = await image.read()

    # Compute face encoding (raises 400 if no face detected)
    encoding = _compute_encoding(image_bytes)

    dept_name = department.strip() if department else "General"

    # Save to DB first to get the ID
    person_id = await add_person(name, "", encoding, department=dept_name)

    # Save image file
    safe_name = "".join(c for c in name if c.isalnum() or c in " _-").strip().replace(" ", "_")
    filename = f"{person_id}_{safe_name}.jpg"
    filepath = os.path.join(KNOWN_FACES_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    # Update the image path in DB
    await update_person(person_id, image_path=filepath)

    # Reload face encodings in memory
    await load_known_faces()

    return {
        "id": person_id,
        "name": name,
        "department": dept_name,
        "image_url": f"/known_faces/{filename}",
        "message": f"Person '{name}' registered successfully under '{dept_name}'.",
    }


@router.put("/{person_id}")
async def edit_person(
    person_id: str,
    name: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """Update a person's name, department, and/or face image."""
    existing = await get_person(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Person not found.")

    new_encoding = None
    new_image_path = None

    # Only process image if an actual file was uploaded
    if image and hasattr(image, "filename") and image.filename:
        image_bytes = await image.read()
        if len(image_bytes) > 0:
            new_encoding = _compute_encoding(image_bytes)

            # Save new image
            display_name = name or existing["name"]
            safe_name = "".join(c for c in display_name if c.isalnum() or c in " _-").strip().replace(" ", "_")
            filename = f"{person_id}_{safe_name}.jpg"
            filepath = os.path.join(KNOWN_FACES_DIR, filename)

            with open(filepath, "wb") as f:
                f.write(image_bytes)
            new_image_path = filepath

            # Remove old image if different
            old_path = existing.get("image_path", "")
            if old_path and old_path != filepath and os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

    await update_person(
        person_id,
        name=name,
        department=department,
        image_path=new_image_path,
        encoding=new_encoding,
    )

    # Reload face encodings
    await load_known_faces()

    return {"message": "Person updated successfully."}


@router.delete("/{person_id}")
async def remove_person(person_id: str):
    """Delete a person and their face image."""
    existing = await get_person(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Person not found.")

    # Remove image file
    image_path = existing.get("image_path", "")
    if image_path and os.path.exists(image_path):
        os.remove(image_path)

    await delete_person(person_id)

    # Reload face encodings
    await load_known_faces()

    return {"message": "Person deleted successfully."}
