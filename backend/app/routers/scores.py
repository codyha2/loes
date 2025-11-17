from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import StudentScore
from app.schemas import StudentScoreCreate, StudentScoreResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[StudentScoreResponse])
async def list_scores(
    student_id: int = None,
    question_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách điểm"""
    statement = select(StudentScore)
    if student_id:
        statement = statement.where(StudentScore.student_id == student_id)
    if question_id:
        statement = statement.where(StudentScore.question_id == question_id)
    
    scores = session.exec(statement).all()
    return scores

@router.get("/{score_id}", response_model=StudentScoreResponse)
async def get_score(
    score_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một điểm"""
    score = session.get(StudentScore, score_id)
    if not score:
        raise HTTPException(status_code=404, detail="Không tìm thấy điểm")
    return score

@router.post("/", response_model=StudentScoreResponse)
async def create_score(
    score_data: StudentScoreCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo điểm mới"""
    score = StudentScore(**score_data.model_dump())
    session.add(score)
    session.commit()
    session.refresh(score)
    return score

@router.post("/batch", response_model=List[StudentScoreResponse])
async def create_scores_batch(
    scores_data: List[StudentScoreCreate],
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo nhiều điểm cùng lúc (cho import CSV)"""
    scores = []
    for score_data in scores_data:
        score = StudentScore(**score_data.model_dump())
        session.add(score)
        scores.append(score)
    session.commit()
    for score in scores:
        session.refresh(score)
    return scores

@router.put("/{score_id}", response_model=StudentScoreResponse)
async def update_score(
    score_id: int,
    score_data: StudentScoreCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Cập nhật điểm"""
    score = session.get(StudentScore, score_id)
    if not score:
        raise HTTPException(status_code=404, detail="Không tìm thấy điểm")
    
    for key, value in score_data.model_dump().items():
        setattr(score, key, value)
    
    session.add(score)
    session.commit()
    session.refresh(score)
    return score

@router.delete("/{score_id}")
async def delete_score(
    score_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Xóa điểm"""
    score = session.get(StudentScore, score_id)
    if not score:
        raise HTTPException(status_code=404, detail="Không tìm thấy điểm")
    
    session.delete(score)
    session.commit()
    return {"message": "Đã xóa điểm"}


