import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.hash import bcrypt

# Add app to path to import properly
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import Base, engine
from app.models.role import Role
from app.models.user import User

def setup_database():
    print("Parsing DATABASE_URL...")
    db_url = settings.DATABASE_URL
    
    # Split the URL to connect to the MySQL server directly without database path first
    if "/" in db_url:
        parts = db_url.rsplit("/", 1)
        base_url = parts[0]
        db_name = parts[1]
    else:
        print("Invalid DATABASE_URL format")
        sys.exit(1)
        
    print(f"Connecting to MySQL server at: {base_url}")
    try:
        # Connect without database name to execute CREATE DATABASE
        temp_engine = create_engine(base_url)
        with temp_engine.connect() as conn:
            # We use text() to execute raw SQL statements in SQLAlchemy 2.0
            conn.execute(text("COMMIT"))  # Close any implicit transaction
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
            print(f"Database '{db_name}' verified/created.")
        temp_engine.dispose()
    except Exception as e:
        print(f"Error creating database: {e}")
        print("Please ensure MySQL is running on localhost and requires no password for the 'root' user.")
        sys.exit(1)

    print("Initializing tables...")
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)
        
    # Seeding Roles and Users
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        # Seed Roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            print("Role 'admin' queued for insertion.")
            
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            user_role = Role(name="user")
            db.add(user_role)
            print("Role 'user' queued for insertion.")
            
        db.commit()
        
        # Refresh roles IDs from DB
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        user_role = db.query(Role).filter(Role.name == "user").first()
        
        # Seed Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_pw_hash = bcrypt.hash("adminpassword")
            admin_user = User(
                username="admin",
                email="admin@example.com",
                password_hash=admin_pw_hash,
                role_id=admin_role.id
            )
            db.add(admin_user)
            print("Default admin user queued (username: 'admin', password: 'adminpassword').")
            
        # Seed Standard User
        standard_user = db.query(User).filter(User.username == "user").first()
        if not standard_user:
            user_pw_hash = bcrypt.hash("userpassword")
            standard_user = User(
                username="user",
                email="user@example.com",
                password_hash=user_pw_hash,
                role_id=user_role.id
            )
            db.add(standard_user)
            print("Default standard user queued (username: 'user', password: 'userpassword').")
            
        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()
