"""
Service tính toán CLO achievement và TLĐ (Tỷ lệ đạt)
"""
from sqlmodel import Session, select
from typing import Dict, List, Any
from datetime import datetime
from app.models import (
    Course, CLO, Assessment, Question, Student, StudentScore, StudentCLOResult, CLOPLOMapping
)

def calculate_student_clo_achievement(
    session: Session,
    student_id: int,
    clo_id: int
) -> Dict[str, Any]:
    """
    Tính mức đạt CLO cho một sinh viên
    
    Công thức:
    achievement = (tổng điểm có trọng số của các câu hỏi map với CLO) / (tổng điểm tối đa có trọng số)
    """
    clo = session.get(CLO, clo_id)
    if not clo:
        return {"achievement": 0.0, "achieved": False}
    
    # Lấy tất cả questions map với CLO này
    statement = select(Question)
    all_questions = session.exec(statement).all()
    relevant_questions = [q for q in all_questions if clo_id in (q.clo_ids or [])]
    
    if not relevant_questions:
        return {"achievement": 0.0, "achieved": False}
    
    # Tính tổng điểm có trọng số
    weighted_score = 0.0
    weighted_max = 0.0
    
    for question in relevant_questions:
        # Lấy assessment để có weight
        assessment = session.get(Assessment, question.assessment_id)
        if not assessment:
            continue
        
        weight = assessment.weight
        
        # Lấy điểm của student cho question này
        statement = select(StudentScore).where(
            StudentScore.student_id == student_id,
            StudentScore.question_id == question.id
        )
        score_obj = session.exec(statement).first()
        
        if score_obj:
            weighted_score += score_obj.score * weight
        weighted_max += question.max_score * weight
    
    achievement = weighted_score / weighted_max if weighted_max > 0 else 0.0
    achieved = achievement >= clo.threshold
    
    return {
        "achievement": achievement,
        "achieved": achieved
    }

def calculate_class_tld_clo(
    session: Session,
    course_id: int,
    clo_id: int,
    n_tlkqclo: float = 0.6
) -> float:
    """
    Tính TLĐ CLO (Tỷ lệ đạt CLO) cho lớp
    
    TLĐ CLO = số sinh viên đạt CLO / số sinh viên được đánh giá
    """
    # Lấy tất cả students đã có điểm trong course này
    # (thông qua questions của course)
    statement = select(Question).join(Assessment).where(Assessment.course_id == course_id)
    questions = session.exec(statement).all()
    question_ids = [q.id for q in questions]
    
    if not question_ids:
        return 0.0
    
    # Lấy students có điểm
    statement = select(StudentScore.student_id).where(
        StudentScore.question_id.in_(question_ids)
    ).distinct()
    student_ids = [row[0] for row in session.exec(statement).all()]
    
    if not student_ids:
        return 0.0
    
    # Tính achievement cho từng student
    achieved_count = 0
    for student_id in student_ids:
        result = calculate_student_clo_achievement(session, student_id, clo_id)
        if result["achieved"]:
            achieved_count += 1
    
    tld = achieved_count / len(student_ids) if student_ids else 0.0
    return tld

def calculate_program_tld_plo(
    session: Session,
    program_id: int,
    plo_id: int,
    n_tlplo: float = 0.7
) -> float:
    """
    Tính TLĐ PLO (Tỷ lệ đạt PLO) cho chương trình
    
    Công thức:
    TLĐ PLO = (Σ T_j * số SV đạt CLOs map với PLO) / (Σ T_j * tổng số SV)
    
    Trong đó T_j là số tín chỉ của course j
    Chỉ tính các CLOs có mapping với PLO (contribution_level M, N, hoặc L)
    """
    from app.models import Program, Course, CLO
    
    # Lấy courses trong program
    statement = select(Course).where(Course.program_id == program_id)
    courses = session.exec(statement).all()
    
    if not courses:
        return 0.0
    
    # Lấy tất cả CLO-PLO mappings cho PLO này
    statement = select(CLOPLOMapping).where(CLOPLOMapping.plo_id == plo_id)
    mappings = session.exec(statement).all()
    
    # Tạo dict mapping clo_id -> contribution_level (chỉ lấy M, N, L)
    clo_mapping_dict = {}
    for mapping in mappings:
        if mapping.contribution_level in ['M', 'N', 'L']:
            clo_mapping_dict[mapping.clo_id] = mapping.contribution_level
    
    if not clo_mapping_dict:
        # Không có CLO nào map với PLO này
        return 0.0
    
    total_weighted_achieved = 0.0
    total_weighted_students = 0.0
    
    for course in courses:
        T_j = course.credits
        
        # Lấy CLOs của course
        statement = select(CLO).where(CLO.course_id == course.id)
        clos = session.exec(statement).all()
        
        if not clos:
            continue
        
        # Lọc chỉ lấy CLOs có mapping với PLO
        mapped_clos = [clo for clo in clos if clo.id in clo_mapping_dict]
        
        if not mapped_clos:
            continue
        
        # Lấy students có điểm trong course
        statement = select(Question).join(Assessment).where(Assessment.course_id == course.id)
        questions = session.exec(statement).all()
        question_ids = [q.id for q in questions]
        
        if not question_ids:
            continue
        
        statement = select(StudentScore.student_id).where(
            StudentScore.question_id.in_(question_ids)
        ).distinct()
        student_ids = [row[0] for row in session.exec(statement).all()]
        
        if not student_ids:
            continue
        
        # Tính số SV đạt CLOs (chỉ tính các CLOs có mapping)
        for clo in mapped_clos:
            contribution_level = clo_mapping_dict[clo.id]
            # Trọng số theo contribution level: M=1.0, N=0.66, L=0.33
            contribution_weight = {
                'M': 1.0,
                'N': 0.66,
                'L': 0.33
            }.get(contribution_level, 1.0)
            
            achieved_count = 0
            for student_id in student_ids:
                result = calculate_student_clo_achievement(session, student_id, clo.id)
                if result["achieved"]:
                    achieved_count += 1
            
            # Áp dụng trọng số contribution level
            total_weighted_achieved += T_j * contribution_weight * achieved_count
            total_weighted_students += T_j * contribution_weight * len(student_ids)
    
    tld = total_weighted_achieved / total_weighted_students if total_weighted_students > 0 else 0.0
    return tld


