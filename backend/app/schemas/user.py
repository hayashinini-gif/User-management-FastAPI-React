from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Literal, List

# INPUT SCHEMAS (what clients send to your API)
# class UserRegister(BaseModel):
#     """Schema for user registration - clients send these fields"""
#     first_name: str = Field(..., min_length=1, max_length=100)
#     last_name: str = Field(..., min_length=1, max_length=100)
#     email: EmailStr 
#     phone_number: str = Field(..., min_length=1, max_length=20)
#     city: str = Field(..., min_length=1, max_length=100)
#     age: int = Field(..., ge=18, le=150) 
#     type: str = Field(..., min_length=1, max_length=20) 
#     password: str = Field(..., min_length=8)  

class UserRegister(BaseModel):
    """
    What a client may send when creating an account.

    There is deliberately no `type` field. The role is the server's decision,
    not the browser's — a field that is not in this schema cannot be set, no
    matter what the request body contains. Roles are assigned afterwards
    through the admin-only endpoints.
    """
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone_number: Optional[str] = Field(None, min_length=1, max_length=20)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=150)
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for login - clients only need email and password"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile - all fields optional"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=1, max_length=20)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=150)



# OUTPUT SCHEMAS (what your API returns to clients)
class UserResponse(BaseModel):
    """Schema for API responses - what clients see (no password!)"""
    id: int
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = None 
    city: Optional[str] = None  
    age: Optional[int] = None
    type: str
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 


class PaginatedUsers(BaseModel):
    """
    One page of users, plus what a client needs to page through the rest.

    `total` counts every row matching the filters, ignoring skip/limit — that
    is what lets the UI show "1-10 of 34" and work out how many pages exist.
    """
    items: List[UserResponse]
    total: int
    skip: int
    limit: int


class TokenResponse(BaseModel):
    """Schema for login response - returns JWT token"""
    access_token: str
    token_type: str 
    user: UserResponse 


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangeRoleRequest(BaseModel):
    type: Literal['admin', 'client']