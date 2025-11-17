import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReferenceForm from './ReferenceForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Reference {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  isbn: string | null;
  reference_type: string;
  url: string | null;
}

interface ReferenceManagerProps {
  courseId: number;
}

const ReferenceManager: React.FC<ReferenceManagerProps> = ({ courseId }) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReferences();
  }, [courseId]);

  const fetchReferences = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/references?course_id=${courseId}`);
      setReferences(response.data);
    } catch (error) {
      console.error('Lỗi khi tải tài liệu tham khảo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (referenceId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu tham khảo này?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/references/${referenceId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      fetchReferences();
      alert('Đã xóa tài liệu tham khảo thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xóa tài liệu tham khảo:', error);
      alert('Lỗi khi xóa: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Tài liệu tham khảo</h2>
          <p className="text-sm text-gray-600">
            Quản lý sách giáo trình, tài liệu tham khảo cho môn học.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Thêm tài liệu
        </button>
      </div>

      {references.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
          Chưa có tài liệu tham khảo. Click "Thêm tài liệu" để bắt đầu.
        </div>
      ) : (
        <div className="space-y-3">
          {references.map((ref) => (
            <div key={ref.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{ref.title}</h3>
                  {ref.author && (
                    <p className="text-sm text-gray-600">Tác giả: {ref.author}</p>
                  )}
                  {ref.publisher && (
                    <p className="text-sm text-gray-600">Nhà xuất bản: {ref.publisher}</p>
                  )}
                  {ref.year && (
                    <p className="text-sm text-gray-600">Năm: {ref.year}</p>
                  )}
                  {ref.isbn && (
                    <p className="text-sm text-gray-500">ISBN: {ref.isbn}</p>
                  )}
                  {ref.url && (
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(ref.id)}
                  className="text-red-600 hover:text-red-800 text-sm ml-4"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ReferenceForm
          courseId={courseId}
          onSuccess={fetchReferences}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ReferenceManager;


