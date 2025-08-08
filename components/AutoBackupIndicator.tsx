import React, { useState, useEffect } from 'react';

const LAST_BACKUP_DATE_KEY = 'autoBackupLastDateV2';
const BACKUP_INTERVAL_DAYS = 30;

interface RemainingTime {
    days: number;
    hours: number;
    minutes: number;
}

interface AutoBackupIndicatorProps {
  onAutoBackup: () => void;
}

const AutoBackupIndicator: React.FC<AutoBackupIndicatorProps> = ({ onAutoBackup }) => {
    const [remainingTime, setRemainingTime] = useState<RemainingTime | null>(null);

    useEffect(() => {
        const calculateRemainingTime = () => {
            const lastBackupDateStr = localStorage.getItem(LAST_BACKUP_DATE_KEY);
            let lastBackupDate: Date;

            if (lastBackupDateStr) {
                lastBackupDate = new Date(lastBackupDateStr);
            } else {
                lastBackupDate = new Date();
                localStorage.setItem(LAST_BACKUP_DATE_KEY, lastBackupDate.toISOString());
            }
            
            const nextBackupDate = new Date(lastBackupDate);
            nextBackupDate.setDate(lastBackupDate.getDate() + BACKUP_INTERVAL_DAYS);
            
            const now = new Date();
            const timeDiff = nextBackupDate.getTime() - now.getTime();
            
            if (timeDiff <= 0) {
                setRemainingTime({ days: 0, hours: 0, minutes: 0 });
                // Time for a backup
                onAutoBackup();
                localStorage.setItem(LAST_BACKUP_DATE_KEY, new Date().toISOString());
                alert(`پشتیبان‌گیری خودکار ماهانه انجام شد. فایل در مرورگر شما دانلود شد.`);
                // We'll let the next interval recalculate the time properly.
            } else {
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                setRemainingTime({ days, hours, minutes });
            }
        };

        calculateRemainingTime();
        // Check every minute for a live countdown
        const intervalId = setInterval(calculateRemainingTime, 1000 * 60);
        
        return () => clearInterval(intervalId);
    }, [onAutoBackup]);
    
    const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="text-teal-400 text-center">
            {remainingTime !== null ? (
                <>
                    <div className="font-bold text-base">پشتیبان بعدی</div>
                    <div className="font-mono font-bold text-lg tracking-wider" title={`${remainingTime.days} روز و ${remainingTime.hours} ساعت و ${remainingTime.minutes} دقیقه دیگر`}>
                        {`${remainingTime.days}d ${formatTwoDigits(remainingTime.hours)}h ${formatTwoDigits(remainingTime.minutes)}m`}
                    </div>
                </>
            ) : (
                <div className="font-bold">درحال محاسبه...</div>
            )}
        </div>
    );
};

export default AutoBackupIndicator;