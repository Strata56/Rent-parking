import os
import hashlib
import binascii
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "smart-parking-secret-key-super-secure-token-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days validity

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def hash_password(password: str) -> str:
    # Hash password with PBKDF2 HMAC-SHA256
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{binascii.hexlify(salt).decode('ascii')}${binascii.hexlify(key).decode('ascii')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_hex, key_hex = hashed_password.split("$")
        salt = binascii.unhexlify(salt_hex.encode("ascii"))
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return binascii.hexlify(key).decode("ascii") == key_hex
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
