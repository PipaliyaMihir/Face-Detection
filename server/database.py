"""
database.py — MongoDB database layer for the Attendance System.

Uses motor (async MongoDB driver) for non-blocking operations with FastAPI.
Face encodings are stored as lists of floats (native MongoDB arrays).
Includes Department/Class support with Shift Start Time & Late Cutoff Time tracking.
"""

import os
import re
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Load environment variables from .env
load_dotenv()

client: AsyncIOMotorClient = None
db = None


async def init_db():
    """Initialize MongoDB connection and create indexes."""
    global client, db

    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "attendance_system")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Create indexes for faster queries
    await db.people.create_index("name")
    await db.people.create_index("department")
    await db.attendance.create_index("person_id")
    await db.attendance.create_index("date")
    await db.attendance.create_index("department")
    await db.departments.create_index("name", unique=True)

    # Sanitize URL for console display (hide password)
    safe_url = mongo_url.split("@")[-1] if "@" in mongo_url else mongo_url
    print(f"✅ Connected to MongoDB: ...@{safe_url} (Database: {db_name})")


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed.")


# ---------------------------------------------------------------------------
# Helper: Convert MongoDB document to dict with string ID
# ---------------------------------------------------------------------------
def doc_to_dict(doc: dict) -> dict:
    """Convert a MongoDB document to a serializable dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---------------------------------------------------------------------------
# Helper: Parse time string ("09:15 AM", "14:30", "9:00") into minutes from midnight
# ---------------------------------------------------------------------------
def parse_time_to_minutes(time_str: str) -> int:
    """Parse time string to minutes from midnight (0..1439)."""
    if not time_str:
        return 9 * 60 + 15  # Default 09:15 AM

    time_str = time_str.strip().upper()
    try:
        match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', time_str)
        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            meridiem = match.group(3)

            if meridiem == "PM" and hours < 12:
                hours += 12
            elif meridiem == "AM" and hours == 12:
                hours = 0
            return hours * 60 + minutes
    except Exception:
        pass
    return 9 * 60 + 15


# ---------------------------------------------------------------------------
# Department CRUD (With Shift Start & Late Cutoff Time support)
# ---------------------------------------------------------------------------
async def get_all_departments() -> List[Dict[str, Any]]:
    """Get all departments or classes with start and late cutoff times."""
    cursor = db.departments.find({}).sort("name", 1)
    depts = []
    async for doc in cursor:
        depts.append(doc_to_dict(doc))

    if not depts:
        # Pre-seed default departments with start time and late cutoff
        defaults = [
            {"name": "Computer Science", "start_time": "09:00 AM", "late_cutoff": "09:15 AM"},
            {"name": "Information Technology", "start_time": "09:15 AM", "late_cutoff": "09:30 AM"},
            {"name": "Electrical Engineering", "start_time": "09:30 AM", "late_cutoff": "09:45 AM"},
            {"name": "Class 10-A", "start_time": "08:30 AM", "late_cutoff": "08:45 AM"},
            {"name": "Class 12-A", "start_time": "08:30 AM", "late_cutoff": "08:45 AM"},
        ]
        for d in defaults:
            try:
                await db.departments.insert_one({
                    "name": d["name"],
                    "start_time": d["start_time"],
                    "late_cutoff": d["late_cutoff"],
                    "created_at": datetime.utcnow()
                })
            except Exception:
                pass
        cursor = db.departments.find({}).sort("name", 1)
        depts = []
        async for doc in cursor:
            depts.append(doc_to_dict(doc))
    return depts


async def add_department(name: str, start_time: str = "09:00 AM", late_cutoff: str = "09:15 AM") -> str:
    """Add or update a department / class with its shift start & late cutoff times."""
    name = name.strip()
    start_time = start_time.strip() if start_time else "09:00 AM"
    late_cutoff = late_cutoff.strip() if late_cutoff else "09:15 AM"

    existing = await db.departments.find_one({"name": name})
    if existing:
        await db.departments.update_one(
            {"_id": existing["_id"]},
            {"$set": {"start_time": start_time, "late_cutoff": late_cutoff}}
        )
        return str(existing["_id"])

    result = await db.departments.insert_one({
        "name": name,
        "start_time": start_time,
        "late_cutoff": late_cutoff,
        "created_at": datetime.utcnow()
    })
    return str(result.inserted_id)


async def update_department_by_id(dept_id: str, name: Optional[str] = None, start_time: Optional[str] = None, late_cutoff: Optional[str] = None):
    """Update an existing department's details in MongoDB by ID."""
    update_fields = {}
    if name is not None and name.strip():
        update_fields["name"] = name.strip()
    if start_time is not None and start_time.strip():
        update_fields["start_time"] = start_time.strip()
    if late_cutoff is not None and late_cutoff.strip():
        update_fields["late_cutoff"] = late_cutoff.strip()

    if update_fields:
        await db.departments.update_one(
            {"_id": ObjectId(dept_id)},
            {"$set": update_fields}
        )


