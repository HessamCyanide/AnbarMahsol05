import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formattedDate = date.toLocaleString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    return (
        <div className="text-teal-400 text-center">
            <div className="font-bold text-base">{formattedDate}</div>
            <div className="font-mono font-bold text-lg tracking-wider">{formattedTime}</div>
        </div>
    );
};

export default Clock;