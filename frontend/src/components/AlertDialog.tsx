import React from 'react';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  message,
  buttonText = 'Đóng',
  onClose,
  type = 'info',
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    success: {
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: 'text-green-600',
      bg: 'bg-green-100',
    },
    error: {
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'text-red-600',
      bg: 'bg-red-100',
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  };

  const colors = colorClasses[type];

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-white px-4 pt-6 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${colors.bg} sm:mx-0 sm:h-12 sm:w-12 shadow-lg`}>
                {type === 'success' && (
                  <svg className={`h-6 w-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {type === 'error' && (
                  <svg className={`h-6 w-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {type === 'info' && (
                  <svg className={`h-6 w-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-2">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                    {(() => {
                      try {
                        const msg: any = message;
                        if (msg === null || msg === undefined) return '';
                        if (typeof msg === 'string') return msg;
                        if (typeof msg === 'number' || typeof msg === 'boolean') return String(msg);
                        if (Array.isArray(msg)) {
                          return msg.map((e: any) => {
                            if (typeof e === 'string') return e;
                            if (typeof e === 'object' && e !== null) {
                              if (e.msg) return String(e.msg);
                              if (e.message) return String(e.message);
                              return JSON.stringify(e);
                            }
                            return String(e);
                          }).join(', ');
                        }
                        if (typeof msg === 'object') {
                          if (msg.msg) return String(msg.msg);
                          if (msg.message) return String(msg.message);
                          return JSON.stringify(msg);
                        }
                        return String(msg);
                      } catch (e) {
                        return 'Lỗi không xác định';
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-lg border border-transparent px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${colors.button}`}
              onClick={onClose}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;

