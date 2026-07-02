"""
routes/departments.py — Department / Class management endpoints.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Form
from database import get_all_departments, add_department, update_department_by_id, delete_department

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("/")
async def list_departments():
    """Get list of all departments / classes."""
    return await get_all_departments()


@router.post("/")
async def create_department(
    name: str = Form(...),
    start_time: Optional[str] = Form("09:00 AM"),
    late_cutoff: Optional[str] = Form("09:15 AM"),
):
    """Create or update a department / class with its start & late cutoff times."""
    clean_name = name.strip()
    clean_start = start_time.strip() if start_time else "09:00 AM"
    clean_cutoff = late_cutoff.strip() if late_cutoff else "09:15 AM"

    if not clean_name:
        raise HTTPException(status_code=400, detail="Department name cannot be empty")

    dept_id = await add_department(clean_name, start_time=clean_start, late_cutoff=clean_cutoff)
    return {
        "id": dept_id,
        "name": clean_name,
        "start_time": clean_start,
        "late_cutoff": clean_cutoff,
        "message": f"Department '{clean_name}' (Start: {clean_start}, Late Cutoff: {clean_cutoff}) saved successfully"
    }


@router.put("/{dept_id}")
async def edit_department(
    dept_id: str,
    name: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    late_cutoff: Optional[str] = Form(None),
):
    """Update a department / class name, start time, or late cutoff time."""
    await update_department_by_id(
        dept_id,
        name=name,
        start_time=start_time,
        late_cutoff=late_cutoff,
    )
    return {"message": "Department updated successfully"}


@router.delete("/{dept_id}")
async def remove_department(dept_id: str):
    """Delete a department / class."""
    await delete_department(dept_id)
    return {"message": "Department deleted successfully"}
