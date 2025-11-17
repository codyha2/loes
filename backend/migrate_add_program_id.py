"""
Migration script: Thêm cột program_id vào bảng user
Chạy: docker compose exec backend python migrate_add_program_id.py
"""
from sqlalchemy import text
from app.database import engine

def migrate():
    """Thêm cột program_id vào bảng user"""
    with engine.connect() as conn:
        try:
            # Kiểm tra xem cột đã tồn tại chưa
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user' AND column_name='program_id'
            """))
            if result.fetchone():
                print("✓ Cột program_id đã tồn tại, bỏ qua migration")
                return
            
            # Thêm cột program_id
            conn.execute(text('ALTER TABLE "user" ADD COLUMN program_id INTEGER REFERENCES program(id)'))
            conn.commit()
            print("✓ Đã thêm cột program_id vào bảng user")
        except Exception as e:
            conn.rollback()
            print(f"✗ Lỗi khi migration: {e}")
            raise

if __name__ == "__main__":
    migrate()

