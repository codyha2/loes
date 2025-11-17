import React from 'react';

const CLOGuide: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-purple-900 mb-3">
        📚 CLO (Course Learning Outcomes) là gì?
      </h3>
      <div className="text-sm text-purple-800 space-y-3">
        <p>
          <strong>CLO</strong> là <strong>Mục tiêu học tập của môn học</strong> - mô tả những gì sinh viên 
          sẽ <strong>biết, hiểu, và làm được</strong> sau khi hoàn thành môn học.
        </p>
        
        <div className="bg-white rounded p-4 mt-3">
          <p className="font-semibold mb-2">Ví dụ CLO cho môn "Marketing Du lịch":</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>CLO1:</strong> Phân tích được các chiến lược marketing cho điểm đến du lịch (Bloom Level: Phân tích)</li>
            <li><strong>CLO2:</strong> Thiết kế được kế hoạch marketing mix cho sản phẩm du lịch (Bloom Level: Sáng tạo)</li>
            <li><strong>CLO3:</strong> Đánh giá được hiệu quả của các chiến dịch marketing du lịch (Bloom Level: Đánh giá)</li>
          </ul>
        </div>

        <div className="mt-4">
          <p className="font-semibold mb-2">Bloom's Taxonomy (6 cấp độ):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2 rounded">1. Nhớ (Remember)</div>
            <div className="bg-white p-2 rounded">2. Hiểu (Understand)</div>
            <div className="bg-white p-2 rounded">3. Áp dụng (Apply)</div>
            <div className="bg-white p-2 rounded">4. Phân tích (Analyze)</div>
            <div className="bg-white p-2 rounded">5. Đánh giá (Evaluate)</div>
            <div className="bg-white p-2 rounded">6. Sáng tạo (Create)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CLOGuide;


