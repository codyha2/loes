import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  program_id?: number | null;
  department?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo một instance axios riêng với interceptor đơn giản
const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor đơn giản để thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const fetchUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      return;
    }
    
    try {
      // Dùng apiClient thay vì axios để tự động có token
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Fetch user error:', error);
      // Nếu lỗi 401, xóa token và logout
      if (error.response?.status === 401) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }
  }, [token, fetchUser]);

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
      // Xóa token cũ
      localStorage.removeItem('token');
      
      // Gửi request login (không dùng apiClient vì chưa có token)
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      const access_token = response.data?.access_token;
      const userData = response.data?.user;

      if (!access_token) {
        throw new Error('Không nhận được token từ server');
      }

      // Lưu token
      localStorage.setItem('token', access_token);
      
      // Cập nhật state
      setToken(access_token);
      if (userData) {
        setUser(userData);
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

