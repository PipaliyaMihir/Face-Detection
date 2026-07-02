"""
routes/auth.py — Authentication endpoints.

Simple JWT-based auth for admin panel access.
Default credentials: admin / admin123 (configurable via env vars).
"""

import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext

from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


def get_secret_key() -> str:
    return os.getenv("JWT_SECRET", "attendease-secret-key-change-in-production")


def create_access_token(data: dict) -> str:
    """Create a JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, get_secret_key(), algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return username."""
    try:
        payload = jwt.decode(credentials.credentials, get_secret_key(), algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate admin user and return JWT token."""
    load_dotenv()
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if request.username != admin_username or request.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": request.username})
    
    return TokenResponse(
        access_token=access_token,
        username=request.username,
    )


@router.get("/verify")
async def verify_auth(username: str = Depends(verify_token)):
    """Verify if the current token is valid."""
    return {"authenticated": True, "username": username}
