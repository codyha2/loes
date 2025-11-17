from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Assessment
from app.schemas import AssessmentCreate, AssessmentResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[AssessmentResponse])
async def list_assessments(
    course_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách đánh giá"""
    if course_id:
        statement = select(Assessment).where(Assessment.course_id == course_id)
        assessments = session.exec(statement).all()
    else:
        assessments = session.exec(select(Assessment)).all()
    return assessments

@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một đánh giá"""
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    return assessment

@router.post("/", response_model=AssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreate,
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Tạo đánh giá mới"""
    assessment = Assessment(**assessment_data.model_dump(), course_id=course_id)
    session.add(assessment)
    session.commit()
    session.refresh(assessment)
    return assessment

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: int,
    assessment_data: AssessmentCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Cập nhật đánh giá"""
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    
    for key, value in assessment_data.model_dump().items():
        setattr(assessment, key, value)
    
    session.add(assessment)
    session.commit()
    session.refresh(assessment)
    return assessment

@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Xóa đánh giá"""
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    
    session.delete(assessment)
    session.commit()
    return {"message": "Đã xóa đánh giá"}