async def delete_department(dept_id: str):
    """Delete a department / class."""
    await db.departments.delete_one({"_id": ObjectId(dept_id)})


# ---------------------------------------------------------------------------
# People CRUD
# ---------------------------------------------------------------------------
async def add_person(name: str, image_path: str, encoding: list, department: str = "General") -> str:
    """Add a new person to the database."""
    doc = {
        "name": name,
        "department": department or "General",
        "image_path": image_path,
        "face_encoding": encoding,  # list of 128 floats
        "created_at": datetime.utcnow(),
    }
    result = await db.people.insert_one(doc)
    return str(result.inserted_id)


async def get_all_people(department: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all registered people, optionally filtered by department."""
    query = {}
    if department and department != "All":
        query["department"] = department

    cursor = db.people.find(query, {"face_encoding": 0}).sort("created_at", -1)
    people = []
    async for doc in cursor:
        people.append(doc_to_dict(doc))
    return people


async def get_all_people_with_encodings() -> List[Dict[str, Any]]:
    """Get all registered people WITH their face encodings (for loading into memory)."""
    cursor = db.people.find({})
    people = []
    async for doc in cursor:
        people.append(doc_to_dict(doc))
    return people


async def get_person(person_id: str) -> Optional[Dict[str, Any]]:
    """Get a single person by ID."""
    try:
        doc = await db.people.find_one({"_id": ObjectId(person_id)})
        return doc_to_dict(doc) if doc else None
    except Exception:
        return None


async def update_person(
    person_id: str,
    name: Optional[str] = None,
    department: Optional[str] = None,
    image_path: Optional[str] = None,
    encoding: Optional[list] = None,
):
    """Update a person's info. Only non-None fields are updated."""
    update_fields = {}
    if name is not None:
        update_fields["name"] = name
    if department is not None:
        update_fields["department"] = department
    if image_path is not None:
        update_fields["image_path"] = image_path
    if encoding is not None:
        update_fields["face_encoding"] = encoding

    if update_fields:
        await db.people.update_one(
            {"_id": ObjectId(person_id)},
            {"$set": update_fields},
        )


async def delete_person(person_id: str):
    """Delete a person and their attendance records."""
    await db.people.delete_one({"_id": ObjectId(person_id)})
    await db.attendance.delete_many({"person_id": person_id})


# ---------------------------------------------------------------------------
# Attendance (Dual Punch: Check-In & Check-Out + Shift & Cutoff Punctuality)
# ---------------------------------------------------------------------------
async def record_attendance(person_id: str, name: str) -> Optional[Dict[str, Any]]:
    """
    Record attendance for a person.
    - 1st scan of the day = Check-In (Punctuality: On Time <= Start Time < Late <= Late Cutoff < Very Late)
    - 2nd scan of the day = Check-Out (Calculates total hours worked)
    """
    today = date.today().isoformat()  # "YYYY-MM-DD"
    now_utc = datetime.utcnow()
    local_now = datetime.now()
    time_str = local_now.strftime("%I:%M:%S %p")

    # Get person to retrieve department
    person = await get_person(person_id)
    dept_name = person.get("department", "General") if person else "General"

    # Fetch department config for start_time & late_cutoff
    dept_doc = await db.departments.find_one({"name": dept_name})
    dept_start_time = dept_doc.get("start_time", "09:00 AM") if dept_doc else "09:00 AM"
    dept_late_cutoff = dept_doc.get("late_cutoff", "09:15 AM") if dept_doc else "09:15 AM"

    # Check existing attendance for today
    existing = await db.attendance.find_one({
        "person_id": person_id,
        "date": today,
    })

    if not existing:
        # --- CASE A: Check-In (First Punch) ---
        current_minutes = local_now.hour * 60 + local_now.minute
        start_minutes = parse_time_to_minutes(dept_start_time)
        cutoff_minutes = parse_time_to_minutes(dept_late_cutoff)

        if current_minutes <= start_minutes:
            status = "On Time"
        elif current_minutes <= cutoff_minutes:
            status = "Late"
        else:
            status = "Very Late"

        doc = {
            "person_id": person_id,
            "name": name,
            "department": dept_name,
            "dept_start_time": dept_start_time,
            "dept_late_cutoff": dept_late_cutoff,
            "date": today,
            "timestamp": now_utc,
            "time": time_str,
            "check_in": time_str,
            "check_in_time": now_utc,
            "check_out": None,
            "check_out_time": None,
            "work_hours": "In Progress",
            "status": status,
        }
        await db.attendance.insert_one(doc)

        return {
            "type": "check_in",
            "name": name,
            "department": dept_name,
            "dept_start_time": dept_start_time,
            "dept_late_cutoff": dept_late_cutoff,
            "status": status,
            "check_in": time_str,
            "check_out": None,
            "work_hours": "In Progress",
            "message": f"Check-In recorded ({status} — Start: {dept_start_time}, Cutoff: {dept_late_cutoff})"
        }

    else:
        # --- CASE B: Check-Out (Subsequent Punch) ---
        # Cooldown: Skip if check-out was recorded less than 30 seconds ago
        if existing.get("check_out_time"):
            time_diff = (now_utc - existing["check_out_time"]).total_seconds()
            if time_diff < 30:
                return None

        # Cooldown: Skip if check-in was recorded less than 15 seconds ago
        check_in_time = existing.get("check_in_time", existing.get("timestamp", now_utc))
        time_since_in = (now_utc - check_in_time).total_seconds()
        if time_since_in < 15:
            return None

        total_seconds = int((now_utc - check_in_time).total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        if hours > 0:
            work_hours_str = f"{hours}h {minutes}m"
        else:
            work_hours_str = f"{minutes} mins"

        await db.attendance.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "check_out": time_str,
                    "check_out_time": now_utc,
                    "work_hours": work_hours_str,
                }
            }
        )

        return {
            "type": "check_out",
            "name": name,
            "department": dept_name,
            "status": existing.get("status", "Present"),
            "check_in": existing.get("check_in", existing.get("time", "N/A")),
            "check_out": time_str,
            "work_hours": work_hours_str,
            "message": f"Check-Out recorded ({work_hours_str})"
        }


