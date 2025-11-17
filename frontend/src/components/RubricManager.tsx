import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RubricForm from './RubricForm';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import { sortClosWithDisplay, CLOWithDisplay } from '../utils/cloHelpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Criterion {
  name: string;
  levels: {
    '4': string; // Xuất sắc
    '3': string; // Tốt
    '2': string; // Đạt
    '1': string; // Chưa đạt
  };
}

interface Rubric {
  id: number;
  name: string;
  description: string | null;
  criteria: Record<string, Criterion>;
  course_id: number | null;
  clo_id: number | null;
}

interface CLO {
  id: number;
  code: string;
  verb: string;
  text: string;
  bloom_level: string;
}

interface RubricManagerProps {
  courseId: number;
}

const RubricManager: React.FC<RubricManagerProps> = ({ courseId }) => {
  const [clos, setClos] = useState<CLOWithDisplay<CLO>[]>([]);
  const [rubrics, setRubrics] = useState<Record<number, Rubric>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<number | null>(null); // clo_id
  const [selectedCloLabel, setSelectedCloLabel] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; rubricId: number | null; cloId: number | null }>({
    isOpen: false,
    rubricId: null,
    cloId: null,
  });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [closRes, rubricsRes] = await Promise.all([
        axios.get(`${API_URL}/api/clos?course_id=${courseId}`),
        axios.get(`${API_URL}/api/rubrics?course_id=${courseId}`),
      ]);
      
      const rawClos = closRes.data as CLO[];
      setClos(sortClosWithDisplay<CLO>(rawClos));
      
      // Chuyển rubrics thành map theo clo_id
      const rubricMap: Record<number, Rubric> = {};
      rubricsRes.data.forEach((rubric: Rubric) => {
        if (rubric.clo_id) {
          rubricMap[rubric.clo_id] = rubric;
        }
      });
      setRubrics(rubricMap);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRubric = async () => {
    if (!confirmDialog.rubricId || !confirmDialog.cloId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/rubrics/${confirmDialog.rubricId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const newRubrics = { ...rubrics };
      delete newRubrics[confirmDialog.cloId];
      setRubrics(newRubrics);
      setAlertDialog({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã xóa rubric thành công!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Lỗi khi xóa rubric:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Lỗi khi xóa rubric: ' + (error.response?.data?.detail || error.message),
        type: 'error'
      });
    } finally {
      setConfirmDialog({ isOpen: false, rubricId: null, cloId: null });
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Rubric theo CLO</h2>
        <p className="text-sm text-gray-600 mb-4">
          Mỗi CLO có thể gán 01 rubric. Rubric gồm nhiều tiêu chí, mỗi tiêu chí có 4 mức đánh giá: 
          <strong> Xuất sắc (4), Tốt (3), Đạt (2), Chưa đạt (1)</strong>
        </p>
      </div>

      {clos.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
          Chưa có CLO. Tạo CLO trước khi tạo rubric.
        </div>
      ) : (
        <div className="space-y-6">
          {clos.map((clo) => {
            const rubric = rubrics[clo.id];
            return (
              <div key={clo.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {clo.displayCode || 'CLO'}: {clo.verb} {clo.text}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Bloom Level: {clo.bloom_level}
                    </p>
                  </div>
                  {!rubric && (
                    <button
                      onClick={() => {
                        setShowForm(clo.id);
                        setSelectedCloLabel(clo.displayCode || 'CLO');
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                    >
                      + Tạo Rubric
                    </button>
                  )}
                </div>

                {rubric ? (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Rubric: {rubric.name}</h4>
                      <button
                        onClick={() =>
                          setConfirmDialog({ isOpen: true, rubricId: rubric.id, cloId: clo.id })
                        }
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        🗑️ Xóa Rubric
                      </button>
                    </div>
                    
                    {rubric.description && (
                      <p className="text-sm text-gray-600 mb-3">{rubric.description}</p>
                    )}

                    {/* Hiển thị rubric dạng bảng */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Tiêu chí</th>
                            <th className="border border-gray-300 p-2 text-center">Xuất sắc (4)</th>
                            <th className="border border-gray-300 p-2 text-center">Tốt (3)</th>
                            <th className="border border-gray-300 p-2 text-center">Đạt (2)</th>
                            <th className="border border-gray-300 p-2 text-center">Chưa đạt (1)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(rubric.criteria || {}).map(([key, criterion]) => (
                            <tr key={key}>
                              <td className="border border-gray-300 p-2 font-medium">
                                {criterion.name}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs">
                                {criterion.levels['4'] || '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs">
                                {criterion.levels['3'] || '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs">
                                {criterion.levels['2'] || '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-xs">
                                {criterion.levels['1'] || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {Object.keys(rubric.criteria || {}).length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">Rubric này chưa có tiêu chí nào.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
                    Chưa có rubric cho CLO này. Click "Tạo Rubric" để bắt đầu.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RubricForm
          courseId={courseId}
          cloId={showForm}
          cloDisplayLabel={selectedCloLabel}
          onSuccess={() => {
            setShowForm(null);
            fetchData();
          }}
          onClose={() => setShowForm(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Xóa rubric?"
        message="Bạn có chắc chắn muốn xóa rubric này? Thao tác không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleDeleteRubric}
        onCancel={() => setConfirmDialog({ isOpen: false, rubricId: null, cloId: null })}
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

export default RubricManager;
