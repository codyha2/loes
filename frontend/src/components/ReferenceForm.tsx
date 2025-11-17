import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ReferenceFormProps {
  courseId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({ courseId, onSuccess, onClose }) => {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung tài liệu tham khảo');
      return;
    }
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      // Parse content: mỗi dòng là một tài liệu
      const lines = content.split('\n').filter(line => line.trim());
      
      // Tạo nhiều references từ các dòng
      const promises = lines.map(line => {
        // Đơn giản: lưu toàn bộ dòng vào title
        return axios.post(
          `${API_URL}/api/references`,
          {
            course_id: courseId,
            title: line.trim(),
            author: null,
            publisher: null,
            year: null,
            isbn: null,
            reference_type: 'other',
            url: null,
          },
          {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }
        );
      });

      await Promise.all(promises);
      alert(`Đã thêm ${lines.length} tài liệu tham khảo thành công!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi thêm tài liệu tham khảo:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      alert('Lỗi khi thêm tài liệu tham khảo: ' + errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm tài liệu tham khảo</h3>
        <p className="text-xs text-gray-500 mb-4">
          💡 Copy và dán danh sách tài liệu tham khảo vào đây. Mỗi dòng là một tài liệu.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh sách tài liệu tham khảo *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md h-64"
              placeholder="Ví dụ:&#10;Nguyễn Văn A (2020). Marketing Du lịch. NXB Giáo dục.&#10;Trần Thị B (2021). Quản trị Khách sạn. NXB Kinh tế.&#10;https://example.com/tai-lieu"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mỗi dòng là một tài liệu. Bạn có thể copy từ Word, Excel hoặc nhập trực tiếp.
            </p>
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
              {saving ? 'Đang thêm...' : 'Thêm tài liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReferenceForm;

