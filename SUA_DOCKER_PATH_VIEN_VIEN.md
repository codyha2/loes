# Sửa Docker PATH vĩnh viễn

## Vấn đề

Docker Desktop đã được cài đặt nhưng PowerShell không nhận diện lệnh `docker` khi mở PowerShell mới.

## Giải pháp tạm thời (đã áp dụng)

Đã thêm Docker vào PATH trong session hiện tại:
```powershell
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
```

**Lưu ý:** Giải pháp này chỉ có tác dụng trong session PowerShell hiện tại. Khi mở PowerShell mới, bạn cần chạy lại lệnh này.

## Giải pháp vĩnh viễn

### Cách 1: Thêm vào PATH qua System Properties (Khuyến nghị)

1. Nhấn `Win + R`, gõ `sysdm.cpl` và nhấn Enter
2. Chọn tab **"Advanced"**
3. Click **"Environment Variables"**
4. Trong phần **"System variables"**, tìm và chọn **"Path"**, click **"Edit"**
5. Click **"New"** và thêm:
   ```
   C:\Program Files\Docker\Docker\resources\bin
   ```
6. Click **"OK"** ở tất cả các cửa sổ
7. **Đóng và mở lại PowerShell**

### Cách 2: Thêm vào PowerShell Profile

1. Mở PowerShell
2. Chạy lệnh để mở profile:
   ```powershell
   notepad $PROFILE
   ```
3. Nếu file chưa tồn tại, tạo mới:
   ```powershell
   New-Item -Path $PROFILE -Type File -Force
   notepad $PROFILE
   ```
4. Thêm dòng sau vào cuối file:
   ```powershell
   $env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
   ```
5. Lưu và đóng file
6. Đóng và mở lại PowerShell

### Cách 3: Khởi động lại máy tính

Đôi khi Docker Desktop tự động thêm vào PATH sau khi khởi động lại máy tính.

## Kiểm tra

Sau khi áp dụng một trong các cách trên, mở PowerShell mới và chạy:

```powershell
docker --version
docker compose version
```

Nếu hiển thị số phiên bản, Docker đã được cấu hình đúng.

## Lưu ý

- **Cách 1** (System Properties) áp dụng cho tất cả ứng dụng
- **Cách 2** (PowerShell Profile) chỉ áp dụng cho PowerShell
- Nếu vẫn không hoạt động, thử **khởi động lại máy tính**


