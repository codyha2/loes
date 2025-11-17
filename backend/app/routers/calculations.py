from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from typing import Dict, Any
from app.database import get_session
from app.models import Course, CLO, Student, StudentCLOResult
from app.schemas import (
    CalculateCourseRequest, CalculateCourseResponse,
    CalculateProgramRequest, CalculateProgramResponse
)
from app.auth import get_current_user
from app.services.calculation_service import (
    calculate_student_clo_achievement,
    calculate_class_tld_clo,
    calculate_program_tld_plo
)

router = APIRouter()

@router.post("/course/{course_id}", response_model=CalculateCourseResponse)
async def calculate_course(
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Tính toán mức đạt CLO (per student) và TLĐ CLO (per class)
    Lưu kết quả vào StudentCLOResult
    """
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    # Lấy tất cả CLOs của course
    statement = select(CLO).where(CLO.course_id == course_id)
    clos = session.exec(statement).all()
    
    if not clos:
        raise HTTPException(status_code=400, detail="Môn học chưa có CLO")
    
    # Lấy students có điểm trong course
    from app.models import Question, Assessment, StudentScore
    statement = select(Question).join(Assessment).where(Assessment.course_id == course_id)
    questions = session.exec(statement).all()
    question_ids = [q.id for q in questions]
    
    if not question_ids:
        raise HTTPException(status_code=400, detail="Môn học chưa có điểm")
    
    statement = select(StudentScore.student_id).where(
        StudentScore.question_id.in_(question_ids)
    ).distinct()
    student_ids = [row[0] for row in session.exec(statement).all()]
    
    student_results = []
    class_tld_clo = {}
    
    # Tính cho từng CLO
    for clo in clos:
        # Tính cho từng student
        achieved_count = 0
        for student_id in student_ids:
            result = calculate_student_clo_achievement(session, student_id, clo.id)
            
            # Lưu vào StudentCLOResult
            # Kiểm tra xem đã có record chưa
            statement = select(StudentCLOResult).where(
                StudentCLOResult.student_id == student_id,
                StudentCLOResult.clo_id == clo.id
            )
            existing = session.exec(statement).first()
            
            if existing:
                existing.achievement = result["achievement"]
                existing.achieved = result["achieved"]
                existing.assessed_at = datetime.utcnow()
                existing.source = "calculation_endpoint"
                session.add(existing)
            else:
                new_result = StudentCLOResult(
                    student_id=student_id,
                    clo_id=clo.id,
                    achievement=result["achievement"],
                    achieved=result["achieved"],
                    assessed_at=datetime.utcnow(),
                    source="calculation_endpoint"
                )
                session.add(new_result)
            
            if result["achieved"]:
                achieved_count += 1
            
            student_results.append({
                "student_id": student_id,
                "clo_id": clo.id,
                "achievement": result["achievement"],
                "achieved": result["achieved"]
            })
        
        # Tính TLĐ CLO cho class
        tld = calculate_class_tld_clo(session, course_id, clo.id)
        class_tld_clo[str(clo.id)] = tld
    
    session.commit()
    
    return CalculateCourseResponse(
        course_id=course_id,
        student_results=student_results,
        class_tld_clo=class_tld_clo,
        message=f"Đã tính toán cho {len(student_ids)} sinh viên và {len(clos)} CLOs"
    )

@router.post("/program/{program_id}", response_model=CalculateProgramResponse)
async def calculate_program(
    program_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Tính toán TLĐ PLO cho chương trình
    """
    from app.models import Program, PLO
    
    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương trình đào tạo")
    
    # Lấy tất cả PLOs
    statement = select(PLO).where(PLO.program_id == program_id)
    plos = session.exec(statement).all()
    
    if not plos:
        raise HTTPException(status_code=400, detail="Chương trình chưa có PLO")
    
    tld_plo = {}
    
    for plo in plos:
        tld = calculate_program_tld_plo(session, program_id, plo.id)
        tld_plo[str(plo.id)] = tld
    
    return CalculateProgramResponse(
        program_id=program_id,
        tld_plo=tld_plo,
        message=f"Đã tính toán TLĐ cho {len(plos)} PLOs"
    )


