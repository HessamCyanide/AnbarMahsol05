import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { TrashIcon } from './icons';

interface TransactionListProps {
  transactions: Transaction[];
  productsMap: Map<string, string>;
  searchTerm: string;
  onDelete: (transactionId: string) => void;
}

const TransactionRow: React.FC<{ 
    transaction: Transaction; 
    productName: string;
    onDelete: (transactionId: string) => void;
}> = ({ transaction, productName, onDelete }) => {
    const { type, invoiceNumber, quantityChange, timestamp } = transaction;

    const transactionTypeInfo = {
        purchase: { text: 'ورود', color: 'text-green-400' },
        sale: { text: 'خروج', color: 'text-red-400' },
        adjustment: { text: 'اصلاح دستی', color: 'text-yellow-400' },
    }[type];

    const formattedDate = new Date(timestamp).toLocaleString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

            // Handle the sign properly for RTL display - force LTR for numbers
            const displayValue = quantityChange > 0 
                ? `+${new Intl.NumberFormat('en-US').format(Math.abs(quantityChange))}`
                : `-${new Intl.NumberFormat('en-US').format(Math.abs(quantityChange))}`;

    return (
        <tr className="bg-gray-800 hover:bg-gray-700/70 transition-colors duration-200">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white text-center">{productName || <span className="text-gray-500 italic">محصول حذف شده</span>}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${transactionTypeInfo.color} text-center`}>
                {transactionTypeInfo.text}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">{invoiceNumber}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${transactionTypeInfo.color} text-center`} style={{ direction: 'ltr' }}>
                {displayValue}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">{formattedDate}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <button onClick={() => onDelete(transaction.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20 border border-red-500/30" title="حذف">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, productsMap, searchTerm, onDelete }) => {
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نام محصول</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نوع عملیات</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">شماره/نام فاکتور</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تغییر تعداد</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تاریخ و زمان</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(tx => (
                <TransactionRow 
                    key={tx.id} 
                    transaction={tx}
                    productName={productsMap.get(tx.productId) || ''}
                    onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  هیچ عملیاتی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;