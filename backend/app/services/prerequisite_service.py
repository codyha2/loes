"""
Service xử lý logic điều kiện tiên quyết
TODO: Có thể nâng cấp bằng ML embeddings (SBERT, sentence-transformers) 
để tính toán similarity giữa CLOs chính xác hơn
"""
from sqlmodel import Session, select
from typing import List, Dict, Any
import re
from app.models import (
    Course, CLO, CoursePrerequisite, Student, StudentCLOResult,
    ConditionType, BloomLevel
)

# Vietnamese stopwords (basic list - có thể mở rộng)
VIETNAMESE_STOPWORDS = {
    "và", "của", "cho", "với", "trong", "là", "được", "các", "một", "có",
    "về", "theo", "từ", "này", "đó", "nào", "đã", "sẽ", "đến", "để"
}

def preprocess_text(text: str) -> List[str]:
    """Tiền xử lý văn bản: lowercase, tokenize, loại bỏ stopwords"""
    text = text.lower()
    # Loại bỏ dấu câu
    text = re.sub(r'[^\w\s]', ' ', text)
    tokens = text.split()
    # Loại bỏ stopwords
    tokens = [t for t in tokens if t not in VIETNAMESE_STOPWORDS and len(t) > 2]
    return tokens

def jaccard_similarity(set1: set, set2: set) -> float:
    """Tính Jaccard similarity giữa 2 sets"""
    if not set1 and not set2:
        return 1.0
    if not set1 or not set2:
        return 0.0
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return intersection / union if union > 0 else 0.0

def bloom_level_to_numeric(bloom_level: str) -> int:
    """Chuyển Bloom level thành số (1-6)"""
    mapping = {
        "Remember": 1,
        "Understand": 2,
        "Apply": 3,
        "Analyze": 4,
        "Evaluate": 5,
        "Create": 6
    }
    return mapping.get(bloom_level, 3)

def suggest_prerequisites(
    session: Session,
    clos: List[Dict[str, Any]],
    domain: str = "Tourism"
) -> List[Dict[str, Any]]:
    """
    Gợi ý môn học tiên quyết dựa trên CLOs (rule-based)
    
    Algorithm:
    1. Preprocess CLO texts từ input
    2. Lấy tất cả courses khác (trừ course hiện tại nếu có)
    3. Với mỗi candidate course, tính:
       - overlap_score: Jaccard similarity giữa keywords
       - bloom_score: dựa trên avg bloom level gap
    4. confidence = 0.6 * overlap_score + 0.4 * bloom_score
    5. Trả về top 5 candidates
    
    TODO: Có thể thay thế bằng ML embeddings:
    - Sử dụng sentence-transformers với model tiếng Việt
    - Tính cosine similarity giữa CLO embeddings
    - Có thể fine-tune trên domain Tourism
    """
    # Preprocess input CLOs
    input_keywords = set()
    input_bloom_levels = []
    
    for clo in clos:
        text = clo.get("text", "")
        bloom = clo.get("bloom_level", "Apply")
        keywords = preprocess_text(text)
        input_keywords.update(keywords)
        input_bloom_levels.append(bloom_level_to_numeric(bloom))
    
    avg_input_bloom = sum(input_bloom_levels) / len(input_bloom_levels) if input_bloom_levels else 3
    
    # Lấy tất cả courses
    courses = session.exec(select(Course)).all()
    
    candidates = []
    
    for course in courses:
        # Lấy CLOs của course này
        statement = select(CLO).where(CLO.course_id == course.id)
        course_clos = session.exec(statement).all()
        
        if not course_clos:
            continue
        
        # Tính overlap với CLOs của course
        course_keywords = set()
        course_bloom_levels = []
        
        for clo in course_clos:
            keywords = preprocess_text(clo.text)
            course_keywords.update(keywords)
            course_bloom_levels.append(bloom_level_to_numeric(clo.bloom_level))
        
        avg_course_bloom = sum(course_bloom_levels) / len(course_bloom_levels) if course_bloom_levels else 3
        
        # Tính scores
        overlap_score = jaccard_similarity(input_keywords, course_keywords)
        bloom_gap = abs(avg_input_bloom - avg_course_bloom)
        bloom_score = 1.0 - (bloom_gap / 6.0)  # Normalize về 0-1
        bloom_score = max(0.0, min(1.0, bloom_score))
        
        confidence = 0.6 * overlap_score + 0.4 * bloom_score
        
        # Tạo match_reasons
        match_reasons = []
        if overlap_score > 0.2:
            common_keywords = input_keywords & course_keywords
            if common_keywords:
                match_reasons.append(f"Từ khóa chung: {', '.join(list(common_keywords)[:3])}")
        
        bloom_diff = avg_input_bloom - avg_course_bloom
        if bloom_diff > 0:
            match_reasons.append(f"Bloom level cao hơn {bloom_diff:.1f} bậc")
        elif bloom_diff < 0:
            match_reasons.append(f"Bloom level thấp hơn {abs(bloom_diff):.1f} bậc")
        
        candidates.append({
            "course_id": course.id,
            "code": course.code,
            "title": course.title,
            "confidence": confidence,
            "match_reasons": match_reasons if match_reasons else ["Không có lý do cụ thể"]
        })
    
    # Sắp xếp theo confidence và trả về top 5
    candidates.sort(key=lambda x: x["confidence"], reverse=True)
    return candidates[:5]

