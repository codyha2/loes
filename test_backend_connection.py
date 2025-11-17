"""
Script để test kết nối backend
"""
import requests
import sys

API_URL = "http://localhost:8000"

def test_backend():
    print("🔍 Đang kiểm tra kết nối backend...")
    print(f"URL: {API_URL}\n")
    
    # Test 1: Health check
    try:
        print("1. Kiểm tra /health endpoint...")
        response = requests.get(f"{API_URL}/health", timeout=5)
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ✅ Response: {response.text}\n")
    except requests.exceptions.ConnectionError:
        print("   ❌ Lỗi: Không kết nối được với backend!")
        print("   💡 Hãy chạy backend bằng lệnh: cd backend && uvicorn main:app --reload\n")
        return False
    except Exception as e:
        print(f"   ❌ Lỗi: {e}\n")
        return False
    
    # Test 2: Root endpoint
    try:
        print("2. Kiểm tra / endpoint...")
        response = requests.get(f"{API_URL}/", timeout=5)
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ✅ Response: {response.json()}\n")
    except Exception as e:
        print(f"   ❌ Lỗi: {e}\n")
        return False
    
    # Test 3: Auth endpoint
    try:
        print("3. Kiểm tra /api/auth/me endpoint...")
        response = requests.get(f"{API_URL}/api/auth/me", timeout=5)
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ✅ Response: {response.json()}\n")
    except Exception as e:
        print(f"   ⚠️  Lỗi (có thể do chưa đăng nhập): {e}\n")
    
    print("✅ Backend đang chạy bình thường!")
    return True

if __name__ == "__main__":
    success = test_backend()
    sys.exit(0 if success else 1)

