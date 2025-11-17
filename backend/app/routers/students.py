from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Student
from app.schemas import StudentCreate, StudentResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[StudentResponse])
async def list_students(
    cohort: str = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách sinh viên"""
    if cohort:
        statement = select(Student).where(Student.cohort == cohort)
        students = session.exec(statement).all()
    else:
        students = session.exec(select(Student)).all()
    return students

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một sinh viên"""
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")
    return student

@router.post("/", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Tạo sinh viên mới"""
    student = Student(**student_data.model_dump())
    session.add(student)
    session.commit()
    session.refresh(student)
    return student

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Cập nhật sinh viên"""
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")
    
    for key, value in student_data.model_dump().items():
        setattr(student, key, value)
    
    session.add(student)
    session.commit()
    session.refresh(student)
    return student

@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Xóa sinh viên"""
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")
    
    session.delete(student)
    session.commit()
    return {"message": "Đã xóa sinh viên"}