def check_student_meets_prereq(
    session: Session,
    student_id: int,
    prereq: CoursePrerequisite
) -> Dict[str, Any]:
    """
    Kiểm tra sinh viên có đáp ứng điều kiện tiên quyết không
    
    Hỗ trợ các loại điều kiện:
    - pass_course: đã pass môn học
    - clo_achievement: đạt một tỷ lệ CLOs nhất định
    - plo_threshold: đạt threshold của PLO
    - min_score: điểm tối thiểu
    """
    condition_type = prereq.condition_type
    payload = prereq.condition_payload or {}
    
    if condition_type == ConditionType.PASS_COURSE:
        # TODO: Cần có bảng StudentCourseResult để track pass/fail
        # Tạm thời kiểm tra qua StudentCLOResult
        prereq_course_id = prereq.prereq_course_id
        statement = select(CLO).where(CLO.course_id == prereq_course_id)
        prereq_clos = session.exec(statement).all()
        prereq_clo_ids = [clo.id for clo in prereq_clos]
        
        if not prereq_clo_ids:
            # Môn học tiên quyết chưa có CLO, không thể kiểm tra
            return {
                "meets": True,  # Tạm thời coi là đáp ứng nếu chưa có CLO
                "details": "Môn học tiên quyết chưa có CLO để kiểm tra"
            }
        
        # Kiểm tra có CLO nào của prereq course đạt không
        statement = select(StudentCLOResult).where(
            StudentCLOResult.student_id == student_id,
            StudentCLOResult.clo_id.in_(prereq_clo_ids)
        )
        results = session.exec(statement).all()
        
        # Lấy thông tin môn học tiên quyết
        prereq_course = session.get(Course, prereq_course_id)
        prereq_course_name = prereq_course.title if prereq_course else f"Môn học ID {prereq_course_id}"
        
        # Nếu sinh viên chưa có bất kỳ kết quả nào cho môn học tiên quyết, coi là chưa học
        if not results:
            return {
                "meets": False,
                "details": f"Chưa học: {prereq_course_name}",
                "missing_courses": [prereq_course_name]
            }
        
        achieved_clos = [r for r in results if r.achieved]
        
        # Nếu có ít nhất 1 CLO đạt, coi là đã pass
        meets = len(achieved_clos) > 0
        prereq_course = session.get(Course, prereq_course_id)
        prereq_course_name = prereq_course.title if prereq_course else f"Môn học ID {prereq_course_id}"
        
        return {
            "meets": meets,
            "details": f"Đã hoàn thành: {prereq_course_name}" if meets else f"Chưa đạt: {prereq_course_name}",
            "missing_courses": [] if meets else [prereq_course_name]
        }
    
    elif condition_type == ConditionType.CLO_ACHIEVEMENT:
        required_clo_ids = payload.get("required_clo_ids", [])
        required_ratio = payload.get("required_ratio", 0.66)
        
        statement = select(StudentCLOResult).where(
            StudentCLOResult.student_id == student_id,
            StudentCLOResult.clo_id.in_(required_clo_ids)
        )
        results = session.exec(statement).all()
        
        achieved_count = sum(1 for r in results if r.achieved)
        ratio = achieved_count / len(required_clo_ids) if required_clo_ids else 0
        
        meets = ratio >= required_ratio
        return {
            "meets": meets,
            "details": f"Đạt {achieved_count}/{len(required_clo_ids)} CLOs yêu cầu" if meets else f"Chưa đạt đủ CLOs ({achieved_count}/{len(required_clo_ids)})"
        }
    
    elif condition_type == ConditionType.PLO_THRESHOLD:
        # TODO: Cần tính toán PLO achievement cho student
        return {
            "meets": False,
            "details": "Chức năng PLO threshold chưa được triển khai"
        }
    
    elif condition_type == ConditionType.MIN_SCORE:
        min_score = payload.get("min_score", 5.0)
        # TODO: Cần có bảng điểm tổng kết môn
        return {
            "meets": False,
            "details": f"Chức năng min_score chưa được triển khai"
        }
    
    return {
        "meets": False,
        "details": "Loại điều kiện không hợp lệ"
    }

