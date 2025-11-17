from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import Optional
from app.database import get_session
from app.models import Course, CLO, Assessment, Question, CoursePrerequisite, Rubric, CLOPLOMapping
from app.auth import get_current_user
from app.services.export_service import generate_course_docx
import io

router = APIRouter()

@router.post("/course/{course_id}")
async def export_course_word(
    course_id: int,
    instructor_name: str = Form(...),
    instructor_email: str = Form(...),
    instructor_title: str = Form(''),
    department: str = Form(''),
    academic_year: str = Form(''),
    include_prereqs: bool = Form(True),
    include_rubrics: bool = Form(True),
    template_file: UploadFile | None = File(None),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Xuất đề cương học phần ra file Word (.docx)
    """
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    # Lấy CLOs
    statement = select(CLO).where(CLO.course_id == course_id)
    clos = session.exec(statement).all()
    
    # Lấy Assessments
    statement = select(Assessment).where(Assessment.course_id == course_id)
    assessments = session.exec(statement).all()
    
    # Lấy Questions
    question_data = []
    for assessment in assessments:
        statement = select(Question).where(Question.assessment_id == assessment.id)
        questions = session.exec(statement).all()
        question_data.append({
            "assessment": assessment,
            "questions": questions
        })
    
    # Lấy Prerequisites nếu cần
    prerequisites = []
    if include_prereqs:
        statement = select(CoursePrerequisite).where(
            CoursePrerequisite.course_id == course_id
        )
        prerequisites = session.exec(statement).all()
    
    # Lấy Rubrics nếu cần
    rubrics = []
    if include_rubrics:
        statement = select(Rubric).where(Rubric.course_id == course_id)
        rubrics = session.exec(statement).all()
    
    # Lấy Program info
    from app.models import Program
    program = session.get(Program, course.program_id)
    
    # Generate Word document
    template_bytes = await template_file.read() if template_file else None
    
    docx_bytes = generate_course_docx(
        session=session,
        course=course,
        program=program,
        clos=clos,
        assessments=assessments,
        question_data=question_data,
        prerequisites=prerequisites,
        rubrics=rubrics,
        instructor_name=instructor_name,
        instructor_email=instructor_email,
        instructor_title=instructor_title or "",
        department=department or "",
        academic_year=academic_year or "",
        include_prereqs=include_prereqs,
        include_rubrics=include_rubrics,
        template_bytes=template_bytes
    )
    
    # Return as streaming response
    filename = f"De_cuong_{course.code}_{course.version_year}.docx"
    
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

