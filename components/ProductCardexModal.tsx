import React, { useMemo } from 'react';
import { Product, Transaction } from '../types';

interface ProductCardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  transactions: Transaction[];
}

const ProductCardexModal: React.FC<ProductCardexModalProps> = ({ isOpen, onClose, product, transactions }) => {
  
  const cardexData = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Calculate the initial quantity before any recorded transactions
    const totalChange = transactions.reduce((sum, tx) => sum + tx.quantityChange, 0);
    let runningBalance = product.quantity - totalChange;
    
    const data = sortedTransactions.map(tx => {
        const balanceBefore = runningBalance;
        runningBalance += tx.quantityChange;
        const balanceAfter = runningBalance;
        
        return {
            ...tx,
            balanceBefore,
            balanceAfter
        };
    });
    
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort back to descending for display
  }, [product, transactions]);

  if (!isOpen) return null;
  
  const getTransactionTypeInfo = (tx: Transaction) => ({
    purchase: { text: 'ورود (خرید)', color: 'text-green-400' },
    sale: { text: 'خروج (فروش)', color: 'text-red-400' },
    adjustment: { text: `اصلاح دستی`, color: 'text-yellow-400' },
  }[tx.type]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-600 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-white">کاردکس کالا: {product.name}</h2>
            <p className="text-sm text-gray-400">موجودی فعلی: <span className="font-bold text-teal-400">{product.quantity}</span></p>
        </div>
        
        <div className="overflow-y-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تاریخ</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نوع عملیات</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">فاکتور</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">ورودی</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">خروجی</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">موجودی نهایی</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {cardexData.length > 0 ? (
                        cardexData.map(tx => {
                            const typeInfo = getTransactionTypeInfo(tx);
                            const isIncoming = tx.quantityChange > 0;
                            return (
                                <tr key={tx.id} className="hover:bg-gray-700/70">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 text-center">{new Date(tx.timestamp).toLocaleString('fa-IR')}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${typeInfo.color} text-center`}>{typeInfo.text}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">{tx.invoiceNumber}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-mono text-green-400">{isIncoming ? tx.quantityChange : '-'}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-mono text-red-400">{!isIncoming ? Math.abs(tx.quantityChange) : '-'}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-mono font-bold text-white">{tx.balanceAfter}</td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400">هیچ تراکنشی برای این محصول ثبت نشده است.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">بستن</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardexModal;
