from sqlmodel import SQLModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import (
    PrerequisiteType, ConditionType, BloomLevel, UserRole
)

# Request/Response Schemas
class ProgramCreate(SQLModel):
    code: str
    name: str
    expected_threshold: float = 0.7

class ProgramResponse(SQLModel):
    id: int
    code: str
    name: str
    expected_threshold: float
    created_at: datetime
    updated_at: datetime

class PLOCreate(SQLModel):
    code: str
    description: str

class PLOResponse(SQLModel):
    id: int
    program_id: int
    code: str
    description: str
    created_at: datetime
    updated_at: datetime

class CourseCreate(SQLModel):
    code: str
    title: str
    credits: int
    description: Optional[str] = None
    version_year: int
    semester: Optional[int] = None
    theory_hours: Optional[int] = None
    practice_hours: Optional[int] = None
    self_study_hours: Optional[int] = None
    teaching_language: Optional[str] = None
    knowledge_block: Optional[str] = None

class CourseResponse(SQLModel):
    id: int
    program_id: int
    code: str
    title: str
    credits: int
    description: Optional[str] = None
    version_year: int
    semester: Optional[int] = None
    theory_hours: Optional[int] = None
    practice_hours: Optional[int] = None
    self_study_hours: Optional[int] = None
    teaching_language: Optional[str] = None
    knowledge_block: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CLOCreate(SQLModel):
    code: str
    verb: str
    text: str
    bloom_level: BloomLevel
    threshold: float = 0.7

class CLOResponse(SQLModel):
    id: int
    course_id: int
    code: str
    verb: str
    text: str
    bloom_level: BloomLevel
    threshold: float
    rubric_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class AssessmentCreate(SQLModel):
    code: str
    title: str
    weight: float

class AssessmentResponse(SQLModel):
    id: int
    course_id: int
    code: str
    title: str
    weight: float
    created_at: datetime
    updated_at: datetime

class QuestionCreate(SQLModel):
    text: str
    max_score: float
    clo_ids: List[int] = []

class QuestionResponse(SQLModel):
    id: int
    assessment_id: int
    text: str
    max_score: float
    clo_ids: List[int]
    created_at: datetime
    updated_at: datetime

class StudentCreate(SQLModel):
    student_number: str
    name: str
    cohort: Optional[str] = None

class StudentResponse(SQLModel):
    id: int
    student_number: str
    name: str
    cohort: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class StudentScoreCreate(SQLModel):
    student_id: int
    question_id: int
    score: float

class StudentScoreResponse(SQLModel):
    id: int
    student_id: int
    question_id: int
    score: float
    created_at: datetime
    updated_at: datetime

class PrerequisiteCreate(SQLModel):
    prereq_course_id: int
    type: PrerequisiteType
    condition_type: ConditionType
    condition_payload: Dict[str, Any] = {}
    version_year: int

class PrerequisiteResponse(SQLModel):
    id: int
    course_id: int
    prereq_course_id: int
    type: PrerequisiteType
    condition_type: ConditionType
    condition_payload: Dict[str, Any]
    version_year: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class SuggestPrerequisiteRequest(SQLModel):
    clos: List[Dict[str, Any]]  # [{verb, text, bloom_level}]
    domain: Optional[str] = "Tourism"

class SuggestPrerequisiteResponse(SQLModel):
    course_id: int
    code: str
    title: str
    confidence: float
    match_reasons: List[str]

class ImpactAnalysisResponse(SQLModel):
    total_students: int
    missing_count: int
    missing_students: List[Dict[str, Any]]
    risk_score: float

class CalculateCourseRequest(SQLModel):
    course_id: int

class CalculateCourseResponse(SQLModel):
    course_id: int
    student_results: List[Dict[str, Any]]
    class_tld_clo: Dict[str, float]  # {clo_id: tld_value}
    message: str

class CalculateProgramRequest(SQLModel):
    program_id: int

class CalculateProgramResponse(SQLModel):
    program_id: int
    tld_plo: Dict[str, float]  # {plo_id: tld_value}
    message: str

class ExportCourseRequest(SQLModel):
    instructor_name: str
    instructor_email: str
    instructor_title: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None
    include_prereqs: bool = True
    include_rubrics: bool = True

# Schemas cho CLO-PLO Mapping
class CLOPLOMappingCreate(SQLModel):
    clo_id: int
    plo_id: int
    contribution_level: str = "M"  # M, N, L

class CLOPLOMappingUpdate(SQLModel):
    contribution_level: str  # Chỉ cần update contribution_level

class CLOPLOMappingResponse(SQLModel):
    id: int
    clo_id: int
    plo_id: int
    contribution_level: str
    created_at: datetime

# Schemas cho Rubric
class RubricCreate(SQLModel):
    name: str
    description: Optional[str] = None
    criteria: Dict[str, Any] = {}
    course_id: Optional[int] = None
    clo_id: Optional[int] = None

class RubricResponse(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    criteria: Dict[str, Any]
    course_id: Optional[int] = None
    clo_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

# Schemas cho Reference
class ReferenceCreate(SQLModel):
    course_id: int
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    isbn: Optional[str] = None
    reference_type: str = "textbook"
    url: Optional[str] = None

class ReferenceResponse(SQLModel):
    id: int
    course_id: int
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    isbn: Optional[str] = None
    reference_type: str
    url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

