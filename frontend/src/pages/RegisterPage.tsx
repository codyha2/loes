import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AlertDialog from '../components/AlertDialog';
import AppFooter from '../components/AppFooter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'instructor',
    department: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });
  const navigate = useNavigate();

  // Không cần fetch chương trình nữa, sử dụng input tự do

  // Helper function để convert error thành string an toàn
  const safeStringify = React.useCallback((value: any): string => {
    try {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) {
        return value.map((e: any) => {
          if (typeof e === 'string') return e;
          if (typeof e === 'object' && e !== null) {
            if (e.msg) return String(e.msg);
            if (e.message) return String(e.message);
            return JSON.stringify(e);
          }
          return String(e);
        }).join(', ');
      }
      if (typeof value === 'object') {
        if (value.msg) return String(value.msg);
        if (value.message) return String(value.message);
        if (value.detail) return safeStringify(value.detail);
        return JSON.stringify(value);
      }
      return String(value);
    } catch (e) {
      return 'Lỗi không xác định';
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || null
      });

      setAlertDialog({
        isOpen: true,
        title: 'Đăng ký thành công',
        message: 'Tài khoản của bạn đã được tạo thành công! Vui lòng đăng nhập.',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      try {
        if (err.response?.data) {
          const detail = err.response.data.detail;
          errorMessage = safeStringify(detail);
        } else if (err.message) {
          errorMessage = safeStringify(err.message);
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      }
      
      // Đảm bảo errorMessage luôn là string
      const safeMessage = safeStringify(errorMessage);
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi đăng ký',
        message: safeMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-2xl border-2 border-gray-100">
        <div className="text-center">
          <div className="mx-auto bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-4 w-20 h-20 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h2>
          <h3 className="text-xl font-semibold text-indigo-600">LOES</h3>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Họ và tên *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={`appearance-none relative block w-full px-4 py-3 border-2 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
              placeholder="Nhập họ và tên của bạn"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={`appearance-none relative block w-full px-4 py-3 border-2 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò *
            </label>
            <select
              id="role"
              name="role"
              className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="instructor">Giảng viên</option>
              <option value="program_manager">Quản lý chương trình</option>
              <option value="qa_admin">Quản trị viên QA</option>
              <option value="admin">Quản trị viên hệ thống</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
              Trường / Khoa (tùy chọn)
            </label>
            <input
              id="department"
              name="department"
              type="text"
              className="appearance-none relative_hook block w-full px-4 py-3 border-2 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
              placeholder="Nhập tên trường/khoa nếu có"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
            <p className="text-xs text-gray-500 mt-1">
              💡 Cho biết trường hoặc khoa bạn công tác (tùy chọn).
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={`appearance-none relative block w-full px-4 py-3 border-2 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setErrors({ ...errors, password: '' });
              }}
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Xác nhận mật khẩu *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className={`appearance-none relative block w-full px-4 py-3 border-2 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setErrors({ ...errors, confirmPassword: '' });
              }}
            />
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </form>

        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title || ''}
          message={safeStringify(alertDialog.message)}
          type={alertDialog.type}
          onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', type: 'info' })}
        />
      </div>
    </div>
    <AppFooter />
    </>
  );
};

export default RegisterPage;


