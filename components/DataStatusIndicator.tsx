
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons';

interface DataStatusIndicatorProps {
  lastActivityTimestamp: number | null;
}

type Status = 'idle' | 'saving' | 'saved';

const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({ lastActivityTimestamp }) => {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (lastActivityTimestamp === null) return;

    setStatus('saving');
    
    const savingTimer = setTimeout(() => {
      setStatus('saved');
    }, 300); // Simulate saving delay

    const idleTimer = setTimeout(() => {
      setStatus('idle');
    }, 2000); // Show 'saved' for a bit before returning to idle

    return () => {
      clearTimeout(savingTimer);
      clearTimeout(idleTimer);
    };
  }, [lastActivityTimestamp]);

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return { text: 'در حال ذخیره‌سازی...', icon: null, color: 'text-yellow-400' };
      case 'saved':
        return { text: 'ذخیره شد!', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-green-400' };
      case 'idle':
      default:
        return { text: 'تغییرات در مرورگر ذخیره شد', icon: null, color: 'text-gray-400' };
    }
  };

  const { text, icon, color } = getStatusContent();

  const tooltipText = "تمام تغییرات به صورت خودکار در این مرورگر ذخیره می‌شود. برای ساخت فایل پشتیبان قابل حمل، از دکمه 'پشتیبان' استفاده کنید.";

  return (
    <div className="relative group flex items-center">
      <div className={`flex items-center gap-1 text-xs font-medium transition-colors duration-300 ${color}`}>
        {icon}
        <span>{text}</span>
      </div>
      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-center border border-gray-600 z-10">
        {tooltipText}
      </div>
    </div>
  );
};

export default DataStatusIndicator;
