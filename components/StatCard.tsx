
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4 space-x-reverse`}>
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white font-mono break-all">{typeof value === 'number' ? value.toLocaleString('en-US') : value}</p>
      </div>
    </div>
  );
};

export default StatCard;