import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ProgramFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    expected_threshold: 0.7, // Giữ lại để gửi lên backend, nhưng không hiển thị
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/programs`,
        {
          code: formData.code.toUpperCase(),
          name: formData.name,
          expected_threshold: formData.expected_threshold,
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      alert('Đã tạo chương trình đào tạo thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi tạo chương trình:', error);
      let errorMessage = 'Lỗi không xác định';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        errorMessage = 'Không kết nối được với server. Kiểm tra xem backend đã chạy chưa.';
      } else {
        errorMessage = error.message || 'Network Error';
      }
      
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      alert('Lỗi khi tạo chương trình: ' + errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo chương trình đào tạo mới</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã chương trình (Code) *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ví dụ: TOURISM, HOTEL, RESTAURANT"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mã chương trình thường là viết tắt, ví dụ: TOURISM, HOTEL, GUIDE
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên chương trình (Name) *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ví dụ: Quản trị Du lịch, Quản trị Khách sạn"
              required
            />
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Đang tạo...' : 'Tạo chương trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramForm;

