"""
Tests cho prerequisite service
"""
import pytest
from sqlmodel import Session, create_engine, SQLModel
from app.models import Course, CLO, CoursePrerequisite, PrerequisiteType, ConditionType, BloomLevel
from app.services.prerequisite_service import check_student_meets_prereq, suggest_prerequisites
from app.database import get_session

# Test database
test_engine = create_engine("sqlite:///:memory:", echo=True)

@pytest.fixture
def session():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)

def test_suggest_prerequisites_returns_relevant_candidate(session):
    """Test suggest prerequisites trả về candidates phù hợp"""
    # Tạo course mẫu
    course1 = Course(
        code="DMKT201",
        title="Marketing Du lịch",
        credits=3,
        version_year=2025,
        program_id=1
    )
    session.add(course1)
    session.commit()
    session.refresh(course1)
    
    # Tạo CLOs cho course1
    clo1 = CLO(
        code="DMKT201_CLO1",
        verb="Phân tích",
        text="Phân tích phân khúc thị trường du lịch",
        bloom_level=BloomLevel.ANALYZE,
        course_id=course1.id
    )
    session.add(clo1)
    session.commit()
    
    # Tạo course2
    course2 = Course(
        code="DMKT302",
        title="Thương mại điện tử trong Du lịch",
        credits=3,
        version_year=2025,
        program_id=1
    )
    session.add(course2)
    session.commit()
    session.refresh(course2)
    
    # Tạo CLOs cho course2
    clo2 = CLO(
        code="DMKT302_CLO1",
        verb="Thiết kế",
        text="Thiết kế chiến dịch E-marketing cho sản phẩm du lịch",
        bloom_level=BloomLevel.CREATE,
        course_id=course2.id
    )
    session.add(clo2)
    session.commit()
    
    # Test suggest
    clos_input = [
        {"verb": "Thiết kế", "text": "Thiết kế chiến dịch marketing", "bloom_level": "Create"}
    ]
    
    suggestions = suggest_prerequisites(session, clos_input, "Tourism")
    
    # Kiểm tra có suggestions
    assert len(suggestions) > 0
    # Kiểm tra có course phù hợp
    course_ids = [s["course_id"] for s in suggestions]
    assert course1.id in course_ids or course2.id in course_ids

def test_check_student_meets_prereq_pass_course(session):
    """Test check student meets prerequisite với condition pass_course"""
    # Tạo prerequisite
    prereq = CoursePrerequisite(
        course_id=2,
        prereq_course_id=1,
        type=PrerequisiteType.STRICT,
        condition_type=ConditionType.PASS_COURSE,
        condition_payload={},
        version_year=2025
    )
    session.add(prereq)
    session.commit()
    session.refresh(prereq)
    
    # Test với student_id = 1 (giả sử)
    result = check_student_meets_prereq(session, 1, prereq)
    
    # Kiểm tra có trả về dict với keys cần thiết
    assert "meets" in result
    assert "details" in result
    assert isinstance(result["meets"], bool)


