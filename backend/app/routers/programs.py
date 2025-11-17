from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Program
from app.schemas import ProgramCreate, ProgramResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[ProgramResponse])
async def list_programs(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tất cả chương trình đào tạo"""
    programs = session.exec(select(Program)).all()
    return programs

@router.get("/public", response_model=List[ProgramResponse])
async def list_programs_public(
    session: Session = Depends(get_session)
):
    """Lấy danh sách tất cả chương trình đào tạo (public, không cần auth)"""
    programs = session.exec(select(Program)).all()
    return programs

@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một chương trình đào tạo"""
    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương trình đào tạo")
    return program

@router.post("/", response_model=ProgramResponse)
async def create_program(
    program_data: ProgramCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)  # Cho phép tất cả user đã đăng nhập tạo chương trình
):
    """Tạo chương trình đào tạo mới"""
    program = Program(**program_data.model_dump())
    session.add(program)
    session.commit()
    session.refresh(program)
    return program

@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_data: ProgramCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Cập nhật chương trình đào tạo"""
    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương trình đào tạo")
    
    for key, value in program_data.model_dump().items():
        setattr(program, key, value)
    
    session.add(program)
    session.commit()
    session.refresh(program)
    return program

@router.delete("/{program_id}")
async def delete_program(
    program_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    """Xóa chương trình đào tạo"""
    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Không tìm thấy chương trình đào tạo")
    
    session.delete(program)
    session.commit()
    return {"message": "Đã xóa chương trình đào tạo"}

