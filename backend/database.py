import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Database connection URL - supports MySQL and SQLite
# For MySQL in production / college demo: mysql+pymysql://root:password@localhost/smart_parking
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
default_db_path = os.path.join(BASE_DIR, "smart_parking.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
