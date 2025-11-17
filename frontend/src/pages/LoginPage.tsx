import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppFooter from '../components/AppFooter';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Đăng nhập thất bại';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    alert('Tính năng quên mật khẩu đang được phát triển');
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12">
      <div className="max-w-md w-full space-y-6 p-10 bg-white rounded-2xl shadow-2xl border-2 border-gray-100">
        {/* Logo và Branding */}
        <div className="text-center">
          <div className="mx-auto bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 w-24 h-24 flex items-center justify-center mb-4 shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="text-white text-5xl font-bold">L</div>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            LOES
          </h1>
          <p className="text-sm text-gray-500 font-medium">Learning Outcomes Evaluation System</p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Đăng nhập</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <span className="mr-2">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-2">🔐</span>
              Đăng nhập
            </button>
            
            <Link
              to="/register"
              className="group relative w-full flex justify-center items-center py-3 px-4 border-2 border-indigo-600 text-base font-semibold rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-2">✨</span>
              Tạo tài khoản mới
            </Link>

          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Quên mật khẩu?
            </button>
            <p className="text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
          <p className="font-bold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Tài khoản demo:
          </p>
          <div className="space-y-2 text-sm">
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="font-semibold text-gray-800">👨‍🏫 Giảng viên</p>
              <p className="text-gray-600">instructor@example.com</p>
              <p className="text-gray-500 text-xs">Mật khẩu: password123</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="font-semibold text-gray-800">👨‍💼 Quản trị viên</p>
              <p className="text-gray-600">admin@example.com</p>
              <p className="text-gray-500 text-xs">Mật khẩu: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
    </>
  );
};

export default LoginPage;

