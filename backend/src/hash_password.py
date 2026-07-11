from passlib.context import CryptContext
from sys import stdout

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


password = input().strip()
stdout.write(hash_password(password))
