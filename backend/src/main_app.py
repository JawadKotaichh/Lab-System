import uvicorn
import asyncio
from fastapi import FastAPI
from .db import init_db
from .api.patients import router as patients_router
from .api.visits import router as visits_router
from .api.lab_test_results import router as lab_test_results_router
from .api.lab_test_type import router as lab_test_type_router
from .api.lab_test_category import router as lab_test_category_router
from .api.insurance_company import router as insurance_comapny_router
from .api.lab_panel import router as lab_panel_router
from .api.Invoice import router as invoice_router
from .api.branding_router import router as branding_router
from .api.result_suggestions import router as result_suggestions_router
from .api.users import router as users_router
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Lab System API")
add_pagination(app)

app.include_router(patients_router)
app.include_router(visits_router)
app.include_router(lab_test_type_router)
app.include_router(lab_test_results_router)
app.include_router(insurance_comapny_router)
app.include_router(lab_test_category_router)
app.include_router(lab_panel_router)
app.include_router(invoice_router)
app.include_router(branding_router)
app.include_router(result_suggestions_router)
app.include_router(users_router)

origins = [
    "http://20.174.9.177:5173",
    "https://mango-field-0a3015403.3.azurestaticapps.net",
    "http://20.174.9.177:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://0.0.0.0:5173",
    "http://frontend:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    # allow_methods=["GET", "POST", "PUT", "DELETE"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    asyncio.run(on_startup())
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
