
import React, { useState, useEffect, useMemo } from 'react';
import { Product, TransactionType, InvoiceItem } from '../types';
import { SearchIcon, TrashIcon } from './icons';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: { type: TransactionType, invoiceNumber: string, items: InvoiceItem[] }) => void;
  products: Product[]; // Now receives visibleProducts
  tagsMap: Map<string, string>;
  categoriesMap: Map<string, string>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, products, tagsMap, categoriesMap }) => {
  const [type, setType] = useState<TransactionType>('sale');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open for new transaction
      setType('sale');
      setInvoiceNumber('');
      setItems([]);
      setProductSearch('');
      setSelectedProductId(null);
      setCurrentQuantity(1);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = productSearch.toLowerCase().trim();
    if (!lowercasedFilter) return products; // Search within allowed products
    return products.filter(product => {
      const tagNames = (product.tagIds || []).map(id => tagsMap.get(id)?.toLowerCase() || '').join(' ');
      const categoryNames = (product.categoryIds || []).map(id => categoriesMap.get(id)?.toLowerCase() || '').join(' ');
      return (
        product.name.toLowerCase().includes(lowercasedFilter) ||
        tagNames.includes(lowercasedFilter) ||
        categoryNames.includes(lowercasedFilter)
      );
    });
  }, [products, productSearch, tagsMap, categoriesMap]);
  
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);


  const handleAddItem = () => {
    if (!selectedProduct || currentQuantity <= 0) {
      alert("لطفاً یک محصول را انتخاب کرده و تعداد معتبری وارد کنید.");
      return;
    }
    
    if (type === 'sale' && selectedProduct.quantity < currentQuantity) {
        alert(`موجودی محصول "${selectedProduct.name}" کافی نیست. موجودی فعلی: ${selectedProduct.quantity}`);
        return;
    }
    
    setItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.productId === selectedProduct.id);
        if (existingItemIndex > -1) {
            const updatedItems = [...prevItems];
            const newQuantity = updatedItems[existingItemIndex].quantity + currentQuantity;
            
            if (type === 'sale' && selectedProduct.quantity < newQuantity) {
                alert(`موجودی محصول "${selectedProduct.name}" برای افزودن این تعداد کافی نیست. موجودی فعلی: ${selectedProduct.quantity}, تعداد در فاکتور: ${newQuantity}`);
                return prevItems; // Do not update
            }
            updatedItems[existingItemIndex].quantity = newQuantity;
            return updatedItems;
        } else {
            return [...prevItems, {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                quantity: currentQuantity,
                currentStock: selectedProduct.quantity,
            }];
        }
    });

    // Reset inputs
    setSelectedProductId(null);
    setProductSearch('');
    setCurrentQuantity(1);
  };
  
  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if(type === 'sale' && product && product.quantity < newQuantity){
        alert(`موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${product.quantity}`);
        return; // do not update
    }

    setItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  };
  
  const handleRemoveItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };
  
  const handleProceedToConfirm = () => {
    if (items.length === 0) {
        alert("لطفا حداقل یک کالا به فاکتور اضافه کنید.");
        return;
    }
    setIsConfirming(true);
  };
  
  const handleFinalSubmit = () => {
    onSave({
      type,
      invoiceNumber: invoiceNumber.trim() || (type === 'purchase' ? 'ورود عمومی' : 'خروج عمومی'),
      items
    });
  };

  if (!isOpen) return null;

  const renderItemList = (isConfirmationView: boolean) => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg max-h-56 overflow-y-auto">
      {items.length > 0 ? (
        <div className="divide-y divide-gray-700">
          {items.map(item => (
            <div key={item.productId} className="flex justify-between items-center p-2 sm:p-3">
              <span className="text-sm text-white flex-1 truncate pr-2">{item.productName}</span>
              <div className="flex items-center">
                {isConfirmationView ? (
                  <span className="w-20 sm:w-24 text-center font-mono text-white">{item.quantity.toLocaleString('en-US')}</span>
                ) : (
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={e => handleUpdateItemQuantity(item.productId, parseInt(e.target.value, 10) || 1)}
                    className="w-16 sm:w-20 bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-white text-center focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                )}
                {!isConfirmationView && (
                  <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-400 p-1 mr-1 sm:mr-2">
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-6 text-center text-sm text-gray-400">هنوز کالایی به فاکتور اضافه نشده است.</p>
      )}
    </div>
  );
  

  const renderForm = () => (
    <div className="flex-grow flex flex-col overflow-hidden">
        <div className="space-y-4 flex-grow overflow-y-auto pr-2 pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">نوع عملیات</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button type="button" onClick={() => setType('sale')} className={`w-full py-2 rounded-md transition-colors ${type === 'sale' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  خروج کالا
                </button>
                <button type="button" onClick={() => setType('purchase')} className={`w-full py-2 rounded-md transition-colors ${type === 'purchase' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  ورود کالا
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-300 mb-1">نام مشتری / شماره فاکتور</label>
              <input 
                type="text" 
                id="invoiceNumber" 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)} 
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                placeholder={type === 'purchase' ? 'مثلا: ورود از تولید 4632' : 'مثلا: دفتر گیلان 4356'}
              />
            </div>
            
            <fieldset className="border border-gray-600 p-4 rounded-lg">
                <legend className="px-2 text-sm font-medium text-teal-400">افزودن کالا به فاکتور</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="productSearch" className="block text-sm font-medium text-gray-300 mb-1">جستجو و انتخاب محصول</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="productSearch"
                                placeholder="نام، تگ یا دسته‌بندی..."
                                value={productSearch}
                                onChange={e => {setProductSearch(e.target.value); setSelectedProductId(null);}}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md pr-10 pl-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon className="text-gray-400" /></div>
                        </div>
                        {productSearch && (
                            <div className="mt-2 bg-gray-900/50 border border-gray-700 rounded-md max-h-40 overflow-y-auto">
                                {filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); }}
                                        className={`p-2 cursor-pointer transition-colors ${selectedProductId === p.id ? 'bg-teal-600 text-white' : 'hover:bg-gray-700'} border-b border-gray-700 last:border-b-0`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{p.name}</span>
                                            <span className={`text-xs font-mono ${selectedProductId === p.id ? 'text-teal-200' : 'text-gray-400'}`}>
                                                موجودی: {p.quantity.toLocaleString('en-US')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && <p className="p-2 text-center text-sm text-gray-400">محصولی یافت نشد.</p>}
                            </div>
                        )}
                    </div>
                    <div className="flex items-end gap-2 sm:gap-4">
                        <div className="flex-1">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">تعداد</label>
                            <input type="number" id="quantity" value={currentQuantity} onChange={e => setCurrentQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" required 
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono" />
                        </div>
                        <button type="button" onClick={handleAddItem} disabled={!selectedProductId} className="px-4 sm:px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">افزودن</button>
                    </div>
                </div>
            </fieldset>

            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">اقلام فاکتور جاری</h3>
                {renderItemList(false)}
            </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="button" onClick={handleProceedToConfirm} className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors" disabled={items.length === 0}>ادامه و تایید</button>
        </div>
    </div>
  );
  
  const renderConfirmation = () => (
    <div className="flex-grow flex flex-col overflow-hidden">
        <div className="space-y-4 flex-grow overflow-y-auto pr-2 pb-4">
            <h3 className="text-xl font-bold text-yellow-400">لطفا فاکتور را بازبینی و تایید کنید</h3>
            <div className="space-y-1 text-gray-300">
              <p><strong>نوع عملیات:</strong> <span className={type === 'sale' ? 'text-red-400' : 'text-green-400'}>{type === 'sale' ? 'خروج' : 'ورود'}</span></p>
              <p><strong>نام مشتری / شماره فاکتور:</strong> {invoiceNumber || (type === 'purchase' ? 'ورود عمومی' : 'خروج عمومی')}</p>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-200 pt-3 border-t border-gray-600">اقلام فاکتور</h4>
            {renderItemList(true)}
            <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm">
                توجه: پس از تایید، موجودی انبار برای تمامی اقلام بالا بروزرسانی خواهد شد. این عملیات قابل بازگشت نیست (مگر با حذف تک تک تراکنش‌ها).
            </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-700">
            <button type="button" onClick={() => setIsConfirming(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">بازگشت و ویرایش</button>
            <button type="button" onClick={handleFinalSubmit} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors">تایید نهایی و ثبت فاکتور</button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[95vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-white pb-3 border-b border-gray-600">ثبت فاکتور جدید</h2>
        {isConfirming ? renderConfirmation() : renderForm()}
      </div>
    </div>
  );
};

export default TransactionModal;