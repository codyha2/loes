from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Question
from app.schemas import QuestionCreate, QuestionResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    assessment_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách câu hỏi"""
    if assessment_id:
        statement = select(Question).where(Question.assessment_id == assessment_id)
        questions = session.exec(statement).all()
    else:
        questions = session.exec(select(Question)).all()
    return questions

@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một câu hỏi"""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    return question

@router.post("/", response_model=QuestionResponse)
async def create_question(
    question_data: QuestionCreate,
    assessment_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Tạo câu hỏi mới"""
    question = Question(**question_data.model_dump(), assessment_id=assessment_id)
    session.add(question)
    session.commit()
    session.refresh(question)
    return question

@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_data: QuestionCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Cập nhật câu hỏi"""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    
    for key, value in question_data.model_dump().items():
        setattr(question, key, value)
    
    session.add(question)
    session.commit()
    session.refresh(question)
    return question

@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Xóa câu hỏi"""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    
    session.delete(question)
    session.commit()
    return {"message": "Đã xóa câu hỏi"}



