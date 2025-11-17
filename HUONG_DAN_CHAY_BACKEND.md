# Hướng dẫn chạy Backend

## ✅ Đã cài đặt xong dependencies

Tất cả các package cần thiết đã được cài đặt:
- ✅ sqlmodel
- ✅ fastapi
- ✅ uvicorn
- ✅ pandas (phiên bản mới tương thích Python 3.13)
- ✅ openpyxl
- ✅ và tất cả các package khác

## 🚀 Cách chạy Backend

### Cách 1: Chạy trực tiếp (đang chạy)

Backend đang được chạy tự động trong background. Kiểm tra:
- Mở trình duyệt: http://localhost:8000/health
- Nếu thấy `{"status":"healthy"}` → Backend đã chạy thành công!

### Cách 2: Chạy thủ công

Nếu cần chạy lại, mở terminal mới và chạy:

```powershell
cd C:\Users\Admin\Documents\LOES\backend
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Cách 3: Dùng Docker Compose

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up backend
```

## 🔍 Kiểm tra Backend

1. **Health check:**
   - http://localhost:8000/health
   - Kết quả mong đợi: `{"status":"healthy"}`

2. **API root:**
   - http://localhost:8000/
   - Kết quả mong đợi: `{"message":"LOES API","version":"1.0.0"}`

## ⚠️ Lưu ý

1. **Database phải chạy trước:**
   ```powershell
   docker compose up -d db
   ```

2. **Port 8000 phải trống:**
   - Nếu port 8000 đã được sử dụng, đổi port:
   ```powershell
   py -m uvicorn main:app --reload --port 8001
   ```
   - Và cập nhật `REACT_APP_API_URL` trong frontend

3. **Kiểm tra log:**
   - Xem terminal để biết lỗi (nếu có)
   - Log sẽ hiển thị các request đến API

## 🎯 Sau khi backend chạy

1. Frontend sẽ có thể kết nối với backend
2. Tất cả các nút "Tạo" sẽ hoạt động bình thường
3. Có thể đăng nhập, tạo CLO, Course, Program, v.v.

## 🐛 Nếu vẫn lỗi

1. Kiểm tra Database có chạy không:
   ```powershell
   docker ps
   ```

2. Kiểm tra log backend để xem lỗi cụ thể

3. Đảm bảo đã đăng nhập (có token trong localStorage)

