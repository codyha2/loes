import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface StudentFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    student_number: '',
    cohort: new Date().getFullYear().toString(),
    email: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/students`,
        formData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      alert('Đã thêm sinh viên thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi thêm sinh viên:', error);
      alert('Lỗi khi thêm sinh viên: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm sinh viên mới</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã sinh viên *
            </label>
            <input
              type="text"
              value={formData.student_number}
              onChange={(e) => setFormData({ ...formData, student_number: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khóa học (Cohort) *
            </label>
            <input
              type="text"
              value={formData.cohort}
              onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ví dụ: 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Đang thêm...' : 'Thêm sinh viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;


