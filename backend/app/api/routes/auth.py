from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from datetime import timedelta

# Create a router for auth endpoints
# This will be included in the main FastAPI app
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Every account created through public registration starts as a client.
# Promotion happens only through the admin-only endpoints.
DEFAULT_ROLE = "client"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password before storing
    hashed_password = hash_password(user_data.password)
    
    # Create new user object
    db_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        city=user_data.city,
        age=user_data.age,
        type=DEFAULT_ROLE,   # never taken from the request body
        password_hash=hashed_password
    )
    
    # Add to database and commit
    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # Refresh to get the auto-generated id
    
    return db_user


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # If user doesn't exist, don't reveal whether email exists or password is wrong
    # (security best practice: same error for both cases)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create JWT token
    # "sub" (subject) typically holds the user_id
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )
    
    # Return token and user info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }