import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
        <div className="text-gray-300 mb-6">{message}</div>
        <div className="flex justify-end space-x-4 space-x-reverse">
          <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">لغو</button>
          <button type="button" onClick={handleConfirm} className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400">تایید حذف</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
