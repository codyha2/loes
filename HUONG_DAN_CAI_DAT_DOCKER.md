# Hướng dẫn cài đặt Docker Desktop cho Windows

## Bước 1: Tải Docker Desktop

1. Truy cập: https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Tải file `Docker Desktop Installer.exe`

## Bước 2: Cài đặt Docker Desktop

1. Chạy file `Docker Desktop Installer.exe` vừa tải
2. Trong quá trình cài đặt:
   - ✅ Chọn "Use WSL 2 instead of Hyper-V" (nếu có)
   - ✅ Chọn "Add shortcut to desktop"
3. Click "Ok" và đợi cài đặt hoàn tất
4. **Khởi động lại máy tính** (quan trọng!)

## Bước 3: Khởi động Docker Desktop

1. Sau khi khởi động lại, mở Docker Desktop từ Start Menu
2. Đợi Docker Desktop khởi động hoàn toàn (icon Docker sẽ xuất hiện ở system tray)
3. Kiểm tra Docker đã chạy: icon Docker ở system tray không có dấu cảnh báo

## Bước 4: Kiểm tra cài đặt

Mở PowerShell và chạy:

```powershell
docker --version
```

Kết quả mong đợi: `Docker version 24.x.x, build ...`

```powershell
docker compose version
```

Kết quả mong đợi: `Docker Compose version v2.x.x`

## Bước 5: Chạy dự án LOES

Sau khi Docker đã cài đặt và chạy:

```powershell
cd C:\Users\Admin\Documents\LOES
docker compose up --build
```

**Lưu ý:** 
- Docker Desktop mới sử dụng `docker compose` (không có dấu gạch ngang)
- Nếu bạn dùng Docker Compose cũ (v1), dùng `docker-compose` (có dấu gạch ngang)

## Troubleshooting

### Lỗi: WSL 2 installation is incomplete

Nếu gặp lỗi này:

1. Mở PowerShell với quyền Administrator
2. Chạy:
```powershell
wsl --install
```
3. Khởi động lại máy
4. Mở lại Docker Desktop

### Lỗi: Virtualization is not enabled

1. Khởi động lại máy
2. Vào BIOS/UEFI (thường nhấn F2, F10, hoặc Del khi khởi động)
3. Tìm và bật:
   - Virtualization Technology (Intel VT-x hoặc AMD-V)
   - Hyper-V (nếu có)
4. Lưu và khởi động lại

### Docker Desktop không khởi động

1. Kiểm tra Windows đã cập nhật đầy đủ
2. Đảm bảo WSL 2 đã được cài đặt
3. Chạy Docker Desktop với quyền Administrator

## Tài liệu tham khảo

- Docker Desktop cho Windows: https://docs.docker.com/desktop/install/windows-install/
- WSL 2: https://docs.microsoft.com/en-us/windows/wsl/install


