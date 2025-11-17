import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ExportDialogProps {
  courseId: number;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ courseId, onClose }) => {
  const [formData, setFormData] = useState({
    instructor_name: '',
    instructor_email: '',
    instructor_title: '',
    department: '',
    academic_year: new Date().getFullYear().toString(),
    include_prereqs: true,
    include_rubrics: true,
  });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = new FormData();
      payload.append('instructor_name', formData.instructor_name);
      payload.append('instructor_email', formData.instructor_email);
      payload.append('instructor_title', formData.instructor_title || '');
      payload.append('department', formData.department || '');
      payload.append('academic_year', formData.academic_year || '');
      payload.append('include_prereqs', String(formData.include_prereqs));
      payload.append('include_rubrics', String(formData.include_rubrics));
      if (templateFile) {
        payload.append('template_file', templateFile);
      }

      const response = await axios.post(`${API_URL}/api/export/course/${courseId}`, payload, {
        responseType: 'blob',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      // Tạo download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `De_cuong_${courseId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Xuất file thành công!');
      onClose();
    } catch (err: any) {
      let errorMessage = 'Lỗi khi xuất file';
      if (err.response?.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Xuất đề cương học phần
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tên giảng viên *
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.instructor_name}
                onChange={(e) =>
                  setFormData({ ...formData, instructor_name: e.target.value })
                }
                placeholder="Tên giảng viên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email giảng viên *
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.instructor_email}
                onChange={(e) =>
                  setFormData({ ...formData, instructor_email: e.target.value })
                }
                placeholder="Email giảng viên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Chức danh
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.instructor_title}
                onChange={(e) =>
                  setFormData({ ...formData, instructor_title: e.target.value })
                }
                placeholder="Chức danh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bộ môn
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="Bộ môn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Năm học
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.academic_year}
                onChange={(e) =>
                  setFormData({ ...formData, academic_year: e.target.value })
                }
                placeholder="Năm học"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.include_prereqs}
                  onChange={(e) =>
                    setFormData({ ...formData, include_prereqs: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm">Bao gồm điều kiện tiên quyết</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.include_rubrics}
                  onChange={(e) =>
                    setFormData({ ...formData, include_rubrics: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm">Bao gồm rubrics</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mẫu đề cương (DOCX) - tùy chọn
              </label>
              <input
                type="file"
                accept=".docx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sử dụng các placeholder ví dụ: {'{{COURSE_NAME}}'}, {'{{COURSE_CODE}}'}, {'{{CLO_LIST}}'}, {'{{PREREQ_LIST}}'}, {'{{ASSESSMENT_LIST}}'}
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
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {exporting ? 'Đang xuất...' : 'Xuất file'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;

