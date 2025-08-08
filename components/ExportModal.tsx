import React, { useState, useEffect } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: { dataType: 'products' | 'transactions' | 'lowStock', columns: { [key: string]: boolean }}) => void;
}

const productColumns = {
  name: 'نام محصول',
  categoryName: 'دسته‌بندی',
  tagName: 'تگ',
  quantity: 'تعداد',
  lastUpdated: 'آخرین بروزرسانی',
};

const transactionColumns = {
  productName: 'نام محصول',
  type: 'نوع عملیات',
  invoiceNumber: 'شماره فاکتور',
  quantityChange: 'تغییر تعداد',
  timestamp: 'تاریخ و زمان',
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [dataType, setDataType] = useState<'products' | 'transactions' | 'lowStock'>('products');
  const [selectedColumns, setSelectedColumns] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
        // Reset state when modal opens to ensure consistency
        handleDataTypeChange('products');
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const handleDataTypeChange = (type: 'products' | 'transactions' | 'lowStock') => {
    setDataType(type);
    const initialColumns = type === 'transactions' ? transactionColumns : productColumns;
    const newSelectedColumns = {};
    Object.keys(initialColumns).forEach(key => {
        if (type !== 'transactions' && key === 'lastUpdated') {
            newSelectedColumns[key] = false;
        } else {
            newSelectedColumns[key] = true;
        }
    });
    setSelectedColumns(newSelectedColumns);
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  const handleExportClick = () => {
    onExport({ dataType, columns: selectedColumns });
  };
  
  const currentColumns = dataType === 'transactions' ? transactionColumns : productColumns;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-6 text-white">خروجی اکسل</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">۱. انتخاب نوع داده برای خروجی</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => handleDataTypeChange('products')} className={`flex-1 py-2 rounded-md transition-colors ${dataType === 'products' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                لیست محصولات
              </button>
              <button type="button" onClick={() => handleDataTypeChange('transactions')} className={`flex-1 py-2 rounded-md transition-colors ${dataType === 'transactions' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                تاریخچه عملیات
              </button>
              <button type="button" onClick={() => handleDataTypeChange('lowStock')} className={`flex-1 py-2 rounded-md transition-colors ${dataType === 'lowStock' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                کالاهای ته انباری
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">۲. انتخاب ستون‌های مورد نظر</label>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-gray-700/50 rounded-lg">
                {Object.entries(currentColumns).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={selectedColumns[key] || false}
                            onChange={() => handleColumnToggle(key)}
                            className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-600"
                        />
                        <span className="text-white">{label}</span>
                    </label>
                ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="button" onClick={handleExportClick} className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors">ایجاد خروجی</button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;