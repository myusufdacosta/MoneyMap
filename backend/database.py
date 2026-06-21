from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./moneymap.db"
)

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_lightweight_migrations():
    """There's no migration framework (e.g. Alembic) in this project, and
    Base.metadata.create_all() only creates tables that don't exist yet —
    it never alters an existing table. So when a new column is added to an
    existing model (like User.role), it has to be added here explicitly or
    it will silently be missing from the real database. Safe to call on
    every startup: it checks for the column first and does nothing if it's
    already there."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return  # brand new database — create_all() will create it with the column already included
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "role" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'individual'"))