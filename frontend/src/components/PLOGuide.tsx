import React from 'react';

const PLOGuide: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-green-900 mb-3">
        🎯 PLO (Program Learning Outcomes) là gì?
      </h3>
      <div className="text-sm text-green-800 space-y-3">
        <p>
          <strong>PLO</strong> là <strong>Mục tiêu học tập của chương trình</strong> - mô tả những gì sinh viên 
          sẽ đạt được sau khi <strong>hoàn thành toàn bộ chương trình đào tạo</strong>.
        </p>
        
        <div className="bg-white rounded p-4 mt-3">
          <p className="font-semibold mb-2">Ví dụ PLO cho chương trình Du lịch:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>PLO1:</strong> Áp dụng được kiến thức cơ bản về du lịch và khách sạn</li>
            <li><strong>PLO2:</strong> Phân tích và giải quyết các vấn đề trong ngành du lịch</li>
            <li><strong>PLO3:</strong> Giao tiếp hiệu quả trong môi trường đa văn hóa</li>
            <li><strong>PLO4:</strong> Làm việc nhóm và lãnh đạo trong các dự án du lịch</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="font-semibold text-yellow-900 mb-1">Mối quan hệ CLO → PLO:</p>
          <p className="text-yellow-800 text-xs">
            Mỗi <strong>CLO</strong> của môn học sẽ đóng góp vào một hoặc nhiều <strong>PLO</strong> của chương trình. 
            Hệ thống sẽ tự động tính toán tỷ lệ đạt PLO dựa trên kết quả đạt CLO của các môn học.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PLOGuide;



