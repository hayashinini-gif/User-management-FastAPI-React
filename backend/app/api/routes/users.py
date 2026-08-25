from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    ChangePasswordRequest,
    ChangeRoleRequest,
    PaginatedUsers,
)
from app.core.dependencies import get_current_user, get_current_admin_user
from app.core.security import hash_password, verify_password
from datetime import datetime
from typing import Optional
from sqlalchemy import or_

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # UserUpdate declares no `email` and no `type`, so those fields cannot be
    # set here no matter what the request body contains. The schema is the
    # whitelist — there is nothing extra to check.
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Update the updated_at timestamp
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password is correct
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Hash the new password
    hashed_new_password = hash_password(password_data.new_password)
    
    # Update the password
    current_user.password_hash = hashed_new_password
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Password changed successfully"}

# Only these columns may be sorted on. sort_by arrives as a string from the
# client and names a database column, so it must never be interpolated into
# SQL directly — this dictionary is the whitelist that makes it safe.
SORTABLE_COLUMNS = {
    "id": User.id,
    "first_name": User.first_name,
    "last_name": User.last_name,
    "email": User.email,
    "city": User.city,
    "age": User.age,
    "type": User.type,
    "created_at": User.created_at,
    "updated_at": User.updated_at,
}


@router.get("", response_model=PaginatedUsers)
def list_users(
    skip: int = Query(0, ge=0, description="How many records to skip (for pagination)."),
    limit: int = Query(10, ge=1, le=100, description="How many records to return per page."),
    search: Optional[str] = Query(
        None,
        description="Case-insensitive partial match on first name, last name or email.",
    ),
    type: Optional[str] = Query(
        None,
        description='Filter by role, for example "admin" or "client".',
    ),
    sort_by: str = Query("id", description="Column to sort by."),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description='"asc" or "desc".'),
    status_filter: str = Query(
        "active",
        alias="status",
        pattern="^(active|deactivated|all)$",
        description='Which accounts to include: "active" (default), "deactivated" or "all".',
    ),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    List users with searching, filtering, sorting and pagination.

    Returns an object rather than a bare list, because the client needs the
    total number of matches to render pagination — a page of ten rows tells
    you nothing about how many pages there are.
    """
    query = db.query(User)

    # One three-way switch instead of a boolean, because "only the deactivated
    # ones" is a real thing to ask for and a flag cannot express it.
    if status_filter == "active":
        query = query.filter(User.is_deleted == False)
    elif status_filter == "deactivated":
        query = query.filter(User.is_deleted == True)
    # "all" adds no filter.

    if type:
        query = query.filter(User.type == type)

    if search and search.strip():
        # ilike is case-insensitive LIKE; the % wildcards make it a partial match.
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                User.email.ilike(term),
            )
        )

    # Counted after filtering but before paging, so it is the size of the whole
    # result set rather than of this page.
    total = query.count()

    column = SORTABLE_COLUMNS.get(sort_by)
    if column is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot sort by '{sort_by}'. Allowed: {', '.join(sorted(SORTABLE_COLUMNS))}",
        )

    query = query.order_by(column.desc() if sort_order == "desc" else column.asc())

    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
   
    # An admin must not be able to lock themselves out. The UI disables this,
    # but the UI is not the security boundary — the check belongs here.
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

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
    
    # 204 No Content — no response body
    return None


@router.post("/{user_id}/restore", response_model=UserResponse)
def restore_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reactivate a soft-deleted user. Idempotent."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.is_deleted:
        user.is_deleted = False
        user.deleted_at = None
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

    return user


@router.put("/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    role_data: ChangeRoleRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Prevents the last admin from demoting themselves into a locked-out state.
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user role
    user.type = role_data.type
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user