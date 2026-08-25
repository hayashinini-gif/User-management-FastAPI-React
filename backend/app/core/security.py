from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.core.config import settings
from typing import Optional
import time

# PASSWORD HASHING
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.

    Never log SECRET_KEY, the token, or the payload. Standard output becomes
    log files, and log files get copied, shipped and read — anyone holding the
    signing key can forge a token for any user.
    """
    
    to_encode = data.copy()
    
    # Calculate expiration time in Unix timestamp (seconds since epoch)
    if expires_delta:
        expire_seconds = int(expires_delta.total_seconds())
    else:
        expire_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    current_time = int(time.time())
    exp_time = current_time + expire_seconds
    
    to_encode.update({"exp": exp_time})
    
    # Sign the payload with SECRET_KEY using the specified algorithm
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
