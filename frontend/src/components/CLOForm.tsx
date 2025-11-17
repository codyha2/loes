import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cloTemplates from '../data/clo-templates.json';
import AlertDialog from './AlertDialog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface CLOFormProps {
  courseId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const CLOForm: React.FC<CLOFormProps> = ({ courseId, onSuccess, onClose }) => {
  const bloomLevelMap: { [key: string]: string } = {
    '1': 'Remember',
    '2': 'Understand',
    '3': 'Apply',
    '4': 'Analyze',
    '5': 'Evaluate',
    '6': 'Create',
  };

  const [formData, setFormData] = useState({
    verb: '',
    text: '',
    bloom_level: '1' as '1' | '2' | '3' | '4' | '5' | '6',
  });
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [assessmentSuggestions, setAssessmentSuggestions] = useState<any>(null);
  const [rubricSuggestions, setRubricSuggestions] = useState<any>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Lấy thông tin course để xác định chủ đề
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/courses/${courseId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        setCourseInfo(response.data);
      } catch (error) {
        console.error('Lỗi khi tải thông tin môn học:', error);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Xác định chủ đề từ course title
  const getCourseTopic = (): string => {
    if (!courseInfo?.title) return 'Tourism';
    const title = courseInfo.title.toLowerCase();
    if (title.includes('marketing')) return 'Marketing';
    if (title.includes('hướng dẫn') || title.includes('guide')) return 'Hướng dẫn';
    if (title.includes('du lịch') || title.includes('tourism') || title.includes('travel')) return 'Tourism';
    return 'Tourism'; // Mặc định
  };

  // Lấy danh sách Verbs theo Bloom Level từ JSON
  const getVerbsForBloom = (bloomLevel: string): string[] => {
    const levelName = bloomLevelMap[bloomLevel];
    return cloTemplates.bloomVerbs[levelName as keyof typeof cloTemplates.bloomVerbs] || [];
  };

  // Lấy template theo Verb và Bloom
  const getTemplate = (verb: string, bloomLevel: string): string => {
    const levelName = bloomLevelMap[bloomLevel];
    const templates = cloTemplates.templates[levelName as keyof typeof cloTemplates.templates];
    return templates?.[verb as keyof typeof templates] || `${verb} được [mô tả]`;
  };

  // Lấy CLO mẫu theo chủ đề, Bloom, Verb
  const getSampleCLOs = (topic: string, bloomLevel: string, verb: string): string[] => {
    const levelName = bloomLevelMap[bloomLevel];
    const topicData = cloTemplates.sampleCLOs[topic as keyof typeof cloTemplates.sampleCLOs];
    if (!topicData) return [];
    const bloomData = topicData[levelName as keyof typeof topicData];
    if (!bloomData) return [];
    return bloomData[verb as keyof typeof bloomData] || [];
  };

  // Lấy gợi ý Assessment và Rubric
  const getAssessmentAndRubric = (bloomLevel: string) => {
    const levelName = bloomLevelMap[bloomLevel];
    const assessment = cloTemplates.assessmentSuggestions[levelName as keyof typeof cloTemplates.assessmentSuggestions];
    const rubric = cloTemplates.rubricTemplates[levelName as keyof typeof cloTemplates.rubricTemplates];
    return { assessment, rubric };
  };

  // Xử lý chọn CLO gợi ý
  const handleSelectSuggestion = (suggestion: string) => {
    setFormData({ ...formData, text: suggestion });
    setSelectedSuggestion(suggestion);
    const { assessment, rubric } = getAssessmentAndRubric(formData.bloom_level);
    setAssessmentSuggestions(assessment);
    setRubricSuggestions(rubric);
    setShowSuggestions(false);
  };

  // Preview CLO hoàn chỉnh
  const getCLOPreview = (): string => {
    if (!formData.verb || !formData.text) return '';
    return `${formData.verb} được ${formData.text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.verb || !formData.text) {
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Vui lòng điền đầy đủ thông tin (Verb và Mô tả)',
        type: 'error'
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      // Thêm timeout 30 giây
      const response = await axios.post(
        `${API_URL}/api/clos?course_id=${courseId}`,
        {
          code: `CLO${Date.now()}`,
          verb: formData.verb,
          text: formData.text,
          bloom_level: bloomLevelMap[formData.bloom_level],
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          timeout: 30000 // 30 giây
        }
      );
      
      setAlertDialog({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã tạo CLO thành công!',
        type: 'success'
      });
      
      // Đợi một chút để user thấy thông báo thành công
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
      
    } catch (error: any) {
      console.error('Lỗi khi tạo CLO:', error);
      
      let errorMessage = 'Lỗi không xác định';
      
      if (error.response) {
        // Server trả về lỗi
        const detail = error.response.data?.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ');
        } else if (detail) {
          errorMessage = JSON.stringify(detail);
        } else {
          errorMessage = error.response.data?.message || `HTTP ${error.response.status}`;
        }
      } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        errorMessage = 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối hoặc thử lại sau.';
      } else {
        // Lỗi khi setup request
        errorMessage = error.message || 'Lỗi khi gửi yêu cầu';
      }
      
      setAlertDialog({
        isOpen: true,
        title: 'Lỗi',
        message: `Lỗi khi tạo CLO: ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const currentVerbs = getVerbsForBloom(formData.bloom_level);
  const currentTemplate = formData.verb ? getTemplate(formData.verb, formData.bloom_level) : '';
  const courseTopic = getCourseTopic();
  const sampleCLOs = formData.verb ? getSampleCLOs(courseTopic, formData.bloom_level, formData.verb) : [];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tạo CLO mới</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bước 1: Chọn Bloom Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bước 1: Chọn cấp độ nhận thức (Bloom Level) *
            </label>
            <select
              value={formData.bloom_level}
              onChange={(e) => {
                const level = e.target.value as '1' | '2' | '3' | '4' | '5' | '6';
                setFormData({ ...formData, bloom_level: level, verb: '', text: '' });
                setSelectedSuggestion(null);
                setAssessmentSuggestions(null);
                setRubricSuggestions(null);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-base"
              required
            >
              <option value="1">1. Nhớ (Remember) - Nhớ và nhận biết thông tin</option>
              <option value="2">2. Hiểu (Understand) - Hiểu và giải thích khái niệm</option>
              <option value="3">3. Áp dụng (Apply) - Sử dụng kiến thức vào thực tế</option>
              <option value="4">4. Phân tích (Analyze) - Phân tích và đánh giá vấn đề</option>
              <option value="5">5. Đánh giá (Evaluate) - Đánh giá và phán đoán</option>
              <option value="6">6. Sáng tạo (Create) - Tạo ra giải pháp mới</option>
            </select>
          </div>

          {/* Bước 2: Chọn Verb */}
          {formData.bloom_level && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bước 2: Chọn hành động (Verb) *
              </label>
              <select
                value={formData.verb}
                onChange={(e) => {
                  setFormData({ ...formData, verb: e.target.value, text: '' });
                  setSelectedSuggestion(null);
                  setAssessmentSuggestions(null);
                  setRubricSuggestions(null);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                required
              >
                <option value="">-- Chọn hành động --</option>
                {currentVerbs.map((verb) => (
                  <option key={verb} value={verb}>
                    {verb}
                  </option>
                ))}
              </select>
              
              {/* Hiển thị template sau khi chọn Verb */}
              {formData.verb && currentTemplate && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-900 font-medium mb-1">📝 Mẫu câu:</p>
                  <p className="text-sm text-blue-800">{currentTemplate}</p>
                  <p className="text-xs text-blue-600 mt-1">Thay [mô tả] bằng nội dung cụ thể của bạn</p>
                </div>
              )}
            </div>
          )}

          {/* Bước 3: Nhập mô tả */}
          {formData.verb && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bước 3: Nhập mô tả cụ thể *
              </label>
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Ví dụ: phân khúc thị trường du lịch"
                required
              />
              
              {/* Preview CLO hoàn chỉnh */}
              {formData.text && (
                <div className="mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <p className="text-xs text-green-900 font-medium mb-2">✅ Xem trước CLO:</p>
                  <p className="text-lg font-semibold text-green-800">{getCLOPreview()}</p>
                </div>
              )}
            </div>
          )}

          {/* Nút Gợi ý CLO */}
          {formData.verb && sampleCLOs.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
              >
                {showSuggestions ? 'Ẩn gợi ý' : '💡 Xem gợi ý CLO mẫu'}
              </button>
              
              {showSuggestions && (
                <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    Gợi ý CLO cho chủ đề "{courseTopic}" - Bloom "{bloomLevelMap[formData.bloom_level]}" - Verb "{formData.verb}":
                  </p>
                  <div className="space-y-2">
                    {sampleCLOs.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full text-left p-3 rounded border-2 transition-all ${
                          selectedSuggestion === suggestion
                            ? 'bg-purple-200 border-purple-400'
                            : 'bg-white border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {formData.verb} được {suggestion}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hiển thị gợi ý Assessment và Rubric sau khi chọn CLO gợi ý */}
          {selectedSuggestion && assessmentSuggestions && rubricSuggestions && (
            <div className="mt-4 space-y-4">
              {/* Gợi ý Assessment */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">📋 Gợi ý hình thức đánh giá:</p>
                <p className="text-xs text-yellow-800 mb-2">{assessmentSuggestions.description}</p>
                <div className="flex flex-wrap gap-2">
                  {assessmentSuggestions.types.map((type: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gợi ý Rubric */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-2">📊 Rubric mẫu:</p>
                <div className="space-y-2">
                  {Object.entries(rubricSuggestions).map(([level, description]) => (
                    <div key={level} className="text-xs">
                      <span className="font-medium text-indigo-800">{level}:</span>
                      <span className="text-indigo-700 ml-2">{description as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nút hành động */}
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
              disabled={saving || !formData.verb || !formData.text}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Đang tạo...' : 'Tạo CLO'}
            </button>
          </div>
        </form>
      </div>

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

export default CLOForm;
