"""
TruthLens - User Pydantic Schemas
Validates request bodies and shapes API responses for auth endpoints.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Body for POST /auth/register"""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Body for POST /auth/login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Returned user data — never includes the password."""
    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT token envelope returned after login or register."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
