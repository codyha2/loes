import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { sortClosWithDisplay, CLOWithDisplay } from '../utils/cloHelpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface QuestionFormProps {
  assessmentId: number;
  courseId: number;
  onSuccess: () => void;
  onClose: () => void;
  questionId?: number; // Cho phép edit
}

const QuestionForm: React.FC<QuestionFormProps> = ({ assessmentId, courseId, onSuccess, onClose, questionId }) => {
  const [formData, setFormData] = useState({
    text: '',
    max_score: 10,
    clo_ids: [] as number[],
  });
  const [clos, setClos] = useState<CLOWithDisplay<any>[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bloomLevelNames: Record<string, string> = {
    'Remember': 'Nhớ',
    'Understand': 'Hiểu',
    'Apply': 'Áp dụng',
    'Analyze': 'Phân tích',
    'Evaluate': 'Đánh giá',
    'Create': 'Sáng tạo',
  };

  useEffect(() => {
    fetchCLOs();
    if (questionId) {
      fetchQuestion();
    }
  }, [courseId, questionId]);

  const fetchCLOs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clos?course_id=${courseId}`);
      const closWithDisplay = sortClosWithDisplay(response.data);
      setClos(closWithDisplay);
    } catch (error) {
      console.error('Lỗi khi tải CLOs:', error);
    }
  };

  const fetchQuestion = async () => {
    if (!questionId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/questions/${questionId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setFormData({
        text: response.data.text,
        max_score: response.data.max_score,
        clo_ids: response.data.clo_ids || [],
      });
    } catch (error) {
      console.error('Lỗi khi tải câu hỏi:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Vui lòng nhập nội dung câu hỏi.';
    }

    if (formData.max_score <= 0) {
      newErrors.max_score = 'Điểm tối đa phải lớn hơn 0.';
    }

    if (formData.clo_ids.length === 0) {
      newErrors.clo_ids = 'Vui lòng liên kết ít nhất một CLO cho câu hỏi này.';
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
      
      if (questionId) {
        // Update
        await axios.put(
          `${API_URL}/api/questions/${questionId}`,
          {
            text: formData.text,
            max_score: formData.max_score,
            clo_ids: formData.clo_ids,
          },
          {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }
        );
        alert('Đã cập nhật câu hỏi thành công!');
      } else {
        // Create
        await axios.post(
          `${API_URL}/api/questions?assessment_id=${assessmentId}`,
          {
            text: formData.text,
            max_score: formData.max_score,
            clo_ids: formData.clo_ids,
          },
          {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }
        );
        alert('Đã tạo câu hỏi thành công!');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi lưu câu hỏi:', error);
      let errorMessage = 'Lỗi không xác định';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        errorMessage = 'Không kết nối được với server.';
      } else {
        errorMessage = error.message || 'Network Error';
      }
      
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      alert('Lỗi khi lưu câu hỏi: ' + errorText);
    } finally {
      setSaving(false);
    }
  };

  const getCLODisplayName = (clo: any): string => {
    const code = clo.displayCode || `CLO${clo.id}`;
    const bloomName = bloomLevelNames[clo.bloom_level] || clo.bloom_level;
    const verb = clo.verb || '';
    const text = clo.text || '';
    return `${code} – ${bloomName}: "${verb} được ${text}"`;
  };

  const getCLOTooltip = (clo: any): string => {
    const bloomName = bloomLevelNames[clo.bloom_level] || clo.bloom_level;
    return `CLO này thuộc Bloom: ${bloomName} – Dùng để đánh giá kỹ năng ${bloomName.toLowerCase()}.`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {questionId ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900">
            💡 Mỗi câu hỏi có thể liên kết với một hoặc nhiều CLO để đánh giá mức độ đạt chuẩn đầu ra.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung câu hỏi *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => {
                setFormData({ ...formData, text: e.target.value });
                setErrors({ ...errors, text: '' });
              }}
              className={`block w-full px-3 py-2 border rounded-md ${
                errors.text ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="Nhập nội dung câu hỏi..."
              required
            />
            {errors.text && <p className="text-xs text-red-600 mt-1">{errors.text}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm tối đa *
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.max_score}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, max_score: value });
                setErrors({ ...errors, max_score: '' });
              }}
              className={`block w-full px-3 py-2 border rounded-md ${
                errors.max_score ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.max_score && <p className="text-xs text-red-600 mt-1">{errors.max_score}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liên kết với CLO * (chọn ít nhất 1)
            </label>
            {clos.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  Chưa có CLO. Vui lòng tạo CLO trước khi thêm câu hỏi.
                </p>
              </div>
            ) : (
              <>
                <div className={`space-y-2 max-h-60 overflow-y-auto border rounded p-3 ${
                  errors.clo_ids ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {clos.map((clo) => (
                    <label
                      key={clo.id}
                      className="flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer"
                      title={getCLOTooltip(clo)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.clo_ids.includes(clo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, clo_ids: [...formData.clo_ids, clo.id] });
                            setErrors({ ...errors, clo_ids: '' });
                          } else {
                            setFormData({ ...formData, clo_ids: formData.clo_ids.filter(id => id !== clo.id) });
                          }
                        }}
                        className="mt-1 mr-3"
                      />
                      <span className="text-sm text-gray-800 flex-1">
                        {getCLODisplayName(clo)}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.clo_ids && <p className="text-xs text-red-600 mt-1">{errors.clo_ids}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Đã chọn: {formData.clo_ids.length} CLO. Di chuột lên CLO để xem thông tin chi tiết.
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {saving ? 'Đang lưu...' : questionId ? 'Cập nhật' : 'Tạo câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;
