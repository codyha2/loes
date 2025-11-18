from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import PLO
from app.schemas import PLOCreate, PLOResponse
from app.auth import get_current_user, require_role, UserRole

router = APIRouter()

@router.get("/", response_model=List[PLOResponse])
async def list_plos(
    program_id: int = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách PLOs"""
    if program_id:
        statement = select(PLO).where(PLO.program_id == program_id)
        plos = session.exec(statement).all()
    else:
        plos = session.exec(select(PLO)).all()
    return plos

@router.get("/{plo_id}", response_model=PLOResponse)
async def get_plo(
    plo_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin một PLO"""
    plo = session.get(PLO, plo_id)
    if not plo:
        raise HTTPException(status_code=404, detail="Không tìm thấy PLO")
    return plo

@router.post("/", response_model=PLOResponse)
async def create_plo(
    plo_data: PLOCreate,
    program_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Tạo PLO mới"""
    plo = PLO(**plo_data.model_dump(), program_id=program_id)
    session.add(plo)
    session.commit()
    session.refresh(plo)
    return plo

@router.put("/{plo_id}", response_model=PLOResponse)
async def update_plo(
    plo_id: int,
    plo_data: PLOCreate,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.PROGRAM_MANAGER, UserRole.ADMIN]))
):
    """Cập nhật PLO"""
    plo = session.get(PLO, plo_id)
    if not plo:
        raise HTTPException(status_code=404, detail="Không tìm thấy PLO")
    
    for key, value in plo_data.model_dump().items():
        setattr(plo, key, value)
    
    session.add(plo)
    session.commit()
    session.refresh(plo)
    return plo

@router.delete("/{plo_id}")
async def delete_plo(
    plo_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    """Xóa PLO"""
    plo = session.get(PLO, plo_id)
    if not plo:
        raise HTTPException(status_code=404, detail="Không tìm thấy PLO")
    
    session.delete(plo)
    session.commit()
    return {"message": "Đã xóa PLO"}



