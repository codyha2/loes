import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cloTemplates from '../data/clo-templates.json';
import AlertDialog from './AlertDialog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Criterion {
  name: string;
  levels: {
    '4': string;
    '3': string;
    '2': string;
    '1': string;
  };
}

interface RubricFormProps {
  courseId: number;
  cloId: number;
  cloDisplayLabel?: string;
  onSuccess: () => void;
  onClose: () => void;
}

interface CLOInfo {
  id: number;
  code?: string;
  verb: string;
  text: string;
  bloom_level: string;
}

const RubricForm: React.FC<RubricFormProps> = ({ courseId, cloId, cloDisplayLabel, onSuccess, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Record<string, Criterion>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cloInfo, setCloInfo] = useState<CLOInfo | null>(null);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    context?: 'create-success' | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    context: null,
  });

  const getRubricLevels = (bloomLevel?: string) => {
    const template =
      bloomLevel && cloTemplates.rubricTemplates[bloomLevel as keyof typeof cloTemplates.rubricTemplates];
    const rubricTemplate = (template || {}) as Record<string, string>;
    return {
      '4': rubricTemplate['Xuất sắc'] || 'Mô tả mức xuất sắc...',
      '3': rubricTemplate['Tốt'] || 'Mô tả mức tốt...',
      '2': rubricTemplate['Đạt'] || 'Mô tả mức đạt...',
      '1': rubricTemplate['Chưa đạt'] || 'Mô tả mức chưa đạt...',
    };
  };

  const buildSuggestion = (info: CLOInfo) => {
    const actionPhrase = `${info.verb ? info.verb : 'Thực hiện'} ${info.text || ''}`.trim();
    const shortLabel = cloDisplayLabel || `CLO${info.id}`;
    const cloLabel = `${shortLabel} - ${actionPhrase}`;
    const defaultKey = `criterion_${Date.now()}`;
    const criterionName = `Đánh giá năng lực ${info.verb ? info.verb.toLowerCase() : 'thực hiện'} ${info.text || ''}`.trim();
    return {
      suggestedName: `Rubric đánh giá ${shortLabel}`,
      suggestedDescription: `Đánh giá mức độ hoàn thành CLO: ${actionPhrase}`,
      suggestedCriteria: {
        [defaultKey]: {
          name: criterionName,
          levels: getRubricLevels(info.bloom_level),
        },
      } as Record<string, Criterion>,
      bloomLevel: info.bloom_level,
      cloLabel,
    };
  };

  const applySuggestion = (info?: CLOInfo) => {
    const targetInfo = info || cloInfo;
    if (!targetInfo) return;
    const { suggestedName, suggestedDescription, suggestedCriteria } = buildSuggestion(targetInfo);
    setName((prev) => prev || suggestedName);
    setDescription((prev) => prev || suggestedDescription);
    setCriteria(suggestedCriteria);
    setErrors({});
    setAutoSuggested(true);
  };

  useEffect(() => {
    const fetchCLO = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/clos/${cloId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setCloInfo(response.data);
        if (!autoSuggested && Object.keys(criteria).length === 0) {
          applySuggestion(response.data);
        } else {
          if (!name) {
            setName(`Rubric đánh giá ${response.data.code || response.data.verb || 'CLO'}`);
          }
          if (!description) {
            setDescription(`Đánh giá mức độ hoàn thành CLO: ${response.data.verb} ${response.data.text}`);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin CLO:', error);
      }
    };

    fetchCLO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloId]);

  const addCriterion = () => {
    const newKey = `criterion_${Date.now()}`;
    setCriteria({
      ...criteria,
      [newKey]: {
        name: '',
        levels: {
          '4': '',
          '3': '',
          '2': '',
          '1': '',
        },
      },
    });
  };

  const removeCriterion = (key: string) => {
    const newCriteria = { ...criteria };
    delete newCriteria[key];
    setCriteria(newCriteria);
  };

  const updateCriterion = (key: string, field: 'name' | '4' | '3' | '2' | '1', value: string) => {
    setCriteria({
      ...criteria,
      [key]: {
        ...criteria[key],
        ...(field === 'name'
          ? { name: value }
          : {
              levels: {
                ...criteria[key].levels,
                [field]: value,
              },
            }),
      },
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên rubric.';
    }

    if (Object.keys(criteria).length === 0) {
      newErrors.criteria = 'Vui lòng thêm ít nhất một tiêu chí.';
    }

    // Kiểm tra từng tiêu chí
    Object.entries(criteria).forEach(([key, criterion]) => {
      if (!criterion.name.trim()) {
        newErrors[`${key}_name`] = 'Vui lòng nhập tên tiêu chí.';
      }
      if (!criterion.levels['4'].trim()) {
        newErrors[`${key}_4`] = 'Vui lòng nhập mô tả mức Xuất sắc.';
      }
      if (!criterion.levels['3'].trim()) {
        newErrors[`${key}_3`] = 'Vui lòng nhập mô tả mức Tốt.';
      }
      if (!criterion.levels['2'].trim()) {
        newErrors[`${key}_2`] = 'Vui lòng nhập mô tả mức Đạt.';
      }
      if (!criterion.levels['1'].trim()) {
        newErrors[`${key}_1`] = 'Vui lòng nhập mô tả mức Chưa đạt.';
      }
    });

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
      await axios.post(
        `${API_URL}/api/rubrics`,
        {
          name,
          description: description || null,
          criteria,
          course_id: courseId,
          clo_id: cloId,
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      setAlertDialog({
        isOpen: true,
        title: 'Tạo rubric thành công',
        message: 'Rubric đã được lưu và gắn vào CLO.',
        type: 'success',
        context: 'create-success',
      });
    } catch (error: any) {
      console.error('Lỗi khi tạo rubric:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      setAlertDialog({
        isOpen: true,
        title: 'Tạo rubric thất bại',
        message: errorText,
        type: 'error',
        context: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAlertClose = () => {
    const context = alertDialog.context;
    setAlertDialog((prev) => ({ ...prev, isOpen: false, context: null }));
    if (context === 'create-success') {
      onSuccess();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tạo Rubric mới</h3>

        {cloInfo && (
          <div className="mb-5 p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-sm text-indigo-900">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Rubric sẽ gắn với CLO: {cloDisplayLabel || cloInfo.code || `CLO${cloInfo.id}`} –{' '}
                  <span className="italic">{cloInfo.verb} {cloInfo.text}</span>
                </p>
                <p className="text-xs text-indigo-700">
                  Bloom level: <strong>{cloInfo.bloom_level}</strong>. Hệ thống đã chuẩn bị sẵn mô tả tiêu chí cho từng mức độ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => applySuggestion()}
                className="self-start md:self-end px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Áp dụng gợi ý rubric từ CLO
              </button>
            </div>
            {cloInfo.bloom_level && cloTemplates.rubricTemplates[cloInfo.bloom_level as keyof typeof cloTemplates.rubricTemplates] && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {Object.entries(
                  cloTemplates.rubricTemplates[cloInfo.bloom_level as keyof typeof cloTemplates.rubricTemplates]
                ).map(([level, content]) => (
                  <div key={level} className="bg-white rounded-md p-2 border border-indigo-100">
                    <p className="font-semibold text-indigo-800">{level}</p>
                    <p className="text-indigo-700 mt-1">{content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Rubric *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: '' });
              }}
              className={`block w-full px-3 py-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: Rubric đánh giá CLO1"
              required
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Mô tả về rubric này..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tiêu chí đánh giá *
              </label>
              <button
                type="button"
                onClick={addCriterion}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Thêm tiêu chí
              </button>
            </div>
            {errors.criteria && (
              <p className="text-xs text-red-600 mb-2">{errors.criteria}</p>
            )}

            {Object.keys(criteria).length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded">
                Chưa có tiêu chí nào. Click "Thêm tiêu chí" để bắt đầu.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(criteria).map(([key, criterion]) => (
                  <div key={key} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên tiêu chí *
                        </label>
                        <input
                          type="text"
                          value={criterion.name}
                          onChange={(e) => {
                            updateCriterion(key, 'name', e.target.value);
                            setErrors({ ...errors, [`${key}_name`]: '' });
                          }}
                          className={`block w-full px-3 py-2 border rounded-md ${
                            errors[`${key}_name`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Ví dụ: Hiểu biết về khái niệm"
                          required
                        />
                        {errors[`${key}_name`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`${key}_name`]}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCriterion(key)}
                        className="ml-3 text-red-600 hover:text-red-800 text-sm"
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Xuất sắc (4) *
                        </label>
                        <textarea
                          value={criterion.levels['4']}
                          onChange={(e) => {
                            updateCriterion(key, '4', e.target.value);
                            setErrors({ ...errors, [`${key}_4`]: '' });
                          }}
                          className={`block w-full px-3 py-2 border rounded-md text-xs ${
                            errors[`${key}_4`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          rows={3}
                          placeholder="Mô tả mức xuất sắc..."
                          required
                        />
                        {errors[`${key}_4`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`${key}_4`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tốt (3) *
                        </label>
                        <textarea
                          value={criterion.levels['3']}
                          onChange={(e) => {
                            updateCriterion(key, '3', e.target.value);
                            setErrors({ ...errors, [`${key}_3`]: '' });
                          }}
                          className={`block w-full px-3 py-2 border rounded-md text-xs ${
                            errors[`${key}_3`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          rows={3}
                          placeholder="Mô tả mức tốt..."
                          required
                        />
                        {errors[`${key}_3`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`${key}_3`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đạt (2) *
                        </label>
                        <textarea
                          value={criterion.levels['2']}
                          onChange={(e) => {
                            updateCriterion(key, '2', e.target.value);
                            setErrors({ ...errors, [`${key}_2`]: '' });
                          }}
                          className={`block w-full px-3 py-2 border rounded-md text-xs ${
                            errors[`${key}_2`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          rows={3}
                          placeholder="Mô tả mức đạt..."
                          required
                        />
                        {errors[`${key}_2`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`${key}_2`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chưa đạt (1) *
                        </label>
                        <textarea
                          value={criterion.levels['1']}
                          onChange={(e) => {
                            updateCriterion(key, '1', e.target.value);
                            setErrors({ ...errors, [`${key}_1`]: '' });
                          }}
                          className={`block w-full px-3 py-2 border rounded-md text-xs ${
                            errors[`${key}_1`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          rows={3}
                          placeholder="Mô tả mức chưa đạt..."
                          required
                        />
                        {errors[`${key}_1`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`${key}_1`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              {saving ? 'Đang tạo...' : 'Tạo Rubric'}
            </button>
          </div>
        </form>
      </div>
    </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={handleAlertClose}
      />
    </>
  );
};

export default RubricForm;


