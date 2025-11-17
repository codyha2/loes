from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import SQLModel, Session, select
from pydantic import BaseModel
from datetime import timedelta
from typing import Optional
from app.database import get_session
from app.models import User, UserRole
from app.schemas import ProgramResponse
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_role
)
from app.config import settings

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "instructor"
    program_id: Optional[int] = None
    department: Optional[str] = None
    
    def get_role(self) -> UserRole:
        """Convert string role to UserRole enum"""
        if self.role == "instructor":
            return UserRole.INSTRUCTOR
        elif self.role == "program_manager":
            return UserRole.PROGRAM_MANAGER
        elif self.role == "qa_admin":
            return UserRole.QA_ADMIN
        elif self.role == "admin":
            return UserRole.ADMIN
        return UserRole.INSTRUCTOR

@router.post("/register")
async def register(
    register_data: RegisterRequest,
    session: Session = Depends(get_session)
):
    """Đăng ký user mới"""
    # Kiểm tra email đã tồn tại
    statement = select(User).where(User.email == register_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng"
        )
    
    # Kiểm tra program_id nếu có
    if register_data.program_id:
        from app.models import Program
        program = session.get(Program, register_data.program_id)
        if not program:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chương trình đào tạo không tồn tại"
            )
    
    hashed_password = get_password_hash(register_data.password)
    department_value = register_data.department.strip() if register_data.department else None
    user_role = register_data.get_role()
    user = User(
        name=register_data.name,
        email=register_data.email,
        hashed_password=hashed_password,
        role=user_role,
        program_id=register_data.program_id,
        department=department_value
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "Đăng ký thành công", "user_id": user.id}

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    """Đăng nhập và trả về JWT token"""
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "program_id": user.program_id
        }
    }

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin user hiện tại dựa trên JWT"""
    if not current_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "program_id": current_user.program_id,
        "department": current_user.department
    }

@router.get("/test-token")
async def test_token(request: Request):
    """Endpoint test để kiểm tra token có được gửi đến không"""
    auth_header = request.headers.get("Authorization", "")
    return {
        "has_auth_header": bool(auth_header),
        "auth_header": auth_header[:50] + "..." if len(auth_header) > 50 else auth_header,
        "all_headers": dict(request.headers)
    }

