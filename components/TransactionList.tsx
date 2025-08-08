

import React, { useMemo } from 'react';
import { Transaction, Permission } from '../types';
import { PencilIcon, TrashIcon } from './icons';

interface TransactionRowProps {
    transaction: Transaction; 
    productName: string;
    onDelete: (transactionId: string) => void;
    onEdit: (transaction: Transaction) => void;
    hasPermission: (permission: Permission) => boolean;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, productName, onEdit, onDelete, hasPermission }) => {
    const { type, invoiceNumber, quantityChange, timestamp } = transaction;

    const transactionTypeInfo = {
        purchase: { text: 'ورود', color: 'text-green-400' },
        sale: { text: 'خروج', color: 'text-red-400' },
        adjustment: { text: 'اصلاح دستی', color: 'text-yellow-400' },
        recount: { text: 'شمارش مجدد', color: 'text-cyan-400' },
    }[type];

    const formattedDate = new Date(timestamp).toLocaleString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const displayValue = quantityChange > 0 
        ? `+${new Intl.NumberFormat('en-US').format(Math.abs(quantityChange))}`
        : `-${new Intl.NumberFormat('en-US').format(Math.abs(quantityChange))}`;

    return (
        <div className="block md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)] md:items-center hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-700 md:border-none">
            {/* Mobile View */}
            <div className="p-4 md:hidden">
                <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg text-white break-words">{productName || <span className="text-gray-500 italic">محصول حذف شده</span>}</div>
                        <div className={`font-semibold ${transactionTypeInfo.color}`}>{transactionTypeInfo.text}</div>
                    </div>
                    <div className={`text-2xl font-mono ${transactionTypeInfo.color} flex-shrink-0`} style={{ direction: 'ltr' }}>
                        {displayValue}
                    </div>
                </div>
                 <div className="text-sm text-gray-300 mb-3 truncate">
                    <span className="text-gray-400">فاکتور/یادداشت: </span>
                    {invoiceNumber}
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-400">{formattedDate}</div>
                    <div className="flex items-center gap-1">
                        {hasPermission('CAN_EDIT_TRANSACTIONS') && (
                            <button onClick={() => onEdit(transaction)} className="p-2 text-teal-400 hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-500/20" title="ویرایش">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        )}
                        {hasPermission('CAN_DELETE_TRANSACTIONS') && (
                            <button onClick={() => onDelete(transaction.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20" title="حذف">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                 </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block px-4 py-3 whitespace-nowrap text-sm font-medium text-white text-center">{productName || <span className="text-gray-500 italic">محصول حذف شده</span>}</div>
            <div className={`hidden md:block px-4 py-3 whitespace-nowrap text-sm font-semibold ${transactionTypeInfo.color} text-center`}>
                {transactionTypeInfo.text}
            </div>
            <div className="hidden md:block px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center truncate">{invoiceNumber}</div>
            <div className={`hidden md:block px-4 py-3 whitespace-nowrap text-sm font-mono ${transactionTypeInfo.color} text-center`} style={{ direction: 'ltr' }}>
                {displayValue}
            </div>
            <div className="hidden md:block px-4 py-3 whitespace-nowrap text-sm text-gray-400 text-center">{formattedDate}</div>
            <div className="hidden md:flex items-center justify-center gap-2 px-4 py-3 whitespace-nowrap text-sm font-medium">
                {hasPermission('CAN_EDIT_TRANSACTIONS') && (
                    <button onClick={() => onEdit(transaction)} className="p-2 text-teal-400 hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-500/20 border border-teal-500/30" title="ویرایش">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                {hasPermission('CAN_DELETE_TRANSACTIONS') && (
                    <button onClick={() => onDelete(transaction.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20 border border-red-500/30" title="حذف">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};


interface TransactionListProps {
  transactions: Transaction[];
  productsMap: Map<string, string>;
  searchTerm: string;
  onDelete: (transactionId: string) => void;
  onEdit: (transaction: Transaction) => void;
  hasPermission: (permission: Permission) => boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, productsMap, searchTerm, onEdit, onDelete, hasPermission }) => {
  const filteredTransactions = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    if (!lowercasedFilter) {
      return transactions;
    }
    return transactions.filter(tx => {
        const productName = productsMap.get(tx.productId)?.toLowerCase() || '';
        return (
            productName.includes(lowercasedFilter) ||
            tx.invoiceNumber.toLowerCase().includes(lowercasedFilter) ||
            tx.type.toLowerCase().includes(lowercasedFilter)
        );
    });
  }, [transactions, searchTerm, productsMap]);
    
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)] bg-gray-700/50">
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نام محصول</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نوع عملیات</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">فاکتور/یادداشت</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تغییر تعداد</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تاریخ و زمان</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">عملیات</div>
      </div>

      <div className="md:divide-y md:divide-gray-700">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(tx => (
            <TransactionRow 
                key={tx.id} 
                transaction={tx}
                productName={productsMap.get(tx.productId) || ''}
                onDelete={onDelete}
                onEdit={onEdit}
                hasPermission={hasPermission}
            />
          ))
        ) : (
          <p className="px-6 py-12 text-center text-gray-400">
            هیچ عملیاتی یافت نشد.
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionList;