from getpass import getpass
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models.user import User


def run():
    Base.metadata.create_all(bind=engine)
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password (minimum 6 characters): ")
    if len(password) < 6:
        raise SystemExit("Password is too short")
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("Email already exists")
        db.add(User(name=name, email=email, password_hash=hash_password(password), role="admin"))
        db.commit()
        print("Admin created.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
