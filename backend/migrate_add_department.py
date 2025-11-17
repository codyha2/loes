"""
Migration script: Thêm cột department (text) vào bảng user
Chạy: docker compose exec backend python migrate_add_department.py
"""
from sqlalchemy import text
from app.database import engine


def migrate():
    """Thêm cột department vào bảng user"""
    with engine.connect() as conn:
        try:
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='user' AND column_name='department'
            """))
            if result.fetchone():
                print("✓ Cột department đã tồn tại, bỏ qua migration")
                return

            conn.execute(text('ALTER TABLE "user" ADD COLUMN department VARCHAR(255)'))
            conn.commit()
            print("✓ Đã thêm cột department vào bảng user")
        except Exception as exc:
            conn.rollback()
            print(f"✗ Lỗi khi migration: {exc}")
            raise


if __name__ == "__main__":
    migrate()

