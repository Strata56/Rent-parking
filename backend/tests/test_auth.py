import pytest
from utils.auth import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pwd = "secretpassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_token_generation():
    subject = "user-12345"
    token = create_access_token({"sub": subject, "role": "commuter"})
    assert isinstance(token, str)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == subject
    assert payload.get("role") == "commuter"
