"""
Script seed dữ liệu mẫu cho Tourism program
Chạy: python seed_data.py
"""
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models import (
    Program, PLO, Course, CLO, Assessment, Question,
    Student, CoursePrerequisite, User, UserRole
)
import bcrypt
from datetime import datetime

def seed_data():
    """Seed dữ liệu mẫu"""
    init_db()
    
    with Session(engine) as session:
        # Kiểm tra xem đã có users chưa
        existing_user = session.exec(select(User)).first()
        if existing_user:
            print("Dữ liệu đã tồn tại, bỏ qua seed")
            return
        
        # 1. Programs
        programs_data = [
            {"code": "TOURISM", "name": "Quản trị Du lịch", "expected_threshold": 0.7},
            {"code": "TRAVEL", "name": "Quản trị dịch vụ du lịch và lữ hành", "expected_threshold": 0.7},
            {"code": "HOTEL", "name": "Quản trị khách sạn", "expected_threshold": 0.7},
            {"code": "RESTAURANT", "name": "Quản trị Nhà Hàng và dịch vụ ăn uống", "expected_threshold": 0.7},
            {"code": "GUIDE", "name": "Hướng Dẫn Viên", "expected_threshold": 0.7},
            {"code": "TOUR", "name": "Du Lịch", "expected_threshold": 0.7},
        ]
        
        programs = []
        for prog_data in programs_data:
            program = Program(**prog_data)
            session.add(program)
            programs.append(program)
        session.commit()
        for program in programs:
            session.refresh(program)
        print(f"✓ Đã tạo {len(programs)} Programs")
        
        # Lấy program đầu tiên (TOURISM) để seed PLOs và Courses
        program = programs[0]
        
        # 2. PLOs
        plos_data = [
            {"code": "PLO1", "description": "Kiến thức chuyên môn cơ bản về du lịch"},
            {"code": "PLO2", "description": "Kỹ năng nghề nghiệp và thực hành"},
            {"code": "PLO3", "description": "Kỹ năng phân tích & giải quyết vấn đề"},
            {"code": "PLO4", "description": "Kỹ năng giao tiếp và dịch vụ khách hàng"},
            {"code": "PLO5", "description": "Ý thức nghề nghiệp và phát triển bền vững"},
            {"code": "PLO6", "description": "Sử dụng công nghệ và marketing du lịch"}
        ]
        
        plos = []
        for plo_data in plos_data:
            plo = PLO(**plo_data, program_id=program.id)
            session.add(plo)
            plos.append(plo)
        session.commit()
        for plo in plos:
            session.refresh(plo)
        print(f"✓ Đã tạo {len(plos)} PLOs")
        
        # 3. Courses
        courses_data = [
            {"code": "DMKT201", "title": "Marketing Du lịch", "credits": 3, 
             "description": "Cơ bản về marketing cho điểm đến", "version_year": 2025},
            {"code": "DMKT302", "title": "Thương mại điện tử trong Du lịch", "credits": 3,
             "description": "Ứng dụng E-commerce cho dịch vụ du lịch", "version_year": 2025},
            {"code": "GUIDE101", "title": "Hướng dẫn Du lịch", "credits": 2,
             "description": "Kỹ năng hướng dẫn cơ bản", "version_year": 2025},
            {"code": "HOTEL101", "title": "Quản trị Khách sạn cơ bản", "credits": 3,
             "description": "Quy trình phục vụ khách sạn", "version_year": 2025},
            {"code": "INTERNSHIP", "title": "Thực tập tại Doanh nghiệp Du lịch", "credits": 6,
             "description": "Thực hành thực tế tại doanh nghiệp", "version_year": 2025}
        ]
        
        courses = []
        for course_data in courses_data:
            course = Course(**course_data, program_id=program.id)
            session.add(course)
            courses.append(course)
        session.commit()
        for course in courses:
            session.refresh(course)
        print(f"✓ Đã tạo {len(courses)} Courses")
        
        # 4. CLOs
        clos_data = [
            {"course_code": "DMKT201", "code": "DMKT201_CLO1", "verb": "Phân tích",
             "text": "Phân tích phân khúc thị trường du lịch", "bloom_level": "Analyze"},
            {"course_code": "DMKT201", "code": "DMKT201_CLO2", "verb": "Thiết kế",
             "text": "Thiết kế chiến dịch marketing cho điểm đến", "bloom_level": "Create"},
            {"course_code": "DMKT302", "code": "DMKT302_CLO1", "verb": "Thiết kế",
             "text": "Thiết kế chiến dịch E-marketing cho sản phẩm du lịch", "bloom_level": "Create"},
            {"course_code": "GUIDE101", "code": "GUIDE101_CLO1", "verb": "Áp dụng",
             "text": "Áp dụng kỹ năng giao tiếp đa văn hóa khi hướng dẫn", "bloom_level": "Apply"}
        ]
        
        from app.models import BloomLevel
        clos = []
        for clo_data_item in clos_data:
            course_code = clo_data_item.pop("course_code")
            course = next((c for c in courses if c.code == course_code), None)
            if course:
                bloom_level_str = clo_data_item.pop("bloom_level")
                clo = CLO(
                    **clo_data_item,
                    course_id=course.id,
                    bloom_level=BloomLevel[bloom_level_str.upper()]
                )
                session.add(clo)
                clos.append(clo)
        session.commit()
        for clo in clos:
            session.refresh(clo)
        print(f"✓ Đã tạo {len(clos)} CLOs")
        
        # 5. Prerequisite
        dmkt201 = next((c for c in courses if c.code == "DMKT201"), None)
        dmkt302 = next((c for c in courses if c.code == "DMKT302"), None)
        
        if dmkt201 and dmkt302:
            from app.models import PrerequisiteType, ConditionType
            prereq = CoursePrerequisite(
                course_id=dmkt302.id,
                prereq_course_id=dmkt201.id,
                type=PrerequisiteType.STRICT,
                condition_type=ConditionType.PASS_COURSE,
                condition_payload={},
                version_year=2025
            )
            session.add(prereq)
            session.commit()
            session.refresh(prereq)
            print(f"✓ Đã tạo Prerequisite: DMKT302 requires DMKT201")
        
        # 6. Sample Users
        users_data = [
            {"name": "Giảng viên A", "email": "instructor@example.com", 
             "password": "password123", "role": UserRole.INSTRUCTOR},
            {"name": "Trưởng bộ môn", "email": "manager@example.com",
             "password": "password123", "role": UserRole.PROGRAM_MANAGER},
            {"name": "QA Admin", "email": "qa@example.com",
             "password": "password123", "role": UserRole.QA_ADMIN},
            {"name": "Admin", "email": "admin@example.com",
             "password": "password123", "role": UserRole.ADMIN}
        ]
        
        users = []
        for user_data in users_data:
            password = user_data.pop("password")
            # Hash password trực tiếp bằng bcrypt
            password_bytes = password.encode('utf-8')
            if len(password_bytes) > 72:
                password_bytes = password_bytes[:72]
            hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
            
            user = User(
                **user_data,
                hashed_password=hashed_password
            )
            session.add(user)
            users.append(user)
        session.commit()
        for user in users:
            session.refresh(user)
        print(f"✓ Đã tạo {len(users)} Users")
        print("  - instructor@example.com / password123")
        print("  - manager@example.com / password123")
        print("  - qa@example.com / password123")
        print("  - admin@example.com / password123")
        
        print("\n✓ Seed data hoàn tất!")

if __name__ == "__main__":
    seed_data()

