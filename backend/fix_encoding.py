"""
Script để sửa lỗi encoding cho các chương trình đào tạo
"""
from sqlmodel import Session, select
from app.database import engine
from app.models import Program

# Mapping các tên chương trình bị lỗi encoding
FIX_MAPPING = {
    "Quáº£n trá»‹ dá»‹ch vá»¥ du lá»‹ch vÃ lá»¯ hÃ nh": "Quản trị dịch vụ du lịch và lữ hành",
    "Quáº£n trá»‹ dá»‹ch vá»¥ du lá»‹ch vÃ  lá»¯ hÃ nh": "Quản trị dịch vụ du lịch và lữ hành",  # Variant với space
    "Quáº£n trá»‹ khÃ¡ch sáº¡n": "Quản trị khách sạn",
    "Quáº£n trá»‹ NhÃ HÃ ng vÃ dá»‹ch vá»¥ Äƒn uá»'ng": "Quản trị Nhà Hàng và dịch vụ ăn uống",
    "Quáº£n trá»‹ NhÃ  HÃ  ng vÃ  dá»‹ch vá»¥ Äƒn uá»'ng": "Quản trị Nhà Hàng và dịch vụ ăn uống",  # Variant với space
    "HÆ°á»›ng Dáº«n ViÃªn": "Hướng Dẫn Viên",
    "Du Lá»‹ch": "Du Lịch",
}

# Hoặc kiểm tra theo pattern
def should_fix(name: str) -> bool:
    """Kiểm tra xem tên có bị lỗi encoding không"""
    return 'Ã' in name or 'á»' in name or 'Æ°' in name

def fix_encoding():
    session = Session(engine)
    try:
        programs = session.exec(select(Program)).all()
        fixed_count = 0
        
        for program in programs:
            if program.name in FIX_MAPPING:
                old_name = program.name
                program.name = FIX_MAPPING[old_name]
                session.add(program)
                print(f"Đã sửa: {old_name} -> {FIX_MAPPING[old_name]}")
                fixed_count += 1
            elif should_fix(program.name):
                # Thử sửa tự động dựa trên code
                if program.code == "TRAVEL":
                    program.name = "Quản trị dịch vụ du lịch và lữ hành"
                    session.add(program)
                    print(f"Đã sửa tự động (TRAVEL): {program.name}")
                    fixed_count += 1
                elif program.code == "RESTAURANT":
                    program.name = "Quản trị Nhà Hàng và dịch vụ ăn uống"
                    session.add(program)
                    print(f"Đã sửa tự động (RESTAURANT): {program.name}")
                    fixed_count += 1
                else:
                    print(f"Phát hiện lỗi encoding nhưng chưa có mapping: {program.name} (ID: {program.id}, Code: {program.code})")
        
        session.commit()
        print(f"\nĐã sửa {fixed_count} chương trình đào tạo.")
        
    except Exception as e:
        print(f"Lỗi: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    fix_encoding()

