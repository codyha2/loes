import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssessmentForm from './AssessmentForm';
import QuestionForm from './QuestionForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Assessment {
  id: number;
  name: string;
  type: string;
  weight: number;
  description: string;
  course_id: number;
}

interface Question {
  id: number;
  text: string;
  max_score: number;
  assessment_id: number;
  clo_ids: number[];
}

interface AssessmentListProps {
  courseId: number;
}

const AssessmentList: React.FC<AssessmentListProps> = ({ courseId }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Record<number, Question[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState<number | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, [courseId]);

  const fetchAssessments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assessments?course_id=${courseId}`);
      setAssessments(response.data);
      
      // Fetch questions for each assessment
      const questionsMap: Record<number, Question[]> = {};
      for (const assessment of response.data) {
        try {
          const qResponse = await axios.get(`${API_URL}/api/questions?assessment_id=${assessment.id}`);
          questionsMap[assessment.id] = qResponse.data;
        } catch (error) {
          questionsMap[assessment.id] = [];
        }
      }
      setQuestions(questionsMap);
    } catch (error) {
      console.error('Lỗi khi tải Đánh giá:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa Đánh giá này?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/assessments/${assessmentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      fetchAssessments();
      alert('Đã xóa Đánh giá thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xóa Đánh giá:', error);
      alert('Lỗi khi xóa Đánh giá: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
      if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/questions/${questionId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      fetchAssessments();
      alert('Đã xóa câu hỏi thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xóa Question:', error);
      alert('Lỗi khi xóa câu hỏi: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Kế hoạch đánh giá</h2>
          <p className="text-sm text-gray-600">
            Tạo Đánh giá và Câu hỏi để đánh giá sinh viên. Mỗi Câu hỏi có thể liên kết với một hoặc nhiều CLO.
          </p>
        </div>
        <button
          onClick={() => setShowAssessmentForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Tạo Đánh giá
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
          Chưa có Đánh giá nào. Click "Tạo Đánh giá" để bắt đầu.
        </div>
      ) : (
        <div className="space-y-6">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{assessment.name}</h3>
                  <p className="text-sm text-gray-600">
                    Loại: {assessment.type} | Trọng số: {assessment.weight}%
                  </p>
                  {assessment.description && (
                    <p className="text-sm text-gray-500 mt-1">{assessment.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowQuestionForm(assessment.id)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    + Thêm câu hỏi
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(assessment.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Danh sách câu hỏi:</h4>
                {questions[assessment.id]?.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có câu hỏi nào.</p>
                ) : (
                  <div className="space-y-2">
                    {questions[assessment.id]?.map((question) => (
                      <div
                        key={question.id}
                        className="p-3 bg-gray-50 rounded flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">Câu {question.id}: {question.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Điểm tối đa: {question.max_score} | CLO: {question.clo_ids.join(', ') || 'Chưa liên kết'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssessmentForm && (
        <AssessmentForm
          courseId={courseId}
          onSuccess={fetchAssessments}
          onClose={() => setShowAssessmentForm(false)}
        />
      )}

      {showQuestionForm && (
        <QuestionForm
          assessmentId={showQuestionForm}
          courseId={courseId}
          onSuccess={fetchAssessments}
          onClose={() => setShowQuestionForm(null)}
        />
      )}
    </div>
  );
};

export default AssessmentList;

