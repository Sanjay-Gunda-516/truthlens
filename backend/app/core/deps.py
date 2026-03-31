"""
TruthLens - FastAPI Dependencies
Extracts and validates the current authenticated user from the JWT Bearer token.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from .database import get_db
from .security import decode_token
from ..models.user import User


# Extracts the Bearer token from the Authorization header
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: validates JWT from Authorization header.
    Returns the authenticated User ORM object, or raises HTTP 401.

    Usage in any route:
        current_user: User = Depends(get_current_user)
    """
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if not user_id:
            raise auth_error
    except JWTError:
        raise auth_error

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise auth_error

    return user
