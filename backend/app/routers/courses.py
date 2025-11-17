from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import text as sql_text
from typing import List
from app.database import get_session
from app.models import (
    Course, CLO, Assessment, Question, CoursePrerequisite,
    Rubric, Reference, StudentCLOResult, CLOPLOMapping, StudentScore
)
from app.schemas import CourseCreate, CourseResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
async def list_courses(
    program_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách môn học - Tạm thời không cần auth"""
    if program_id:
        statement = select(Course).where(Course.program_id == program_id)
        courses = session.exec(statement).all()
    else:
        courses = session.exec(select(Course)).all()
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một môn học"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    return course

@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    program_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.PROGRAM_MANAGER, UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    """Tạo môn học mới"""
    course = Course(**course_data.model_dump(), program_id=program_id)
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.PROGRAM_MANAGER, UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    """Cập nhật môn học"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    for key, value in course_data.model_dump().items():
        setattr(course, key, value)
    
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER]))
):
    """Xóa môn học - Cho phép ADMIN, INSTRUCTOR, PROGRAM_MANAGER"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    # Xóa các dữ liệu liên quan trước (cascade delete)
    try:
        # 1. Xóa CLOs và dữ liệu liên quan
        clos = session.exec(select(CLO).where(CLO.course_id == course_id)).all()
        for clo in clos:
            # Xóa StudentCLOResult
            student_results = session.exec(select(StudentCLOResult).where(StudentCLOResult.clo_id == clo.id)).all()
            for result in student_results:
                session.delete(result)
            
            # Xóa CLOPLOMapping
            mappings = session.exec(select(CLOPLOMapping).where(CLOPLOMapping.clo_id == clo.id)).all()
            for mapping in mappings:
                session.delete(mapping)
            
            # Xóa Rubric liên quan đến CLO
            rubrics = session.exec(select(Rubric).where(Rubric.clo_id == clo.id)).all()
            for rubric in rubrics:
                session.delete(rubric)
            
            # Xóa CLO
            session.delete(clo)
        
        # 2. Xóa Assessments và Questions (xóa questions trước để tránh foreign key violation)
        # Xóa bằng SQL trực tiếp để tránh autoflush issues
        assessments = session.exec(select(Assessment).where(Assessment.course_id == course_id)).all()
        assessment_ids = [a.id for a in assessments]
        
        if assessment_ids:
            # Lấy SQLAlchemy session từ SQLModel session
            sa_session = session
            
            # Xóa tất cả StudentScores của questions thuộc assessments này
            sa_session.execute(sql_text("""
                DELETE FROM studentscore 
                WHERE question_id IN (
                    SELECT id FROM question WHERE assessment_id = ANY(:assessment_ids)
                )
            """), {"assessment_ids": assessment_ids})
            
            # Xóa tất cả Questions thuộc assessments này
            sa_session.execute(sql_text("""
                DELETE FROM question WHERE assessment_id = ANY(:assessment_ids)
            """), {"assessment_ids": assessment_ids})
            
            # Commit để xóa hết questions và scores trước
            session.commit()
            
            # Sau đó mới xóa Assessments
            sa_session.execute(sql_text("""
                DELETE FROM assessment WHERE id = ANY(:assessment_ids)
            """), {"assessment_ids": assessment_ids})
            
            # Commit để xóa assessments
            session.commit()
        
        # 3. Xóa CoursePrerequisites
        prereqs = session.exec(select(CoursePrerequisite).where(
            (CoursePrerequisite.course_id == course_id) | 
            (CoursePrerequisite.prereq_course_id == course_id)
        )).all()
        for prereq in prereqs:
            session.delete(prereq)
        
        # 4. Xóa Rubrics liên quan đến course (nếu có)
        course_rubrics = session.exec(select(Rubric).where(Rubric.course_id == course_id)).all()
        for rubric in course_rubrics:
            session.delete(rubric)
        
        # 5. Xóa References
        references = session.exec(select(Reference).where(Reference.course_id == course_id)).all()
        for ref in references:
            session.delete(ref)
        
        # 6. Cuối cùng xóa Course
        session.delete(course)
        session.commit()
        
        return {"message": "Đã xóa môn học và tất cả dữ liệu liên quan"}
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xóa môn học: {str(e)}"
        )

