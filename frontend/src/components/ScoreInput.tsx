import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentForm from './StudentForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ScoreInputProps {
  courseId: number;
}

interface Student {
  id: number;
  name: string;
  student_number: string;
}

interface Question {
  id: number;
  text: string;
  max_score: number;
  assessment_id: number;
}

interface Assessment {
  id: number;
  name: string;
  type: string;
  weight: number;
}

interface Score {
  id?: number;
  student_id: number;
  question_id: number;
  score: number;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ courseId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showStudentForm, setShowStudentForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (selectedAssessment) {
      fetchQuestions(selectedAssessment);
      fetchScores(selectedAssessment);
    }
  }, [selectedAssessment]);

  const fetchData = async () => {
    try {
      const [studentsRes, assessmentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/assessments?course_id=${courseId}`),
      ]);
      setStudents(studentsRes.data);
      setAssessments(assessmentsRes.data);
      if (assessmentsRes.data.length > 0) {
        setSelectedAssessment(assessmentsRes.data[0].id);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (assessmentId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/questions?assessment_id=${assessmentId}`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Lỗi khi tải câu hỏi:', error);
    }
  };

  const fetchScores = async (assessmentId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/scores?assessment_id=${assessmentId}`);
      const scoreMap: Record<string, number> = {};
      response.data.forEach((score: any) => {
        const key = `${score.student_id}_${score.question_id}`;
        scoreMap[key] = score.score;
      });
      setScores(scoreMap);
    } catch (error) {
      console.error('Lỗi khi tải điểm:', error);
    }
  };

  const handleScoreChange = (studentId: number, questionId: number, value: string) => {
    const key = `${studentId}_${questionId}`;
    const numValue = parseFloat(value) || 0;
    setScores({ ...scores, [key]: numValue });
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Dynamic import xlsx library
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          // Parse Excel: Cột 1 = Mã SV, Cột 2 = Tên SV, Cột 3+ = Điểm
          const newScores: Record<string, number> = { ...scores };
          
          for (let i = 1; i < jsonData.length; i++) { // Bỏ qua header
            const row = jsonData[i];
            if (!row || row.length < 2) continue;

            const studentNumber = String(row[0]).trim();
            const student = students.find(s => s.student_number === studentNumber);
            if (!student) {
              alert(`Không tìm thấy sinh viên với mã: ${studentNumber}`);
              continue;
            }

            // Cột 3+ là điểm cho từng câu hỏi (theo thứ tự)
            for (let j = 0; j < questions.length && j + 2 < row.length; j++) {
              const question = questions[j];
              const score = parseFloat(String(row[j + 2])) || 0;
              const key = `${student.id}_${question.id}`;
              newScores[key] = score;
            }
          }

          setScores(newScores);
          alert('Đã import điểm từ Excel thành công! Nhấn "Lưu điểm" để lưu vào hệ thống.');
        } catch (error) {
          console.error('Lỗi khi parse Excel:', error);
          alert('Lỗi khi đọc file Excel. Kiểm tra format file.');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Lỗi khi import Excel:', error);
      alert('Lỗi khi import Excel. Vui lòng cài đặt thư viện xlsx: npm install xlsx');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const scoresToSave = Object.entries(scores).map(([key, score]) => {
        const [studentId, questionId] = key.split('_').map(Number);
        return {
          student_id: studentId,
          question_id: questionId,
          score: score,
        };
      });

      for (const scoreData of scoresToSave) {
        try {
          await axios.post(
            `${API_URL}/api/scores`,
            scoreData,
            {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }
          );
        } catch (error: any) {
          // Nếu đã tồn tại, cập nhật
          if (error.response?.status === 400) {
            const existingScore = error.response.data;
            if (existingScore.id) {
              await axios.put(
                `${API_URL}/api/scores/${existingScore.id}`,
                scoreData,
                {
                  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }
              );
            }
          }
        }
      }

      alert('Đã lưu điểm thành công!');
    } catch (error: any) {
      console.error('Lỗi khi lưu điểm:', error);
      alert('Lỗi khi lưu điểm: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Nhập điểm cho sinh viên</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 Nhập điểm để làm gì?</p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Nhập điểm cho từng câu hỏi của từng sinh viên trong các bài thi/kiểm tra</li>
            <li>Hệ thống sẽ <strong>tự động tính toán</strong>:
              <ul className="list-circle list-inside ml-4 mt-1">
                <li>Tỷ lệ đạt CLO cho từng sinh viên</li>
                <li>Tỷ lệ đạt CLO trung bình của lớp</li>
                <li>Tỷ lệ đạt PLO của chương trình</li>
              </ul>
            </li>
            <li>Dựa trên điểm số, hệ thống biết sinh viên nào đã đạt CLO nào, từ đó tính toán PLO</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-green-900 font-medium mb-1">📋 Quy trình đầy đủ:</p>
          <p className="text-xs text-green-800 mb-1">
            <strong>Bước 1 (Trước học kỳ):</strong> Tạo đề cương → Tạo CLO → Tạo Đánh giá → Tạo Câu hỏi → Liên kết CLO-PLO → Xuất file Word
          </p>
          <p className="text-xs text-green-800">
            <strong>Bước 2 (Trong học kỳ):</strong> Thêm sinh viên → Nhập điểm (từng bài thi) → Xem kết quả tự động
          </p>
          <p className="text-xs text-green-700 mt-1">
            💡 <strong>Lưu ý:</strong> Phải tạo đề cương TRƯỚC, nhập điểm SAU. Không có đề cương thì không biết nhập điểm cho câu hỏi nào!
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn Assessment:
          </label>
          <select
            value={selectedAssessment || ''}
            onChange={(e) => setSelectedAssessment(Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Chọn Đánh giá --</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.name} ({assessment.type}) - Trọng số: {assessment.weight}%
              </option>
            ))}
          </select>
        </div>

        {assessments.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Chưa có Đánh giá.</strong> Vào tab "Assessment" để tạo Đánh giá và Câu hỏi trước khi nhập điểm.
            </p>
          </div>
        )}
      </div>

      {selectedAssessment && questions.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sinh viên
                  </th>
                  {questions.map((question) => (
                    <th key={question.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div>
                        <div className="font-semibold">Q{question.id}</div>
                        <div className="text-xs text-gray-400">Max: {question.max_score}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-gray-500 text-xs">{student.student_number}</div>
                    </td>
                    {questions.map((question) => {
                      const key = `${student.id}_${question.id}`;
                      const currentScore = scores[key] || 0;
                      return (
                        <td key={question.id} className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={question.max_score}
                            step="0.1"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(student.id, question.id, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoặc import từ Excel:
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Cột 1 = Mã SV, Cột 2 = Tên SV, Cột 3+ = Điểm theo từng câu hỏi (theo thứ tự)
              </p>
            </div>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Lưu điểm
            </button>
          </div>
        </>
      )}

      {selectedAssessment && questions.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Đánh giá này chưa có câu hỏi. Vào tab "Assessment" để thêm Câu hỏi.
          </p>
        </div>
      )}

      {students.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 mb-2">
            Chưa có sinh viên trong hệ thống. Cần thêm sinh viên trước khi nhập điểm.
          </p>
          <button
            onClick={() => setShowStudentForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            + Thêm sinh viên
          </button>
        </div>
      )}

      {showStudentForm && (
        <StudentForm
          onSuccess={() => {
            fetchData();
            setShowStudentForm(false);
          }}
          onClose={() => setShowStudentForm(false)}
        />
      )}
    </div>
  );
};

export default ScoreInput;

