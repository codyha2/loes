import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseForm from './CourseForm';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Course {
  id: number;
  code: string;
  title: string;
}

interface Prerequisite {
  id: number;
  prereq_course_id: number;
  type: 'strict' | 'coreq' | 'recommended';
  condition_type: string;
  condition_payload: any;
}

interface PrereqCourse {
  id: number;
  code: string;
  title: string;
}

interface Suggestion {
  course_id: number;
  code: string;
  title: string;
  confidence: number;
  match_reasons: string[];
}

interface MissingCourseDetail {
  course_name: string;
  status: string;
}

interface ImpactAnalysis {
  total_students: number;
  missing_count: number;
  missing_students: Array<{
    id: number;
    name: string;
    student_number: string;
    reason: string;
    missing_courses?: string[];
    missing_course_details?: MissingCourseDetail[];
  }>;
  risk_score: number;
}

interface CoursePrereqManagerProps {
  courseId: number;
}

const CoursePrereqManager: React.FC<CoursePrereqManagerProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [prereqCourses, setPrereqCourses] = useState<Record<number, PrereqCourse>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; type: 'prereq' | 'student' | 'course' | null; id: number | null; name?: string }>({ isOpen: false, type: null, id: null });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    setSuggestions([]);
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, prereqRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${courseId}`),
        axios.get(`${API_URL}/api/courses/${courseId}/prerequisites`),
      ]);
      setCourse(courseRes.data);
      setPrerequisites(prereqRes.data);
      
      // Lấy thông tin các môn học tiên quyết
      const courseMap: Record<number, PrereqCourse> = {};
      for (const prereq of prereqRes.data) {
        try {
          const courseRes = await axios.get(`${API_URL}/api/courses/${prereq.prereq_course_id}`);
          courseMap[prereq.prereq_course_id] = courseRes.data;
        } catch (error) {
          console.error(`Lỗi khi tải thông tin môn học ${prereq.prereq_course_id}:`, error);
        }
      }
      setPrereqCourses(courseMap);
      
      fetchImpact();
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImpact = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/courses/${courseId}/prerequisites/impact`
      );
      setImpact(response.data);
    } catch (error) {
      console.error('Lỗi khi tải phân tích tác động:', error);
    }
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      // Lấy CLOs của course hiện tại
      const closRes = await axios.get(`${API_URL}/api/clos?course_id=${courseId}`);
      const clos = closRes.data.map((clo: any) => ({
        verb: clo.verb,
        text: clo.text,
        bloom_level: clo.bloom_level,
      }));

      const response = await axios.post(
        `${API_URL}/api/courses/${courseId}/prerequisites/suggest`,
        { clos, domain: 'Tourism' }
      );
      setSuggestions(response.data);
    } catch (error) {
      console.error('Lỗi khi gợi ý:', error);
      alert('Lỗi khi gợi ý môn học tiên quyết');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAddPrereq = async (prereqCourseId: number, type: 'strict' | 'coreq' | 'recommended') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/courses/${courseId}/prerequisites`,
        {
          prereq_course_id: prereqCourseId,
          type: type,
          condition_type: 'pass_course',
          condition_payload: {},
        },
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      fetchData();
      setSuggestions((prev) => prev.filter((item) => item.course_id !== prereqCourseId));
      alert('Đã thêm môn học tiên quyết thành công!');
    } catch (error: any) {
      console.error('Lỗi khi thêm môn học tiên quyết:', error);
      alert('Lỗi khi thêm môn học tiên quyết: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeletePrereqClick = (prereqId: number) => {
    const prereq = prerequisites.find(p => p.id === prereqId);
    const courseName = prereq ? (prereqCourses[prereq.prereq_course_id]?.title || `Môn học ID: ${prereq.prereq_course_id}`) : '';
    setConfirmDialog({ isOpen: true, type: 'prereq', id: prereqId, name: courseName });
  };

  const handleDeletePrereqConfirm = async () => {
    if (!confirmDialog.id || confirmDialog.type !== 'prereq') return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/courses/${courseId}/prerequisites/${confirmDialog.id}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      fetchData();
      setConfirmDialog({ isOpen: false, type: null, id: null });
      setAlertDialog({ isOpen: true, title: 'Thành công', message: 'Đã xóa điều kiện tiên quyết thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Lỗi khi xóa điều kiện tiên quyết:', error);
      setConfirmDialog({ isOpen: false, type: null, id: null });
      setAlertDialog({ isOpen: true, title: 'Lỗi', message: 'Lỗi khi xóa điều kiện tiên quyết: ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  // Tính toán risk score và màu sắc
  const getRiskScoreColor = (riskScore: number): string => {
    const percentage = riskScore * 100;
    if (percentage <= 20) return 'text-green-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskScoreBgColor = (riskScore: number): string => {
    const percentage = riskScore * 100;
    if (percentage <= 20) return 'bg-green-600';
    if (percentage <= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getRiskDescription = (riskScore: number): string => {
    const percentage = riskScore * 100;
    if (percentage <= 20) return 'Rủi ro thấp, lớp ổn định.';
    if (percentage <= 50) return 'Rủi ro trung bình, cần theo sát nhóm sinh viên yếu.';
    return 'Rủi ro cao, giảng viên nên điều chỉnh nội dung hoặc hỗ trợ bổ sung.';
  };

  const getRecommendation = (riskScore: number): string => {
    const percentage = riskScore * 100;
    if (percentage > 50) {
      return 'Lớp có nguy cơ cao. Giảng viên nên cung cấp học liệu nền tảng hoặc phụ đạo cho sinh viên thiếu kiến thức.';
    }
    if (percentage >= 20) {
      return 'Một số sinh viên có thể gặp khó khăn. Khuyến nghị theo dõi sát nhóm sinh viên chưa đạt môn tiên quyết.';
    }
    return 'Hầu hết sinh viên đã sẵn sàng cho môn học này.';
  };

  const handleDeleteStudentClick = (studentId: number, studentName: string) => {
    setConfirmDialog({ isOpen: true, type: 'student', id: studentId, name: studentName });
  };

  const handleDeleteStudentConfirm = async () => {
    if (!confirmDialog.id || confirmDialog.type !== 'student') return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/students/${confirmDialog.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      fetchImpact(); // Refresh lại phân tích
      setConfirmDialog({ isOpen: false, type: null, id: null });
      setAlertDialog({ isOpen: true, title: 'Thành công', message: 'Đã xóa sinh viên thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Lỗi khi xóa sinh viên:', error);
      setConfirmDialog({ isOpen: false, type: null, id: null });
      setAlertDialog({ isOpen: true, title: 'Lỗi', message: 'Lỗi khi xóa sinh viên: ' + (error.response?.data?.detail || error.message), type: 'error' });
    }
  };

  const handleExport = () => {
    if (!impact || impact.missing_students.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    // Tạo CSV content
    let csvContent = 'STT,Tên sinh viên,MSSV,Môn học thiếu,Trạng thái\n';
    impact.missing_students.forEach((student, index) => {
      const courses = student.missing_course_details || student.missing_courses?.map(c => ({ course_name: c, status: 'Chưa học' })) || [];
      courses.forEach((course, idx) => {
        const courseName = typeof course === 'string' ? course : course.course_name;
        const status = typeof course === 'string' ? 'Chưa học' : course.status;
        if (idx === 0) {
          csvContent += `${index + 1},"${student.name}","${student.student_number}","${courseName}","${status}"\n`;
        } else {
          csvContent += `,"","","${courseName}","${status}"\n`;
        }
      });
    });

    // Download CSV
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_sach_sinh_vien_khong_dap_ung_${courseId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  const strictPrereqs = prerequisites.filter(p => p.type === 'strict');
  const coreqPrereqs = prerequisites.filter(p => p.type === 'coreq');
  const recommendedPrereqs = prerequisites.filter(p => p.type === 'recommended');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Course Info */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Thông tin môn học</h2>
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'course', id: courseId, name: course?.title || 'Môn học này' })}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              title="Xóa môn học này"
            >
              🗑️ Xóa
            </button>
          </div>
          {course && (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">Mã môn:</span>
                <span className="text-base font-bold text-indigo-600">{course.code}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">Tên môn:</span>
                <span className="text-base font-semibold text-gray-800">{course.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Prerequisites */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Điều kiện tiên quyết</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-sm text-blue-900 font-bold mb-3 flex items-center">
                <span className="text-lg mr-2">💡</span>
                Điều kiện tiên quyết là gì?
              </p>
              <ul className="text-xs text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="font-bold text-blue-900 mr-2">•</span>
                  <span><strong className="text-red-600">Bắt buộc (Strict):</strong> Sinh viên PHẢI học và đạt môn này trước khi đăng ký môn hiện tại</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-900 mr-2">•</span>
                  <span><strong className="text-yellow-600">Đồng thời (Co-requisite):</strong> Sinh viên có thể học cùng lúc với môn hiện tại</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-900 mr-2">•</span>
                  <span><strong className="text-blue-600">Khuyến nghị (Recommended):</strong> Nên học trước nhưng không bắt buộc</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-red-600 mb-2">
              Bắt buộc (Strict) ({strictPrereqs.length})
            </h3>
            {strictPrereqs.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có</p>
            ) : (
              <ul className="space-y-2">
                {strictPrereqs.map((prereq) => (
                  <li
                    key={prereq.id}
                    className="flex justify-between items-center p-2 bg-red-50 rounded"
                  >
                    <span className="text-sm">
                      {prereqCourses[prereq.prereq_course_id] 
                        ? `${prereqCourses[prereq.prereq_course_id].code} - ${prereqCourses[prereq.prereq_course_id].title}`
                        : `Môn học ID: ${prereq.prereq_course_id}`}
                    </span>
                    <button
                      onClick={() => handleDeletePrereqClick(prereq.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-100"
                      title="Xóa môn học tiên quyết"
                    >
                      🗑️ Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-yellow-600 mb-2">
              Đồng thời (Co-requisite) ({coreqPrereqs.length})
            </h3>
            {coreqPrereqs.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có</p>
            ) : (
              <ul className="space-y-2">
                {coreqPrereqs.map((prereq) => (
                  <li
                    key={prereq.id}
                    className="flex justify-between items-center p-2 bg-yellow-50 rounded"
                  >
                    <span className="text-sm">
                      {prereqCourses[prereq.prereq_course_id] 
                        ? `${prereqCourses[prereq.prereq_course_id].code} - ${prereqCourses[prereq.prereq_course_id].title}`
                        : `Môn học ID: ${prereq.prereq_course_id}`}
                    </span>
                    <button
                      onClick={() => handleDeletePrereqClick(prereq.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-100"
                      title="Xóa môn học tiên quyết"
                    >
                      🗑️ Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-blue-600 mb-2">
              Khuyến nghị (Recommended) ({recommendedPrereqs.length})
            </h3>
            {recommendedPrereqs.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có</p>
            ) : (
              <ul className="space-y-2">
                {recommendedPrereqs.map((prereq) => (
                  <li
                    key={prereq.id}
                    className="flex justify-between items-center p-2 bg-blue-50 rounded"
                  >
                    <span className="text-sm">
                      {prereqCourses[prereq.prereq_course_id] 
                        ? `${prereqCourses[prereq.prereq_course_id].code} - ${prereqCourses[prereq.prereq_course_id].title}`
                        : `Môn học ID: ${prereq.prereq_course_id}`}
                    </span>
                    <button
                      onClick={() => handleDeletePrereqClick(prereq.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-100"
                      title="Xóa môn học tiên quyết"
                    >
                      🗑️ Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Gợi ý môn học tiên quyết</h2>
          <button
            onClick={handleSuggest}
            disabled={suggesting}
            className="w-full mb-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
          >
            {suggesting ? 'Đang gợi ý...' : 'Gợi ý môn học tiên quyết'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-full mb-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Tạo môn học mới
          </button>
          {suggestions.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.course_id}
                  className="p-3 border border-gray-200 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {suggestion.code} - {suggestion.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Độ tin cậy: {(suggestion.confidence * 100).toFixed(1)}%
                      </p>
                      {suggestion.match_reasons.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {suggestion.match_reasons.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddPrereq(suggestion.course_id, 'strict')}
                      className="ml-2 text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Impact Analysis Panel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Phân tích sinh viên không đáp ứng điều kiện tiên quyết
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Công cụ này giúp xác định bao nhiêu sinh viên trong lớp chưa đạt các môn học tiên quyết. 
            Thông tin này hỗ trợ giảng viên dự báo mức độ rủi ro và có kế hoạch hỗ trợ phù hợp.
          </p>
        </div>

        {prerequisites.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Môn này không yêu cầu môn tiên quyết. Không cần phân tích rủi ro.
            </p>
          </div>
        ) : impact ? (
          <div className="space-y-6">
            {/* A. Thống kê tổng quan */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Thống kê tổng quan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Tổng số sinh viên:</p>
                  <p className="text-2xl font-bold text-gray-900">{impact.total_students}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số sinh viên không đáp ứng:</p>
                  <p className="text-2xl font-bold text-red-600">{impact.missing_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Risk Score (%):
                    <span
                      className={`ml-2 font-bold ${getRiskScoreColor(impact.risk_score)}`}
                      title="Risk Score = Tỷ lệ sinh viên không đáp ứng điều kiện tiên quyết. Tỷ lệ càng cao → nguy cơ rớt môn và ảnh hưởng đến kết quả CLO/PLO càng lớn."
                    >
                      {(impact.risk_score * 100).toFixed(1)}%
                    </span>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className={`h-3 rounded-full ${getRiskScoreBgColor(impact.risk_score)}`}
                      style={{ width: `${impact.risk_score * 100}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-2 font-medium ${getRiskScoreColor(impact.risk_score)}`}>
                    {getRiskDescription(impact.risk_score)}
                  </p>
                </div>
              </div>
            </div>

            {/* B. Danh sách sinh viên không đáp ứng */}
            {impact.missing_students.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Danh sách sinh viên không đáp ứng</h3>
                  <button
                    onClick={handleExport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    📥 Xuất danh sách (CSV)
                  </button>
                </div>
                <div className="space-y-3">
                  {impact.missing_students.map((student, index) => (
                    <div key={student.id} className="p-4 border border-gray-200 rounded-lg bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">
                          {index + 1}. {student.name} (MSSV: {student.student_number})
                        </p>
                        <button
                          onClick={() => handleDeleteStudentClick(student.id, student.name)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-100"
                          title="Xóa sinh viên khỏi hệ thống"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="ml-4 space-y-1">
                        {student.missing_course_details && student.missing_course_details.length > 0 ? (
                          student.missing_course_details.map((course, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              ❌ {course.status}: <strong>{course.course_name}</strong>
                            </p>
                          ))
                        ) : (
                          student.missing_courses?.map((course, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              ❌ Chưa đạt: <strong>{course}</strong>
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. Khuyến nghị giảng viên */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                💡 Gợi ý cho giảng viên
              </h3>
              <p className="text-sm text-yellow-800">
                {getRecommendation(impact.risk_score)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">Đang tải dữ liệu phân tích...</p>
          </div>
        )}
      </div>

      {showModal && (
        <CourseForm
          onSuccess={() => {
            setShowModal(false);
            fetchData();
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'prereq' 
            ? 'Xác nhận xóa môn học tiên quyết'
            : confirmDialog.type === 'student'
            ? 'Xác nhận xóa sinh viên'
            : confirmDialog.type === 'course'
            ? 'Xác nhận xóa môn học'
            : 'Xác nhận'
        }
        message={
          confirmDialog.type === 'prereq'
            ? `Bạn có chắc muốn xóa môn học tiên quyết "${confirmDialog.name}"?`
            : confirmDialog.type === 'student'
            ? `Bạn có chắc muốn xóa sinh viên "${confirmDialog.name}" khỏi hệ thống?`
            : confirmDialog.type === 'course'
            ? `Bạn có chắc muốn xóa môn học "${confirmDialog.name}"? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.`
            : 'Bạn có chắc muốn thực hiện hành động này?'
        }
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={async () => {
          if (confirmDialog.type === 'prereq') {
            handleDeletePrereqConfirm();
          } else if (confirmDialog.type === 'student') {
            handleDeleteStudentConfirm();
          } else if (confirmDialog.type === 'course') {
            // Xử lý xóa môn học
            try {
              const token = localStorage.getItem('token');
              await axios.delete(`${API_URL}/api/courses/${confirmDialog.id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              });
              setConfirmDialog({ isOpen: false, type: null, id: null });
              setAlertDialog({ isOpen: true, title: 'Thành công', message: 'Đã xóa môn học thành công!', type: 'success' });
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
            } catch (error: any) {
              console.error('Lỗi khi xóa môn học:', error);
              setConfirmDialog({ isOpen: false, type: null, id: null });
              setAlertDialog({ isOpen: true, title: 'Lỗi', message: 'Lỗi khi xóa môn học: ' + (error.response?.data?.detail || error.message), type: 'error' });
            }
          }
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null, id: null })}
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

export default CoursePrereqManager;
