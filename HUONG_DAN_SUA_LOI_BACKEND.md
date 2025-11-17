# Hướng dẫn sửa lỗi Backend không chạy

## 🔍 Vấn đề

Backend không phản hồi khi truy cập `http://localhost:8000/health`

## ✅ Giải pháp

### Cách 1: Chạy Backend thủ công (Khuyến nghị)

1. **Mở PowerShell hoặc Command Prompt**

2. **Chạy lệnh:**
```powershell
cd C:\Users\Admin\Documents\LOES\backend
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

3. **Kiểm tra:**
   - Mở trình duyệt: http://127.0.0.1:8000/health
   - Hoặc: http://localhost:8000/health
   - Kết quả mong đợi: `{"status":"healthy"}`

### Cách 2: Dùng file batch (Dễ nhất)

1. **Double-click vào file:** `start_backend.bat`
   - File này sẽ tự động chạy backend

2. **Kiểm tra:**
   - Mở trình duyệt: http://localhost:8000/health

### Cách 3: Dùng Docker Compose

1. **Kiểm tra Docker có chạy không:**
```powershell
docker ps
```

2. **Chạy backend bằng Docker:**
```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up backend
```

## ⚠️ Lưu ý quan trọng

### 1. Database phải chạy trước

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up -d db
```

### 2. Port 8000 bị chiếm

Nếu port 8000 đã được sử dụng:
- **Option A:** Dừng process đang dùng port 8000:
  ```powershell
  # Tìm process
  netstat -ano | findstr :8000
  
  # Kill process (thay PID bằng số thực tế)
  taskkill /F /PID <PID>
  ```

- **Option B:** Chạy backend trên port khác:
  ```powershell
  py -m uvicorn main:app --reload --port 8001
  ```
  Sau đó cập nhật `REACT_APP_API_URL` trong frontend thành `http://localhost:8001`

### 3. Kiểm tra lỗi

Nếu backend không chạy được, xem log để biết lỗi:
- Lỗi import module → Cài lại dependencies
- Lỗi database → Kiểm tra Docker và database connection
- Lỗi port → Đổi port hoặc kill process cũ

## 🔧 Troubleshooting

### Lỗi: "ModuleNotFoundError: No module named 'sqlmodel'"
**Giải pháp:**
```powershell
cd C:\Users\Admin\Documents\LOES\backend
py -m pip install -r requirements.txt
```

### Lỗi: "Address already in use"
**Giải pháp:**
- Dùng file `kill_backend.bat` để dừng process cũ
- Hoặc chạy trên port khác

### Lỗi: "Could not connect to database"
**Giải pháp:**
```powershell
docker compose up -d db
# Đợi vài giây để database khởi động
```

## 📝 Kiểm tra nhanh

1. **Backend có chạy không?**
   - Truy cập: http://localhost:8000/health
   - Nếu thấy `{"status":"healthy"}` → ✅ OK

2. **Database có chạy không?**
   ```powershell
   docker ps | findstr postgres
   ```

3. **Dependencies đã cài chưa?**
   ```powershell
   py -c "import sqlmodel; print('OK')"
   ```

## 🎯 Sau khi backend chạy thành công

1. Frontend sẽ tự động kết nối
2. Tất cả các nút "Tạo" sẽ hoạt động
3. Có thể đăng nhập và sử dụng hệ thống

