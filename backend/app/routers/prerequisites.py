from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Dict, Any
from app.database import get_session
from app.models import (
    CoursePrerequisite, Course, CLO, Student, StudentCLOResult,
    PrerequisiteType, ConditionType
)
from app.schemas import (
    PrerequisiteCreate, PrerequisiteResponse,
    SuggestPrerequisiteRequest, SuggestPrerequisiteResponse,
    ImpactAnalysisResponse
)
from app.auth import get_current_user, require_role, UserRole
from app.services.prerequisite_service import (
    check_student_meets_prereq,
    suggest_prerequisites
)

router = APIRouter()

@router.get("/{course_id}/prerequisites", response_model=List[PrerequisiteResponse])
async def list_prerequisites(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách điều kiện tiên quyết của môn học"""
    statement = select(CoursePrerequisite).where(
        CoursePrerequisite.course_id == course_id
    )
    prereqs = session.exec(statement).all()
    return prereqs

@router.post("/{course_id}/prerequisites", response_model=PrerequisiteResponse)
async def create_prerequisite(
    course_id: int,
    prereq_data: PrerequisiteCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # Cho phép tất cả user đã đăng nhập
):
    """Tạo điều kiện tiên quyết mới"""
    # Kiểm tra course tồn tại
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    # Kiểm tra prereq_course tồn tại
    prereq_course = session.get(Course, prereq_data.prereq_course_id)
    if not prereq_course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học tiên quyết")
    
    prereq = CoursePrerequisite(
        **prereq_data.model_dump(),
        course_id=course_id,
        created_by=current_user.id
    )
    session.add(prereq)
    session.commit()
    session.refresh(prereq)
    return prereq

@router.put("/{course_id}/prerequisites/{prereq_id}", response_model=PrerequisiteResponse)
async def update_prerequisite(
    course_id: int,
    prereq_id: int,
    prereq_data: PrerequisiteCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # Cho phép tất cả user đã đăng nhập
):
    """Cập nhật điều kiện tiên quyết"""
    prereq = session.get(CoursePrerequisite, prereq_id)
    if not prereq or prereq.course_id != course_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy điều kiện tiên quyết")
    
    for key, value in prereq_data.model_dump().items():
        setattr(prereq, key, value)
    
    session.add(prereq)
    session.commit()
    session.refresh(prereq)
    return prereq

@router.delete("/{course_id}/prerequisites/{prereq_id}")
async def delete_prerequisite(
    course_id: int,
    prereq_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # Cho phép tất cả user đã đăng nhập
):
    """Xóa điều kiện tiên quyết"""
    prereq = session.get(CoursePrerequisite, prereq_id)
    if not prereq or prereq.course_id != course_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy điều kiện tiên quyết")
    
    session.delete(prereq)
    session.commit()
    return {"message": "Đã xóa điều kiện tiên quyết"}

@router.post("/{course_id}/prerequisites/suggest", response_model=List[SuggestPrerequisiteResponse])
async def suggest_prerequisites_endpoint(
    course_id: int,
    request: SuggestPrerequisiteRequest,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Gợi ý môn học tiên quyết dựa trên CLOs (rule-based AI)"""
    suggestions = suggest_prerequisites(
        session=session,
        clos=request.clos,
        domain=request.domain
    )
    return suggestions

@router.get("/{course_id}/prerequisites/impact", response_model=ImpactAnalysisResponse)
async def analyze_prerequisite_impact(
    course_id: int,
    cohort_id: str = Query(None, description="Lọc theo cohort"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Phân tích tác động: số sinh viên không đáp ứng điều kiện tiên quyết"""
    # Lấy danh sách prerequisites
    statement = select(CoursePrerequisite).where(
        CoursePrerequisite.course_id == course_id
    )
    prereqs = session.exec(statement).all()
    
    if not prereqs:
        return ImpactAnalysisResponse(
            total_students=0,
            missing_count=0,
            missing_students=[],
            risk_score=0.0
        )
    
    # Lấy danh sách sinh viên
    if cohort_id:
        statement = select(Student).where(Student.cohort == cohort_id)
    else:
        statement = select(Student)
    students = session.exec(statement).all()
    
    missing_students = []
    for student in students:
        missing_courses = []
        missing_course_details = []  # Lưu thông tin chi tiết: tên môn và trạng thái
        
        for prereq in prereqs:
            result = check_student_meets_prereq(session, student.id, prereq)
            if not result["meets"]:
                # Lấy tên môn học từ prereq_course_id
                prereq_course = session.get(Course, prereq.prereq_course_id)
                course_name = prereq_course.title if prereq_course else f"Môn học ID {prereq.prereq_course_id}"
                
                # Xác định trạng thái: Chưa học hoặc Chưa đạt
                details = result.get("details", "")
                status = "Chưa học"
                if "Chưa đạt:" in details:
                    status = "Chưa đạt"
                
                missing_courses.append(course_name)
                missing_course_details.append({
                    "course_name": course_name,
                    "status": status
                })
        
        if missing_courses:
            missing_students.append({
                "id": student.id,
                "name": student.name,
                "student_number": student.student_number,
                "reason": ", ".join(missing_courses),
                "missing_courses": missing_courses,
                "missing_course_details": missing_course_details
            })
    
    total_students = len(students)
    missing_count = len(missing_students)
    risk_score = missing_count / total_students if total_students > 0 else 0.0
    
    return ImpactAnalysisResponse(
        total_students=total_students,
        missing_count=missing_count,
        missing_students=missing_students,
        risk_score=risk_score
    )

