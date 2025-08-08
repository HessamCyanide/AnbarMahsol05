import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface RecountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { newQuantity: number; notes: string }) => void;
  product: Product;
}

const RecountModal: React.FC<RecountModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
  const [newQuantity, setNewQuantity] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setNewQuantity(String(product.quantity));
      setNotes('');
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numQuantity = parseInt(newQuantity, 10);
    if (isNaN(numQuantity) || numQuantity < 0) {
      setError('مقدار جدید باید یک عدد صحیح و غیرمنفی باشد.');
      return;
    }
    if (notes.trim() === '') {
        setError('برای ثبت شمارش مجدد، نوشتن یادداشت الزامی است.');
        return;
    }
    onConfirm({ newQuantity: numQuantity, notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-white pb-3 border-b border-gray-600">شمارش مجدد انبار</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">محصول</label>
              <p className="text-lg text-white font-semibold">{product.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">موجودی فعلی ثبت شده</label>
              <p className="text-lg font-mono font-semibold text-yellow-400">{product.quantity.toLocaleString('en-US')}</p>
            </div>
            <div>
              <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-300 mb-1">موجودی جدید (شمارش شده)</label>
              <input 
                type="number" 
                id="newQuantity" 
                value={newQuantity} 
                onChange={e => setNewQuantity(e.target.value)}
                min="0"
                required 
                autoFocus
                lang="en"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono" 
              />
            </div>
             <div>
                <label htmlFor="recountNotes" className="block text-sm font-medium text-gray-300 mb-1">یادداشت (علت شمارش مجدد)</label>
                <input 
                    type="text" 
                    id="recountNotes" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    required 
                    placeholder="مثلا: انبارگردانی پایان سال ۱۴۰۲"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="mt-8 flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">ثبت موجودی جدید</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecountModal;