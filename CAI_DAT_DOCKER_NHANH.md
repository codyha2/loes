# 🐳 Hướng dẫn cài đặt Docker Desktop (Nhanh)

## ⚠️ Vấn đề hiện tại

Bạn đang gặp lỗi: `docker : The term 'docker' is not recognized`

Điều này có nghĩa là **Docker chưa được cài đặt** trên máy tính của bạn.

## ✅ Giải pháp: Cài đặt Docker Desktop

### Bước 1: Tải Docker Desktop

1. Truy cập: **https://www.docker.com/products/docker-desktop/**
2. Click nút **"Download for Windows"**
3. File tải về sẽ có tên: `Docker Desktop Installer.exe` (khoảng 500MB)

### Bước 2: Cài đặt

1. **Chạy file** `Docker Desktop Installer.exe` vừa tải
2. Trong cửa sổ cài đặt:
   - ✅ Đánh dấu "Use WSL 2 instead of Hyper-V" (nếu có)
   - ✅ Đánh dấu "Add shortcut to desktop"
3. Click **"Ok"** và đợi cài đặt hoàn tất (5-10 phút)
4. **QUAN TRỌNG:** Click **"Close and restart"** hoặc **khởi động lại máy tính**

### Bước 3: Khởi động Docker Desktop

1. Sau khi khởi động lại, tìm **"Docker Desktop"** trong Start Menu
2. Mở Docker Desktop
3. Đợi Docker Desktop khởi động hoàn toàn (30 giây - 2 phút)
   - Icon Docker sẽ xuất hiện ở **system tray** (góc dưới bên phải)
   - Icon không có dấu cảnh báo = Docker đã sẵn sàng

### Bước 4: Kiểm tra cài đặt

Mở PowerShell và chạy:

```powershell
docker --version
```

**Kết quả mong đợi:** `Docker version 24.x.x, build ...`

Nếu vẫn báo lỗi, thử:
1. Đóng và mở lại PowerShell
2. Đảm bảo Docker Desktop đang chạy (icon ở system tray)
3. Khởi động lại máy tính một lần nữa

### Bước 5: Chạy dự án LOES

Sau khi Docker đã hoạt động:

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up --build
```

## 🔍 Kiểm tra nhanh bằng script

Chạy script kiểm tra:

```powershell
.\kiem-tra-docker.ps1
```

Script này sẽ cho bạn biết:
- Docker đã được cài đặt chưa
- Docker Desktop đang chạy chưa
- Bạn có thể chạy dự án chưa

## ❓ Lỗi thường gặp

### Lỗi: "WSL 2 installation is incomplete"

**Giải pháp:**
1. Mở PowerShell với quyền **Administrator**
2. Chạy: `wsl --install`
3. Khởi động lại máy
4. Mở lại Docker Desktop

### Lỗi: "Virtualization is not enabled"

**Giải pháp:**
1. Khởi động lại máy
2. Vào **BIOS/UEFI** (nhấn F2, F10, hoặc Del khi khởi động)
3. Tìm và **bật**:
   - Virtualization Technology (Intel VT-x hoặc AMD-V)
   - Hyper-V
4. Lưu và khởi động lại

### Docker Desktop không khởi động

1. Đảm bảo Windows đã cập nhật đầy đủ
2. Kiểm tra WSL 2 đã được cài đặt: `wsl --status`
3. Chạy Docker Desktop với quyền Administrator

## 📚 Tài liệu tham khảo

- Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
- WSL 2: https://docs.microsoft.com/en-us/windows/wsl/install

## ⏱️ Thời gian ước tính

- Tải Docker Desktop: 5-10 phút (tùy tốc độ mạng)
- Cài đặt: 5-10 phút
- Khởi động lại: 2-3 phút
- **Tổng cộng: ~15-25 phút**

---

**Sau khi cài đặt xong, quay lại và chạy:**
```powershell
docker compose up --build
```



