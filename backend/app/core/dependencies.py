from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.core.security import verify_access_token
from app.db.session import get_db
from app.models.user import User
from typing import Optional

# HTTPBearer scheme extracts the token from "Bearer <token>" header
security = HTTPBearer()

def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    
    # Get the token from credentials
    token = credentials.credentials
    
    # Verify the token and get the payload
    payload = verify_access_token(token)
    
    # If token is invalid or expired, payload will be None
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user_id from token payload ("sub" = subject = user_id)
    user_id: Optional[int] = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch the user from database
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    
    if current_user.type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    return current_user