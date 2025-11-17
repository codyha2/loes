from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import CLO, StudentCLOResult, CLOPLOMapping, Rubric, Question
from app.schemas import CLOCreate, CLOResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[CLOResponse])
async def list_clos(
    course_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách CLOs"""
    if course_id:
        statement = select(CLO).where(CLO.course_id == course_id)
        clos = session.exec(statement).all()
    else:
        clos = session.exec(select(CLO)).all()
    return clos

@router.get("/{clo_id}", response_model=CLOResponse)
async def get_clo(
    clo_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một CLO"""
    clo = session.get(CLO, clo_id)
    if not clo:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLO")
    return clo

@router.post("/", response_model=CLOResponse)
async def create_clo(
    clo_data: CLOCreate,
    course_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Tạo CLO mới"""
    try:
        # Kiểm tra course tồn tại
        from app.models import Course
        course = session.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy môn học với ID {course_id}")
        
        # Tạo CLO
        clo = CLO(**clo_data.model_dump(), course_id=course_id)
        session.add(clo)
        session.commit()
        session.refresh(clo)
        return clo
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo CLO: {str(e)}")

@router.put("/{clo_id}", response_model=CLOResponse)
async def update_clo(
    clo_id: int,
    clo_data: CLOCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Cập nhật CLO"""
    clo = session.get(CLO, clo_id)
    if not clo:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLO")
    
    for key, value in clo_data.model_dump().items():
        setattr(clo, key, value)
    
    session.add(clo)
    session.commit()
    session.refresh(clo)
    return clo

@router.delete("/{clo_id}")
async def delete_clo(
    clo_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # Cho phép tất cả user đã đăng nhập
):
    """Xóa CLO - Cho phép tất cả user đã đăng nhập"""
    clo = session.get(CLO, clo_id)
    if not clo:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLO")
    
    # Xóa các bản ghi liên quan trước
    # 1. Xóa StudentCLOResult
    statement = select(StudentCLOResult).where(StudentCLOResult.clo_id == clo_id)
    student_results = session.exec(statement).all()
    for result in student_results:
        session.delete(result)
    
    # 2. Xóa CLOPLOMapping
    statement = select(CLOPLOMapping).where(CLOPLOMapping.clo_id == clo_id)
    mappings = session.exec(statement).all()
    for mapping in mappings:
        session.delete(mapping)
    
    # 3. Xóa Rubric (nếu có)
    statement = select(Rubric).where(Rubric.clo_id == clo_id)
    rubrics = session.exec(statement).all()
    for rubric in rubrics:
        session.delete(rubric)
    
    # 4. Cập nhật Question để loại bỏ clo_id khỏi clo_ids array
    # (Không xóa Question, chỉ cập nhật clo_ids)
    statement = select(Question)
    questions = session.exec(statement).all()
    for question in questions:
        if question.clo_ids and clo_id in question.clo_ids:
            question.clo_ids = [cid for cid in question.clo_ids if cid != clo_id]
            session.add(question)
    
    # 5. Xóa CLO
    session.delete(clo)
    session.commit()
    return {"message": "Đã xóa CLO"}

