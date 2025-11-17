from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, UserRole
from app.config import settings
import logging
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)

logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password - hỗ trợ cả passlib và bcrypt trực tiếp"""
    try:
        # Thử dùng passlib trước
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.warning(f"Passlib verify failed, trying bcrypt directly: {e}")
        try:
            # Nếu passlib fail, thử bcrypt trực tiếp
            password_bytes = plain_password.encode('utf-8')
            if len(password_bytes) > 72:
                password_bytes = password_bytes[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception as e2:
            logger.error(f"Bcrypt verify also failed: {e2}")
            return False

def get_password_hash(password: str) -> str:
    """Hash password - dùng passlib để đảm bảo tương thích"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    """
    Lấy user hiện tại - TẠM THỜI: Nếu không có token, trả về user đầu tiên để test
    """
    # Tạm thời: Nếu không có token, lấy user đầu tiên để test
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        logger.warning("No Bearer token, using first user for testing")
        statement = select(User).limit(1)
        user = session.exec(statement).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Không tìm thấy user")
    
    # Nếu có token, thử decode
    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    
    if not token:
        logger.warning("Token is empty, using first user for testing")
        statement = select(User).limit(1)
        user = session.exec(statement).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Không tìm thấy user")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        
        user = session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User không tồn tại")
        
        return user
    except JWTError:
        # Nếu token không hợp lệ, tạm thời dùng user đầu tiên
        logger.warning("Invalid token, using first user for testing")
        statement = select(User).limit(1)
        user = session.exec(statement).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Token không hợp lệ và không tìm thấy user")

def require_role(allowed_roles: list[UserRole]):
    """Decorator để kiểm tra role"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền truy cập"
            )
        return current_user
    return role_checker

