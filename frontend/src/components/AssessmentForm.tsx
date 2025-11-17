import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface AssessmentFormProps {
  courseId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ courseId, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Thi',
    weight: 30,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const assessmentTypes = ['Thi', 'Kiểm tra', 'Bài tập lớn', 'Thuyết trình', 'Dự án', 'Thực hành'];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên Đánh giá.';
    }

    if (formData.weight < 0 || formData.weight > 100) {
      newErrors.weight = 'Trọng số phải từ 0 đến 100.';
    }

    if (formData.weight <= 0) {
      newErrors.weight = 'Trọng số phải lớn hơn 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');

      const generateCodeFromName = (name: string) => {
        const base = name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();
        const trimmed = base.slice(0, 6) || 'ASM';
        const randomSuffix = Math.floor(Math.random() * 900 + 100); // 3 digits
        return `${trimmed}-${randomSuffix}`;
      };

      const code = generateCodeFromName(formData.name);
      const normalizedWeight = formData.weight / 100;

      await axios.post(
        `${API_URL}/api/assessments?course_id=${courseId}`,
        {
          code,
          title: formData.name.trim(),
          weight: normalizedWeight,
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      alert('Đã tạo Đánh giá thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi tạo Đánh giá:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      alert('Lỗi khi tạo Đánh giá: ' + errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tạo Đánh giá mới</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Đánh giá *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              className={`block w-full px-3 py-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: Kiểm tra giữa kỳ, Bài tập lớn, Thi cuối kỳ"
              required
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              {assessmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trọng số (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.weight}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, weight: value });
                setErrors({ ...errors, weight: '' });
              }}
              className={`block w-full px-3 py-2 border rounded-md ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Nhập số từ 0 đến 100</p>
            {errors.weight && <p className="text-xs text-red-600 mt-1">{errors.weight}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Mô tả về đánh giá này..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Đang tạo...' : 'Tạo Đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentForm;
