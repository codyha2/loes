import React from 'react';

const WorkflowGuide: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🚀 Workflow sử dụng hệ thống (5 bước đơn giản)
      </h3>
      
      <div className="space-y-4">
        {/* Bước 1 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Chọn môn học</h4>
            <p className="text-sm text-gray-600 mt-1">
              Click vào một môn học trong danh sách để xem chi tiết
            </p>
          </div>
        </div>

        {/* Bước 2 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Tạo CLO cho môn học</h4>
            <p className="text-sm text-gray-600 mt-1">
              Vào tab <strong>"CLO"</strong> → Click <strong>"Tạo CLO mới"</strong> → Nhập mục tiêu học tập 
              (ví dụ: "Phân tích được các chiến lược marketing du lịch")
            </p>
          </div>
        </div>

        {/* Bước 3 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Liên kết CLO với PLO</h4>
            <p className="text-sm text-gray-600 mt-1">
              Vào tab <strong>"Ma trận CLO-PLO"</strong> → Chọn PLO mà CLO này đóng góp vào 
              (ví dụ: CLO "Phân tích marketing" → PLO "Phân tích và giải quyết vấn đề")
            </p>
          </div>
        </div>

        {/* Bước 4 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            4
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Thiết lập điều kiện tiên quyết</h4>
            <p className="text-sm text-gray-600 mt-1">
              Vào tab <strong>"Prerequisites"</strong> → Click <strong>"Gợi ý môn học tiên quyết"</strong> 
              → Chọn và thêm các môn học cần học trước
            </p>
          </div>
        </div>

        {/* Bước 5 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            5
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Xuất đề cương học phần</h4>
            <p className="text-sm text-gray-600 mt-1">
              Vào tab <strong>"Export"</strong> → Điền thông tin giảng viên → Click <strong>"Xuất Word"</strong> 
              → Tải file đề cương đã được tự động tạo
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <p className="text-sm text-indigo-900">
          <strong>💡 Mẹo:</strong> Sau khi nhập điểm cho sinh viên, hệ thống sẽ tự động tính toán 
          tỷ lệ đạt CLO/PLO. Vào tab <strong>"Điểm"</strong> để xem kết quả.
        </p>
      </div>
    </div>
  );
};

export default WorkflowGuide;


