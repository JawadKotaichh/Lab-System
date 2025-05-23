import uvicorn
import asyncio
import sys
from fastapi import FastAPI
from src.db import init_db
from src.api.patients import router as patients_router
from src.api.visits import router as visits_router
from src.api.lab_test_results import router as lab_test_results_router
from src.api.lab_test_type import router as lab_test_type_router
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware

# TODO: add filters to your DB

app = FastAPI(title="Lab System API")
add_pagination(app)

app.include_router(patients_router)
app.include_router(visits_router)
app.include_router(lab_test_type_router)
app.include_router(lab_test_results_router)

origins = [
    "http://localhost:8000",
    "localhost:8000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


async def main(argv=sys.argv[1:]):
    try:
        await init_db()
        config = uvicorn.Config(
            app, host="localhost", port=8000, loop="asyncio", reload=True
        )
        server = uvicorn.Server(config)
        await server.serve()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    asyncio.run(main())
