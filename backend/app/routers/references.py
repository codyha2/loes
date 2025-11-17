from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Reference, Course
from app.schemas import ReferenceCreate, ReferenceResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/references", response_model=List[ReferenceResponse])
async def list_references(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tài liệu tham khảo của môn học"""
    statement = select(Reference).where(Reference.course_id == course_id)
    references = session.exec(statement).all()
    return references

@router.post("/references", response_model=ReferenceResponse)
async def create_reference(
    reference_data: ReferenceCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo tài liệu tham khảo mới"""
    # Kiểm tra course tồn tại
    course = session.get(Course, reference_data.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    reference = Reference(**reference_data.model_dump())
    session.add(reference)
    session.commit()
    session.refresh(reference)
    return reference

@router.put("/references/{reference_id}", response_model=ReferenceResponse)
async def update_reference(
    reference_id: int,
    reference_data: ReferenceCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Cập nhật tài liệu tham khảo"""
    reference = session.get(Reference, reference_id)
    if not reference:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu tham khảo")
    
    for key, value in reference_data.model_dump().items():
        setattr(reference, key, value)
    
    session.add(reference)
    session.commit()
    session.refresh(reference)
    return reference

@router.delete("/references/{reference_id}")
async def delete_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Xóa tài liệu tham khảo"""
    reference = session.get(Reference, reference_id)
    if not reference:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu tham khảo")
    
    session.delete(reference)
    session.commit()
    return {"message": "Đã xóa tài liệu tham khảo"}


