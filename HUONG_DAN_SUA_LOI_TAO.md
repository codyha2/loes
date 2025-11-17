# Hướng dẫn sửa lỗi "Không tạo được"

## 🔍 Kiểm tra nhanh

### 1. Kiểm tra Backend có đang chạy không

Mở trình duyệt và truy cập:
- http://localhost:8000/health
- http://localhost:8000/

**Nếu không truy cập được:**
- Backend chưa chạy → Xem bước 2

### 2. Chạy Backend

Mở terminal/PowerShell và chạy:

```powershell
cd C:\Users\Admin\Documents\LOES\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Hoặc nếu dùng Docker:

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up backend
```

### 3. Kiểm tra Database

Backend cần kết nối với PostgreSQL. Kiểm tra:
- Docker có đang chạy không?
- Database container có đang chạy không?

```powershell
docker ps
```

Nếu database không chạy:

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up -d db
```

### 4. Kiểm tra Console (F12)

Mở Developer Tools (F12) → Tab Console:
- Xem có lỗi gì không?
- Lỗi CORS?
- Lỗi 401 (Unauthorized)?
- Lỗi 500 (Server Error)?

### 5. Kiểm tra Network (F12)

Mở Developer Tools (F12) → Tab Network:
- Click vào một request bị lỗi
- Xem Response tab → Có thông báo lỗi gì?

## 🛠️ Các lỗi thường gặp

### Lỗi: "Không kết nối được với server"
**Nguyên nhân:** Backend chưa chạy
**Giải pháp:** Chạy backend (bước 2)

### Lỗi: "401 Unauthorized"
**Nguyên nhân:** Token hết hạn hoặc không hợp lệ
**Giải pháp:** Đăng xuất và đăng nhập lại

### Lỗi: "403 Forbidden"
**Nguyên nhân:** Không có quyền
**Giải pháp:** Kiểm tra role của user (cần INSTRUCTOR, PROGRAM_MANAGER, hoặc ADMIN)

### Lỗi: "500 Internal Server Error"
**Nguyên nhân:** Lỗi backend hoặc database
**Giải pháp:** 
1. Xem log backend để biết lỗi cụ thể
2. Kiểm tra database connection
3. Kiểm tra xem có user nào trong database không

### Lỗi: "CORS policy"
**Nguyên nhân:** Frontend và backend không cùng origin
**Giải pháp:** Đảm bảo frontend chạy trên http://localhost:3000 và backend trên http://localhost:8000

## 📝 Kiểm tra nhanh bằng script

Chạy script test:

```powershell
cd C:\Users\Admin\Documents\LOES
py test_backend_connection.py
```

## 🔧 Sửa lỗi nhanh

### Nếu backend không chạy:

```powershell
cd C:\Users\Admin\Documents\LOES\backend
py -m uvicorn main:app --reload
```

### Nếu database không kết nối:

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up -d db
```

### Nếu không có user trong database:

1. Đăng ký user mới qua trang Register
2. Hoặc tạo user trực tiếp trong database

### Lỗi: "column department does not exist"
**Nguyên nhân:** Database chưa thêm cột `department` mới để lưu thông tin "Trường / Khoa".
**Giải pháp:** Chạy migration sau để bổ sung cột:

```powershell
cd C:\Users\Admin\Documents\LOES\backend
py migrate_add_department.py
```

## 📞 Thông tin debug

Khi báo lỗi, vui lòng cung cấp:
1. Thông báo lỗi chính xác (từ AlertDialog hoặc Console)
2. Status code (từ Network tab)
3. Response body (từ Network tab)
4. Backend logs (nếu có)

