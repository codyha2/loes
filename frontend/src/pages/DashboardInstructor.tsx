import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WorkflowGuide from '../components/WorkflowGuide';
import CLOGuide from '../components/CLOGuide';
import PLOGuide from '../components/PLOGuide';
import CourseForm from '../components/CourseForm';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import AppFooter from '../components/AppFooter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Course {
  id: number;
  code: string;
  title: string;
  credits: number;
}

const DashboardInstructor: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; courseId: number | null }>({ isOpen: false, courseId: null });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = (courseId: number) => {
    setConfirmDialog({ isOpen: true, courseId });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.courseId) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/courses/${confirmDialog.courseId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setConfirmDialog({ isOpen: false, courseId: null });
      setAlertDialog({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã xóa môn học thành công!',
        type: 'success'
      });
      fetchCourses();
    } catch (error: any) {
      console.error('Lỗi khi xóa môn học:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      setConfirmDialog({ isOpen: false, courseId: null });
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi xóa môn học: ' + errorMessage,
        type: 'error'
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCourses(response.data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách môn học:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-lg p-2">
                  <span className="text-2xl">📚</span>
                </div>
                <h1 className="text-xl font-bold text-white">LOES</h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-full p-2">
                  <span className="text-white text-lg">👤</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-indigo-200">Xin chào</span>
                  <span className="text-sm font-semibold text-white">
                    {user?.name || 'Người dùng'}
                  </span>
                  {user?.role && (
                    <span className="text-xs text-indigo-200">
                      {user.role === 'instructor' ? 'Giảng viên' : 
                       user.role === 'program_manager' ? 'Quản lý chương trình' :
                       user.role === 'qa_admin' ? 'Quản trị viên QA' :
                       user.role === 'admin' ? 'Quản trị viên hệ thống' : user.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 w-px bg-white/30"></div>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 shadow-lg mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard Giảng viên</h2>
              <p className="text-indigo-100 text-base">
                Quản lý CLO, PLO, Prerequisites và xuất đề cương học phần
              </p>
            </div>
          </div>

          {/* Workflow Guide */}
          <WorkflowGuide />

          {/* CLO Guide */}
          <CLOGuide />

          {/* PLO Guide */}
          <PLOGuide />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-3">
                <div className="bg-indigo-600 rounded-lg p-2 mr-3">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-lg font-bold text-indigo-900">Tạo CLO</h3>
              </div>
              <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                Tạo mục tiêu học tập (CLO) cho môn học.
              </p>
              <button
                onClick={() => {
                  if (courses.length > 0) {
                    navigate(`/courses/${courses[0].id}?tab=clos`);
                  } else {
                    alert('Chưa có môn học. Vui lòng tạo môn học trước.');
                  }
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={courses.length === 0 || loading}
              >
                {loading ? 'Đang tải...' : courses.length > 0 ? 'Vào môn học để tạo CLO' : 'Chưa có môn học'}
              </button>
              <p className="text-xs text-indigo-700 mt-3 flex items-start">
                <span className="mr-1">💡</span>
                <span>PLO được quản lý ở cấp chương trình. Vào tab "Ma trận CLO-PLO" để liên kết.</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-3">
                <div className="bg-green-600 rounded-lg p-2 mr-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-bold text-green-900">Nhập điểm</h3>
              </div>
              <p className="text-sm text-green-800 mb-4 leading-relaxed">
                Nhập điểm cho sinh viên theo từng câu hỏi.
              </p>
              <button
                onClick={() => {
                  if (courses.length > 0) {
                    navigate(`/courses/${courses[0].id}?tab=scores`);
                  } else {
                    alert('Chưa có môn học. Vui lòng tạo môn học trước.');
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={courses.length === 0 || loading}
              >
                {loading ? 'Đang tải...' : courses.length > 0 ? 'Vào môn học để nhập điểm' : 'Chưa có môn học'}
              </button>
              <p className="text-xs text-green-700 mt-3 flex items-start">
                <span className="mr-1">💡</span>
                <span>Hệ thống sẽ tự động tính tỷ lệ đạt CLO/PLO dựa trên điểm số.</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-3">
                <div className="bg-blue-600 rounded-lg p-2 mr-3">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-bold text-blue-900">Xuất Word</h3>
              </div>
              <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                Xuất đề cương học phần ra file Word.
              </p>
              <button
                onClick={() => {
                  if (courses.length > 0) {
                    navigate(`/courses/${courses[0].id}?tab=export`);
                  } else {
                    alert('Chưa có môn học. Vui lòng tạo môn học trước.');
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={courses.length === 0 || loading}
              >
                {loading ? 'Đang tải...' : courses.length > 0 ? 'Vào môn học để xuất Word' : 'Chưa có môn học'}
              </button>
              <p className="text-xs text-blue-700 mt-3 flex items-start">
                <span className="mr-1">💡</span>
                <span>File Word sẽ bao gồm: CLO, Prerequisites, Assessment plan, và thông tin giảng viên.</span>
              </p>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Danh sách môn học</h3>
              <button
                onClick={() => setShowCourseForm(true)}
                className="bg-white text-indigo-600 px-5 py-2.5 rounded-lg hover:bg-indigo-50 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                + Tạo môn học mới
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {loading ? (
                <li className="px-6 py-4">Đang tải...</li>
              ) : courses.length === 0 ? (
                <li className="px-6 py-4">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Chưa có môn học nào</p>
                    <button
                      onClick={() => setShowCourseForm(true)}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                    >
                      + Tạo môn học đầu tiên
                    </button>
                  </div>
                </li>
              ) : (
                courses.map((course) => (
                  <li key={course.id} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer group"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <p className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {course.code} - {course.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {course.credits} tín chỉ
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course.id}?tab=clos`);
                            }}
                            className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-medium shadow-sm hover:shadow transition-all duration-200"
                            title="Tạo CLO"
                          >
                            CLO
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course.id}?tab=scores`);
                            }}
                            className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium shadow-sm hover:shadow transition-all duration-200"
                            title="Nhập điểm"
                          >
                            Điểm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course.id}?tab=export`);
                            }}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium shadow-sm hover:shadow transition-all duration-200"
                            title="Xuất Word"
                          >
                            Export
                          </button>
                          <button
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="text-lg text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Xem chi tiết"
                          >
                            →
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course.id);
                            }}
                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            title="Xóa môn học"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {showCourseForm && (
            <CourseForm
              onSuccess={() => {
                fetchCourses();
                setShowCourseForm(false);
              }}
              onClose={() => setShowCourseForm(false)}
            />
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Xác nhận xóa môn học"
        message="Bạn có chắc muốn xóa môn học này? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan (CLO, Assessment, Prerequisites, v.v.)."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, courseId: null })}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', type: 'info' })}
      />
      <AppFooter />
    </div>
  );
};

export default DashboardInstructor;

