import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CLOForm from './CLOForm';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import { sortClosWithDisplay, CLOWithDisplay } from '../utils/cloHelpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface CLO {
  id: number;
  code: string;
  verb: string;
  text: string;
  bloom_level: string;
  course_id: number;
}

interface CLOListProps {
  courseId: number;
}

const CLOList: React.FC<CLOListProps> = ({ courseId }) => {
  const [clos, setClos] = useState<CLOWithDisplay<CLO>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; cloId: number | null }>({ isOpen: false, cloId: null });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    fetchCLOs();
  }, [courseId]);

  const fetchCLOs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clos?course_id=${courseId}`);
      const rawClos = response.data as CLO[];
      const closWithDisplay = sortClosWithDisplay<CLO>(rawClos);
      setClos(closWithDisplay);
    } catch (error) {
      console.error('Lỗi khi tải CLOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (cloId: number) => {
    setConfirmDialog({ isOpen: true, cloId });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.cloId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/clos/${confirmDialog.cloId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Refresh danh sách
      fetchCLOs();
      setConfirmDialog({ isOpen: false, cloId: null });
      setAlertDialog({ isOpen: true, title: 'Thành công', message: 'Đã xóa CLO thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Lỗi khi xóa CLO:', error);
      let errorMessage = 'Lỗi không xác định';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        errorMessage = 'Không kết nối được với server. Kiểm tra xem backend đã chạy chưa.';
      } else {
        errorMessage = error.message || 'Network Error';
      }
      
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      setConfirmDialog({ isOpen: false, cloId: null });
      setAlertDialog({ isOpen: true, title: 'Lỗi', message: 'Lỗi khi xóa CLO: ' + errorText, type: 'error' });
    }
  };

  const bloomLevelNames: Record<string, string> = {
    '1': 'Nhớ',
    '2': 'Hiểu',
    '3': 'Áp dụng',
    '4': 'Phân tích',
    '5': 'Đánh giá',
    '6': 'Sáng tạo',
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-100">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh sách CLO</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            CLO mô tả những gì sinh viên sẽ biết, hiểu, và làm được sau khi hoàn thành môn học này.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          + Tạo CLO mới
        </button>
      </div>

      {clos.length === 0 ? (
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">Chưa có CLO nào. Click "Tạo CLO mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clos.map((clo) => (
            <div
              key={clo.id}
              className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="font-bold text-lg text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                      {clo.displayCode || 'CLO'}
                    </span>
                    <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-3 py-1.5 rounded-full font-semibold border border-indigo-200">
                      Level {clo.bloom_level}: {bloomLevelNames[clo.bloom_level] || clo.bloom_level}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    <strong className="text-indigo-700">{clo.verb}</strong> được {clo.text}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteClick(clo.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 ml-4"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CLOForm
          courseId={courseId}
          onSuccess={fetchCLOs}
          onClose={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Xác nhận xóa CLO"
        message="Bạn có chắc muốn xóa CLO này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, cloId: null })}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', type: 'info' })}
      />
    </div>
  );
};

export default CLOList;

