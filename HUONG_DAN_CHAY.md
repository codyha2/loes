# Hướng dẫn chạy dự án LOES

## Bước 1: Kiểm tra môi trường

Đảm bảo bạn đã cài đặt:
- Docker và Docker Compose
- Git

## Bước 2: Clone và vào thư mục dự án

```powershell
cd C:\Users\Admin\Documents\LOES
```

## Bước 3: Chạy Docker Compose

**⚠️ QUAN TRỌNG:** Đảm bảo Docker Desktop đã được cài đặt và đang chạy (icon Docker ở system tray).

Mở PowerShell và chạy từng lệnh:

```powershell
docker compose up --build
```

**Lưu ý:** 
- Docker Desktop mới dùng `docker compose` (không có dấu gạch ngang)
- Nếu dùng Docker Compose v1, dùng `docker-compose` (có dấu gạch ngang)

Lệnh này sẽ:
- Build images cho postgres, backend, frontend
- Khởi động tất cả services
- Tự động tạo database

## Bước 4: Seed dữ liệu mẫu

Mở terminal mới (giữ terminal chạy docker-compose) và chạy:

```powershell
docker compose exec backend python seed_data.py
```

Bạn sẽ thấy thông báo:
```
✓ Đã tạo Program: Quản trị Du lịch
✓ Đã tạo 6 PLOs
✓ Đã tạo 5 Courses
...
```

## Bước 5: Truy cập ứng dụng

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

## Bước 6: Đăng nhập

Sử dụng một trong các tài khoản sau:

- **Giảng viên:**
  - Email: `instructor@example.com`
  - Password: `password123`

- **Trưởng bộ môn:**
  - Email: `manager@example.com`
  - Password: `password123`

- **QA Admin:**
  - Email: `qa@example.com`
  - Password: `password123`

- **Admin:**
  - Email: `admin@example.com`
  - Password: `password123`

## Bước 7: Sử dụng ứng dụng

1. **Dashboard:** Xem danh sách môn học
2. **Click vào môn học:** Xem chi tiết, quản lý CLO, Prerequisites
3. **Tab Prerequisites:** 
   - Xem danh sách prerequisites
   - Click "Gợi ý môn học tiên quyết" để sử dụng AI suggest
   - Xem phân tích tác động
4. **Tab Export:** Xuất đề cương học phần ra file Word

## Dừng ứng dụng

Nhấn `Ctrl+C` trong terminal đang chạy docker-compose, sau đó:

```powershell
docker compose down
```

## Xóa dữ liệu và chạy lại

Nếu muốn xóa tất cả dữ liệu và seed lại:

```powershell
docker compose down -v
docker compose up --build
docker compose exec backend python seed_data.py
```

## Troubleshooting

### Lỗi: Port đã được sử dụng

Nếu port 3000, 8000, hoặc 5432 đã được sử dụng, sửa file `docker-compose.yml` để đổi port.

### Lỗi: Database connection failed

Đảm bảo postgres container đã chạy:
```powershell
docker compose ps
```

Nếu postgres chưa chạy, restart:
```powershell
docker compose restart postgres
```

### Lỗi: Module not found

Nếu backend báo lỗi module, rebuild:
```powershell
docker compose build backend
docker compose up backend
```

## Cấu trúc thư mục

```
LOES/
├── backend/          # FastAPI backend
│   ├── app/         # Application code
│   ├── tests/       # Tests
│   └── seed_data.py # Seed script
├── frontend/        # React frontend
│   └── src/        # Source code
├── docker-compose.yml
└── README.md
```

## Liên hệ

Nếu gặp vấn đề, kiểm tra logs:
```powershell
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

