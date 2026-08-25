from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_admin_user
from app.schemas.user import UserResponse
from pydantic import BaseModel
from typing import Optional, Literal

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminUserUpdate(BaseModel):
    """
    Fields an admin may change on any account.

    `type` is a Literal, not a free string — otherwise this endpoint could set
    a role the rest of the app does not understand, such as "Developer" or a
    typo like "admn", and the user would silently lose all access.
    """
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    type: Optional[Literal['admin', 'client']] = None

@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user_admin(
    user_id: int,
    user_update: AdminUserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin can edit any user's profile (all fields, no whitelist).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Admin has no field restrictions - update only set fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user



@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin soft-deletes a user.
    Returns 204 No Content on success.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    db.commit()


@router.post("/users/{user_id}/promote", response_model=UserResponse)
def promote_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin promotes a user to admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.type = "admin"
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user
