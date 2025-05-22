from fastapi import FastAPI
import uvicorn
import sys
import asyncio
import os

from src.db import init_db

app = FastAPI(title="Laboratory System", summary="Laboratory System for labs")
DEBUG = os.environ.get("DEBUG", "").strip().lower() in {"1", "true", "on", "yes"}
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DB = os.getenv("MONGODB_DB_NAME", "lab_system")


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
