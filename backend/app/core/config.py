from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- existing ---
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # --- AI filter interpretation ---
    # No default: the app must not start without a key.
    GROQ_API_KEY: str
    # Defaults: operational tuning, safe to omit.
    AI_MODEL: str = "openai/gpt-oss-20b"
    AI_TIMEOUT_SECONDS: float = 8.0

    class Config:
        env_file = ".env"


settings = Settings()