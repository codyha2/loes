import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CoursePrereqManager from '../components/CoursePrereqManager';
import ExportDialog from '../components/ExportDialog';
import ScoreInput from '../components/ScoreInput';
import CLOList from '../components/CLOList';
import AssessmentList from '../components/AssessmentList';
import CLOPLOMatrix from '../components/CLOPLOMatrix';
import ReferenceManager from '../components/ReferenceManager';
import RubricManager from '../components/RubricManager';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import AppFooter from '../components/AppFooter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Course {
  id: number;
  code: string;
  title: string;
  credits: number;
  description: string;
}

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('prerequisites');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Kiểm tra URL params để set active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Lỗi khi tải thông tin môn học:', error);
    }
  };

  const handleDeleteCourseClick = () => {
    setConfirmDialog({ isOpen: true });
  };

  const handleDeleteCourseConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/courses/${parseInt(courseId || '0')}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setConfirmDialog({ isOpen: false });
      setAlertDialog({ isOpen: true, title: 'Thành công', message: 'Đã xóa môn học thành công!', type: 'success' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Lỗi khi xóa môn học:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      setConfirmDialog({ isOpen: false });
      setAlertDialog({ isOpen: true, title: 'Lỗi', message: 'Lỗi khi xóa môn học: ' + errorMessage, type: 'error' });
    }
  };

  if (!course) {
    return <div className="p-6">Đang tải...</div>;
  }

          const tabs = [
            { id: 'info', label: 'Thông tin' },
            { id: 'clos', label: 'CLO' },
            { id: 'assessments', label: 'Assessment' },
            { id: 'scores', label: 'Điểm' },
            { id: 'matrix', label: 'Ma trận CLO-PLO' },
            { id: 'rubrics', label: 'Rubric' },
            { id: 'prerequisites', label: 'Prerequisites' },
            { id: 'references', label: 'Tài liệu tham khảo' },
            { id: 'export', label: 'Export' },
          ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center group transition-colors duration-200"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
              <span className="font-medium">Quay lại Dashboard</span>
            </button>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {course.code} - {course.title}
              </h1>
              <p className="text-indigo-100">{course.description}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b-2 border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-semibold text-sm transition-all duration-200 rounded-t-lg`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'prerequisites' ? (
              <CoursePrereqManager courseId={parseInt(courseId || '0')} />
            ) : (
              <>
                {activeTab === 'info' && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Thông tin môn học</h2>
                      <button
                        onClick={handleDeleteCourseClick}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                        title="Xóa môn học này"
                      >
                        🗑️ Xóa môn học
                      </button>
                    </div>
                    <dl className="grid grid-cols-2 gap-4">
                      <dt className="font-medium">Mã học phần:</dt>
                      <dd>{course.code}</dd>
                      <dt className="font-medium">Tên học phần:</dt>
                      <dd>{course.title}</dd>
                      <dt className="font-medium">Số tín chỉ:</dt>
                      <dd>{course.credits}</dd>
                      <dt className="font-medium">Mô tả:</dt>
                      <dd>{course.description || '(Chưa có mô tả)'}</dd>
                    </dl>
                  </div>
                )}
                {activeTab === 'clos' && (
                  <CLOList courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'assessments' && (
                  <AssessmentList courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'scores' && (
                  <ScoreInput courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'matrix' && (
                  <CLOPLOMatrix courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'rubrics' && (
                  <RubricManager courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'references' && (
                  <ReferenceManager courseId={parseInt(courseId || '0')} />
                )}
                {activeTab === 'export' && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Xuất đề cương học phần</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Nhấn nút bên dưới để xuất đề cương học phần ra file Word (.docx)
                    </p>
                    {showExportDialog ? (
                      <ExportDialog
                        courseId={parseInt(courseId || '0')}
                        onClose={() => setShowExportDialog(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowExportDialog(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Xuất file
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Xác nhận xóa môn học"
        message="Bạn có chắc muốn xóa môn học này? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan (CLO, Assessment, Prerequisites, v.v.)."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleDeleteCourseConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
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

export default CoursePage;