async def get_attendance(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    department: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get attendance records, optionally filtered by date range and department."""
    query = {}
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    if department and department != "All":
        query["department"] = department

    cursor = db.attendance.find(query).sort("timestamp", -1)
    records = []
    async for doc in cursor:
        records.append(doc_to_dict(doc))
    return records


async def get_today_attendance() -> List[Dict[str, Any]]:
    """Get today's attendance records."""
    today = date.today().isoformat()
    cursor = db.attendance.find({"date": today}).sort("timestamp", -1)
    records = []
    async for doc in cursor:
        records.append(doc_to_dict(doc))
    return records


async def get_stats() -> Dict[str, Any]:
    """Get dashboard statistics."""
    total_people = await db.people.count_documents({})
    today = date.today().isoformat()
    today_count = await db.attendance.count_documents({"date": today})
    on_time_count = await db.attendance.count_documents({"date": today, "status": "On Time"})
    late_count = await db.attendance.count_documents({"date": today, "status": {"$in": ["Late", "Very Late"]}})

    # Attendance rate
    attendance_rate = (
        round((today_count / total_people) * 100, 1) if total_people > 0 else 0
    )

    # Recent check-ins (last 5)
    cursor = (
        db.attendance.find({"date": today})
        .sort("timestamp", -1)
        .limit(5)
    )
    recent = []
    async for doc in cursor:
        recent.append({
            "name": doc["name"],
            "department": doc.get("department", "General"),
            "status": doc.get("status", "Present"),
            "check_in": doc.get("check_in", doc.get("time")),
            "check_out": doc.get("check_out"),
            "work_hours": doc.get("work_hours"),
            "time": doc.get("check_out") or doc.get("check_in") or doc.get("time"),
        })

    return {
        "total_people": total_people,
        "today_count": today_count,
        "on_time_count": on_time_count,
        "late_count": late_count,
        "attendance_rate": attendance_rate,
        "recent_checkins": recent,
    }


async def get_person_attendance(person_id: str) -> List[Dict[str, Any]]:
    """Get all attendance records for a specific person."""
    cursor = db.attendance.find({"person_id": person_id}).sort("timestamp", -1)
    records = []
    async for doc in cursor:
        records.append(doc_to_dict(doc))
    return records
