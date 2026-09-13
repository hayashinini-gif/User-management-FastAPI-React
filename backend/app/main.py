
from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
from app.api.routes import auth
from app.api.routes import users
from app.api.routes import stats
from app.api.routes import admin
from app.api.routes import filters
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Auth API",
    description="Full authentication and user management system",
    version="1.0.0"
)

# Include routers
app.include_router(auth.router)
app.include_router(filters.router)
app.include_router(users.router)
app.include_router(stats.router)
app.include_router(admin.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}