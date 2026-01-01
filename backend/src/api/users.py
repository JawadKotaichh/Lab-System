from fastapi import APIRouter, HTTPException, status
from ..models import User as DBUser

# from ..models import Admin as DBAdmin
from ..schemas.schema_users import (
    # LoginResponse,
    User,
    # login_data,
    update_user,
)
from fastapi.responses import Response
from typing import Any, Dict, List
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId
from passlib.context import CryptContext


router = APIRouter(prefix="/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


@router.get("/page/{page_size}/{page_number}", response_model=Dict[str, Any])
async def get_users_with_page_size(
    page_number: int,
    page_size: int,
    username: str | None = Query(None),
):
    offset = (page_number - 1) * page_size
    mongo_filter: dict[str, Any] = {}
    if username:
        mongo_filter["username"] = {
            "$regex": username,
            "$options": "i",
        }

    total_number_of_users = await DBUser.find(mongo_filter).count()
    cursor = DBUser.find(mongo_filter).skip(offset).limit(page_size)
    users: List[Dict[str, Any]] = []
    async for user in cursor:
        users.append(
            {
                "role": user.role,
                "username": user.username,
            }
        )

    total_pages = ceil(total_number_of_users / page_size)
    result = {
        "TotalNumberOfUsers": total_number_of_users,
        "total_pages": total_pages,
        "users": users,
    }
    return result


@router.get("/all", response_model=List[Dict[str, Any]])
async def getAllUsers() -> List[Dict[str, Any]]:
    cursor = DBUser.find()
    all_users: List[Dict[str, Any]] = []
    async for user in cursor:
        all_users.append(
            {
                "role": user.role,
                "username": user.username,
            }
        )
    return all_users


@router.post(
    "/",
    response_model=DBUser,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
)
async def create_user(data: User):
    hashed_password = hash_password(data.password)
    db_user = DBUser(
        user_id=PydanticObjectId(data.user_id),
        username=data.username,
        password_hashed=hashed_password,
    )
    new_user = await db_user.insert()
    if not new_user:
        raise HTTPException(status_code=404, detail="User was not created")
    return new_user


@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user(user_id: str):
    if not PydanticObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")
    user = await DBUser.get(PydanticObjectId(user_id))

    if not user:
        raise HTTPException(404, f"user {user_id} not found")

    output: Dict[str, Any] = {}
    output["username"] = user.username
    return output


@router.put("/{user_id}", response_model=DBUser)
async def update_the_user(user_id: str, update_data: update_user):
    if not PydanticObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")

    existing_user = await DBUser.find_one(DBUser.id == PydanticObjectId(user_id))
    if existing_user is None:
        raise HTTPException(404, f"user {user_id} not found")

    if update_data.username is not None:
        existing_user.username = update_data.username
    if update_data.password is not None:
        hashed_password = hash_password(password=update_data.password)
        existing_user.password_hashed = hashed_password

    await existing_user.replace()

    return existing_user


# @router.post(
#     "/login",
#     response_model=LoginResponse,
#     status_code=status.HTTP_200_OK,
#     summary="Login user",
# )
# async def login_user(data: login_data):
#     user = await DBUser.find_one(DBUser.username == data.username)

#     if user:
#         if not verify_password(data.password, user.password_hashed):
#             raise HTTPException(status_code=401, detail="Invalid credentials")
#         return {
#             "ok": True,
#             "user_id": str(user.user_id),
#             "username": user.username,
#             "role": "patient",
#         }

#     admin = await DBAdmin.find_one(DBAdmin.username == data.username)

#     if admin:
#         if not verify_password(data.password, admin.password_hashed):
#             raise HTTPException(status_code=401, detail="Invalid credentials")
#         return {
#             "ok": True,
#             "user_id": str(admin.id),
#             "username": admin.username,
#             "role": "admin",
#         }

#     raise HTTPException(status_code=401, detail="Invalid credentials")


@router.delete("/{user_id}", response_class=Response)
async def delete_user(user_id: str):
    if not PydanticObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")
    user_to_be_deleted = await DBUser.find_one(DBUser.id == PydanticObjectId(user_id))
    if user_to_be_deleted is None:
        raise HTTPException(404, f"user {user_id} not found")
    await user_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
