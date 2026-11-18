"""No paid provider fallback: models and free quota ceilings are explicit."""
from dataclasses import dataclass
import os
import re

VISION_MODEL = "qwen/qwen3.8-27b"
EMBEDDING_MODEL = "intfloat/multilingual-e5-small"
EMBEDDING_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"


def integer(env, key, default, minimum, maximum):
    value = int(env.get(key, str(default)))
    if not minimum <= value <= maximum:
        raise ValueError(f"{key} must be between {minimum} and {maximum}")
    return value


@dataclass(frozen=True)
class Settings:
    database_url: str = ""
    bucket: str = ""
    endpoint: str = ""
    region: str = "auto"
    internal_token: str = ""
    groq_key: str = ""
    free_plan_confirmed: bool = False
    vision_model: str = VISION_MODEL
    embedding_model: str = EMBEDDING_MODEL
    embedding_revision: str = EMBEDDING_REVISION
    lease_seconds: int = 180
    heartbeat_seconds: int = 20
    max_attempts: int = 3
    vision_pages_day: int = 10
    groq_rpm: int = 30
    groq_rpd: int = 1000
    groq_tpm: int = 8000
    groq_tpd: int = 200000
    vision_input_reserve: int = 3500
    vision_max_output: int = 3500
    port: int = 8091
    host: str = "127.0.0.1"
    store_page_images: bool = False

    @classmethod
    def from_env(cls, env=None):
        env = os.environ if env is None else env
        model = env.get("STUDY_VISION_MODEL", VISION_MODEL)
        if model != VISION_MODEL:
            raise ValueError("STUDY_VISION_MODEL is outside the reviewed free model allowlist")
        embedding = env.get("STUDY_EMBEDDING_MODEL", EMBEDDING_MODEL)
        if embedding != EMBEDDING_MODEL:
            raise ValueError("Changing the embedding model requires an explicit index migration")
        revision = env.get("STUDY_EMBEDDING_REVISION", EMBEDDING_REVISION)
        if not re.fullmatch(r"[0-9a-f]{40}", revision):
            raise ValueError("STUDY_EMBEDDING_REVISION must be an immutable 40-character commit SHA")
        return cls(
            database_url=env.get("DATABASE_URL", ""), bucket=env.get("AWS_BUCKET_NAME", ""),
            endpoint=env.get("AWS_ENDPOINT_URL_S3", ""), region=env.get("AWS_REGION", "auto"),
            internal_token=env.get("STUDY_INTERNAL_TOKEN", ""), groq_key=env.get("GROQ_API_KEY", ""),
            free_plan_confirmed=env.get("STUDY_GROQ_FREE_PLAN_CONFIRMED") == "true",
            vision_model=model, embedding_model=embedding,
            embedding_revision=revision,
            lease_seconds=integer(env, "STUDY_LEASE_SECONDS", 180, 60, 900),
            heartbeat_seconds=integer(env, "STUDY_HEARTBEAT_SECONDS", 20, 5, 30),
            max_attempts=integer(env, "STUDY_MAX_ATTEMPTS", 3, 1, 5),
            vision_pages_day=integer(env, "STUDY_VISION_PAGES_PER_DAY", 10, 0, 10),
            groq_rpm=integer(env, "STUDY_GROQ_RPM", 30, 0, 30),
            groq_rpd=integer(env, "STUDY_GROQ_RPD", 1000, 0, 1000),
            groq_tpm=integer(env, "STUDY_GROQ_TPM", 8000, 0, 8000),
            groq_tpd=integer(env, "STUDY_GROQ_TPD", 200000, 0, 200000),
            vision_input_reserve=integer(env, "STUDY_VISION_INPUT_RESERVE", 3500, 3500, 4500),
            vision_max_output=integer(env, "STUDY_VISION_MAX_OUTPUT", 3500, 512, 3500),
            port=integer(env, "STUDY_EMBEDDING_PORT", 8091, 1, 65535),
            host=env.get("STUDY_EMBEDDING_HOST", "127.0.0.1"),
            store_page_images=env.get("STUDY_STORE_PAGE_IMAGES") == "true",
        )

    def require_worker(self):
        if not self.database_url or not self.bucket:
            raise ValueError("DATABASE_URL and AWS_BUCKET_NAME are required for work")

    def require_server(self):
        if len(self.internal_token) < 16:
            raise ValueError("STUDY_INTERNAL_TOKEN must contain at least 16 characters")
