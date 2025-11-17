import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProgramForm from './ProgramForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface CourseFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSuccess, onClose }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    credits: 3,
    description: '',
    version_year: new Date().getFullYear(),
    program_id: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      // Dùng endpoint public không cần auth
      const response = await axios.get(`${API_URL}/api/programs/public`);
      setPrograms(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, program_id: response.data[0].id }));
      } else {
        console.warn('Chưa có chương trình đào tạo nào');
      }
    } catch (error: any) {
      console.error('Lỗi khi tải chương trình:', error);
      let errorMessage = 'Lỗi không xác định';
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        errorMessage = 'Không kết nối được với server. Kiểm tra xem backend đã chạy chưa.';
      } else {
        errorMessage = error.message || 'Network Error';
      }
      alert('Lỗi khi tải danh sách chương trình: ' + errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/courses?program_id=${formData.program_id}`,
        {
          code: formData.code,
          title: formData.title,
          credits: formData.credits,
          description: formData.description || null,
          version_year: formData.version_year,
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      alert('Đã tạo môn học thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi tạo môn học:', error);
      let errorMessage = 'Lỗi không xác định';
      
      if (error.response) {
        // Server trả về lỗi
        errorMessage = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        errorMessage = 'Không kết nối được với server. Kiểm tra xem backend đã chạy chưa.';
      } else {
        // Lỗi khác
        errorMessage = error.message || 'Network Error';
      }
      
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      alert('Lỗi khi tạo môn học: ' + errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo môn học mới</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chương trình đào tạo *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              💡 <strong>Chương trình đào tạo</strong> là cấp độ chương trình (ví dụ: Cử nhân Quản trị Du lịch, Cử nhân Kế toán). 
              Mỗi môn học thuộc về một chương trình. PLO thuộc về chương trình, CLO thuộc về môn học.
            </p>
            <div className="flex gap-2">
              <select
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: parseInt(e.target.value) })}
                className="flex-1 block px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="0">-- Chọn chương trình --</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.code} - {program.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowProgramForm(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                title="Tạo chương trình đào tạo mới"
              >
                + Thêm
              </button>
            </div>
            {programs.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Chưa có chương trình đào tạo. Vui lòng tạo chương trình trước.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã học phần (Course Code) *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ví dụ: DMKT201, QTDL101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên học phần (Course Title) *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ví dụ: Marketing Du lịch, Quản trị Du lịch"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tín chỉ *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Năm học *
              </label>
              <input
                type="number"
                value={formData.version_year}
                onChange={(e) => setFormData({ ...formData, version_year: parseInt(e.target.value) })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Mô tả về môn học..."
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
              disabled={saving || formData.program_id === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Đang tạo...' : 'Tạo môn học'}
            </button>
          </div>
        </form>

        {showProgramForm && (
          <ProgramForm
            onSuccess={() => {
              fetchPrograms();
              setShowProgramForm(false);
            }}
            onClose={() => setShowProgramForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CourseForm;

