from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON, ARRAY, Integer
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class PrerequisiteType(str, Enum):
    STRICT = "strict"
    COREQ = "coreq"
    RECOMMENDED = "recommended"

class ConditionType(str, Enum):
    PASS_COURSE = "pass_course"
    CLO_ACHIEVEMENT = "clo_achievement"
    PLO_THRESHOLD = "plo_threshold"
    MIN_SCORE = "min_score"

class BloomLevel(str, Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"

class UserRole(str, Enum):
    INSTRUCTOR = "instructor"
    PROGRAM_MANAGER = "program_manager"
    QA_ADMIN = "qa_admin"
    ADMIN = "admin"

# Base Models
class UserBase(SQLModel):
    name: str
    email: str
    role: UserRole

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    program_id: Optional[int] = Field(default=None, foreign_key="program.id")
    department: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProgramBase(SQLModel):
    code: str
    name: str
    expected_threshold: float = 0.7

class Program(ProgramBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PLOBase(SQLModel):
    code: str
    description: str

class PLO(PLOBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="program.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseBase(SQLModel):
    code: str
    title: str
    credits: int
    description: Optional[str] = None
    version_year: int
    semester: Optional[int] = None  # Học kỳ
    theory_hours: Optional[int] = None  # Giờ lý thuyết
    practice_hours: Optional[int] = None  # Giờ thực hành
    self_study_hours: Optional[int] = None  # Giờ tự học
    teaching_language: Optional[str] = None  # Ngôn ngữ giảng dạy
    knowledge_block: Optional[str] = None  # Khối kiến thức

class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="program.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CLOBase(SQLModel):
    code: str
    verb: str
    text: str
    bloom_level: BloomLevel
    threshold: float = 0.7  # NKQCLO_j

class CLO(CLOBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    rubric_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AssessmentBase(SQLModel):
    code: str
    title: str
    weight: float  # Trọng số đánh giá

class Assessment(AssessmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionBase(SQLModel):
    text: str
    max_score: float

class Question(QuestionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessment.id")
    clo_ids: Optional[List[int]] = Field(default=[], sa_column=Column(ARRAY(Integer)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentBase(SQLModel):
    student_number: str
    name: str
    cohort: Optional[str] = None

class Student(StudentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentScoreBase(SQLModel):
    score: float

class StudentScore(StudentScoreBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id")
    question_id: int = Field(foreign_key="question.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentCLOResultBase(SQLModel):
    achievement: float  # Mức đạt CLO (0-1)
    achieved: bool
    assessed_at: datetime

class StudentCLOResult(StudentCLOResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id")
    clo_id: int = Field(foreign_key="clo.id")
    source: Optional[str] = None  # Nguồn tính toán
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CoursePrerequisiteBase(SQLModel):
    type: PrerequisiteType
    condition_type: ConditionType
    condition_payload: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    version_year: int

class CoursePrerequisite(CoursePrerequisiteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    prereq_course_id: int = Field(foreign_key="course.id")
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Model cho CLO-PLO mapping
class CLOPLOMapping(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clo_id: int = Field(foreign_key="clo.id")
    plo_id: int = Field(foreign_key="plo.id")
    contribution_level: str = "M"  # M (Major), N (Neutral), L (Low)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Model cho Rubric
class RubricBase(SQLModel):
    name: str
    description: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))  # JSON chứa các tiêu chí

class Rubric(RubricBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")
    clo_id: Optional[int] = Field(default=None, foreign_key="clo.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Model cho Tài liệu tham khảo
class ReferenceBase(SQLModel):
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    isbn: Optional[str] = None
    reference_type: str = "textbook"  # textbook, article, website, etc.
    url: Optional[str] = None

class Reference(ReferenceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

