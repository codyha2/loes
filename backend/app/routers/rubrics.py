from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.database import get_session
from app.models import Rubric, Course, CLO
from app.schemas import RubricCreate, RubricResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/rubrics", response_model=List[RubricResponse])
async def list_rubrics(
    course_id: Optional[int] = None,
    clo_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách rubrics"""
    statement = select(Rubric)
    
    if course_id:
        statement = statement.where(Rubric.course_id == course_id)
    if clo_id:
        statement = statement.where(Rubric.clo_id == clo_id)
    
    rubrics = session.exec(statement).all()
    return rubrics

@router.post("/rubrics", response_model=RubricResponse)
async def create_rubric(
    rubric_data: RubricCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo rubric mới"""
    # Kiểm tra course_id và clo_id nếu có
    if rubric_data.course_id:
        course = session.get(Course, rubric_data.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    if rubric_data.clo_id:
        clo = session.get(CLO, rubric_data.clo_id)
        if not clo:
            raise HTTPException(status_code=404, detail="Không tìm thấy CLO")
    
    rubric = Rubric(**rubric_data.model_dump())
    session.add(rubric)
    session.commit()
    session.refresh(rubric)
    return rubric

@router.put("/rubrics/{rubric_id}", response_model=RubricResponse)
async def update_rubric(
    rubric_id: int,
    rubric_data: RubricCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Cập nhật rubric"""
    rubric = session.get(Rubric, rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Không tìm thấy rubric")
    
    for key, value in rubric_data.model_dump().items():
        setattr(rubric, key, value)
    
    session.add(rubric)
    session.commit()
    session.refresh(rubric)
    return rubric

@router.delete("/rubrics/{rubric_id}")
async def delete_rubric(
    rubric_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Xóa rubric"""
    rubric = session.get(Rubric, rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Không tìm thấy rubric")
    
    session.delete(rubric)
    session.commit()
    return {"message": "Đã xóa rubric"}


