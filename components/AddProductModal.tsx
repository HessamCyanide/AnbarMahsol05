import React, { useState, useEffect } from 'react';
import { Product, Tag, Category } from '../types';
import { TrashIcon, CalculatorIcon, PencilIcon, CheckIcon, XIcon } from './icons';
import MultiSelect from './MultiSelect';
import CalculatorModal from './CalculatorModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  allProducts: Product[];
  allTags: Tag[];
  allCategories: Category[];
  optionsTags: Tag[];
  optionsCategories: Category[];
  allowedTagPrefixes: string[];
  onSaveTag: (tagName: string) => Promise<Tag>;
  onSaveCategory: (categoryName: string) => Promise<Category>;
  onUpdateTag: (tag: Tag) => Promise<void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteTag: (tagId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ 
    isOpen, onClose, onSave, productToEdit, 
    allProducts, allTags, allCategories,
    optionsTags, optionsCategories, allowedTagPrefixes,
    onSaveTag, onSaveCategory, 
    onUpdateTag, onUpdateCategory,
    onDeleteTag, onDeleteCategory 
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageSection, setShowManageSection] = useState<'tags' | 'categories' | null>(null);
  const [manageTagSearch, setManageTagSearch] = useState('');
  const [manageCategorySearch, setManageCategorySearch] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: 'tag' | 'category', id: string, tempName: string } | null>(null);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (productToEdit) {
            setName(productToEdit.name);
            setQuantity(productToEdit.quantity);
            setTagIds(productToEdit.tagIds || []);
            setCategoryIds(productToEdit.categoryIds || []);
        } else {
            setName('');
            setQuantity(0);
            setTagIds([]);
            setCategoryIds([]);
        }
        setNewTagName('');
        setNewCategoryName('');
        setShowManageSection(null);
        setManageTagSearch('');
        setManageCategorySearch('');
        setEditingItem(null);
        setCalculatorOpen(false);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;
  
  const handleCalculate = (result: number) => {
      setQuantity(result);
      setCalculatorOpen(false);
  };

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (trimmedName === '') return;
    if (allTags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("نام تگ نمی‌تواند خالی یا تکراری باشد.");
      return;
    }
    if (allowedTagPrefixes.length > 0 && !allowedTagPrefixes.some(prefix => trimmedName.toUpperCase().startsWith(prefix))) {
        alert(`نام تگ باید با یکی از پیشوندهای مجاز شما (${allowedTagPrefixes.join(', ')}) شروع شود.`);
        return;
    }

    const newTag = await onSaveTag(trimmedName);
    setTagIds(prev => [...prev, newTag.id]);
    setNewTagName('');
  };
  
  const handleCreateCategory = async () => {
      const trimmedName = newCategoryName.trim();
      if (trimmedName === '') return;
      if (allCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert("نام دسته‌بندی نمی‌تواند خالی یا تکراری باشد.");
        return;
      }
      const newCategory = await onSaveCategory(trimmedName);
      setCategoryIds(prev => [...prev, newCategory.id]);
      setNewCategoryName('');
  }

  const handleConfirmEdit = async () => {
    if (!editingItem || editingItem.tempName.trim() === '') return;
    try {
        if (editingItem.type === 'tag') {
            await onUpdateTag({ id: editingItem.id, name: editingItem.tempName.trim(), color: '' });
        } else {
            await onUpdateCategory({ id: editingItem.id, name: editingItem.tempName.trim() });
        }
        setEditingItem(null);
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === '') {
        alert("نام محصول نمی‌تواند خالی باشد.");
        return;
    }

    const isDuplicate = allProducts.some(
      p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== (productToEdit?.id || '')
    );

    if (isDuplicate) {
        alert("محصولی با این نام از قبل وجود دارد.");
        return;
    }
    
    if (categoryIds.length === 0) {
        alert("انتخاب حداقل یک دسته‌بندی برای محصول الزامی است.");
        return;
    }

    const finalProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: trimmedName,
      quantity: productToEdit ? productToEdit.quantity : quantity,
      lastUpdated: new Date().toISOString(),
      tagIds: tagIds,
      categoryIds: categoryIds,
    };
    onSave(finalProduct);
    onClose();
  };

  const filteredManageTags = allTags.filter(t => t.name.toLowerCase().includes(manageTagSearch.toLowerCase()));
  const filteredManageCategories = allCategories.filter(c => c.name.toLowerCase().includes(manageCategorySearch.toLowerCase()));

  const renderManageSection = () => {
    if (!showManageSection) return null;

    const renderItemRow = (item: Tag | Category, type: 'tag' | 'category') => {
        const isEditing = editingItem?.id === item.id;
        
        if (isEditing) {
            return (
                <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                    <input
                        type="text"
                        value={editingItem.tempName}
                        onChange={(e) => setEditingItem({ ...editingItem, tempName: e.target.value })}
                        className="flex-grow bg-gray-500 rounded-md py-1 px-2 text-white focus:ring-1 focus:ring-teal-400"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
                    />
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={handleConfirmEdit} className="text-green-400 hover:text-green-300 p-1 rounded-full"><CheckIcon className="w-4 h-4"/></button>
                        <button type="button" onClick={() => setEditingItem(null)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><XIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            )
        }
        
        return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-200">{item.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditingItem({ type, id: item.id, tempName: item.name })} className="text-teal-400 hover:text-teal-300 p-1 rounded-full"><PencilIcon className="w-4 h-4"/></button>
                <button type="button" onClick={() => type === 'tag' ? onDeleteTag(item.id) : onDeleteCategory(item.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><TrashIcon className="w-4 h-4"/></button>
              </div>
            </div>
        )
    }

    if (showManageSection === 'tags') {
      return (
        <div className="space-y-3">
          <input type="text" placeholder="جستجوی تگ..." value={manageTagSearch} onChange={e => setManageTagSearch(e.target.value)} className="w-full bg-gray-600 border-gray-500 rounded-md py-1.5 px-3 text-white text-sm focus:ring-1 focus:ring-teal-500"/>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {filteredManageTags.map(tag => renderItemRow(tag, 'tag'))}
          </div>
        </div>
      );
    }

    if (showManageSection === 'categories') {
      return (
        <div className="space-y-3">
          <input type="text" placeholder="جستجوی دسته‌بندی..." value={manageCategorySearch} onChange={e => setManageCategorySearch(e.target.value)} className="w-full bg-gray-600 border-gray-500 rounded-md py-1.5 px-3 text-white text-sm focus:ring-1 focus:ring-teal-500"/>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {filteredManageCategories.map(cat => renderItemRow(cat, 'category'))}
          </div>
        </div>
      );
    }
  };


  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-white pb-3 border-b border-gray-600">{productToEdit ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h2>
          
          <div className="space-y-5 flex-grow overflow-y-auto pr-2 pb-4">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-1">نام محصول</label>
              <input type="text" id="productName" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            {!productToEdit && (
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">تعداد اولیه</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            id="quantity" 
                            value={quantity} 
                            onChange={e => setQuantity(parseInt(e.target.value, 10) || 0)} 
                            min="0" 
                            required
                            lang="en"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md pr-3 pl-10 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        />
                        <button 
                            type="button" 
                            onClick={() => setCalculatorOpen(true)} 
                            className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-teal-400"
                            title="ماشین حساب"
                        >
                            <CalculatorIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">دسته‌بندی‌ها (الزامی)</label>
                 <MultiSelect
                    options={optionsCategories}
                    selectedIds={categoryIds}
                    onChange={setCategoryIds}
                    placeholder="انتخاب دسته‌بندی(ها)"
                />
            </div>
            
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">تگ‌ها (اختیاری)</label>
                <MultiSelect
                    options={optionsTags}
                    selectedIds={tagIds}
                    onChange={setTagIds}
                    placeholder="انتخاب تگ(ها)"
                />
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-teal-400">مدیریت تگ/دسته‌بندی</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <input type="text" placeholder="ایجاد تگ جدید..." value={newTagName} onChange={e => setNewTagName(e.target.value)} className="w-full bg-gray-700/80 rounded-md py-1.5 px-3 text-sm" />
                        <button type="button" onClick={handleCreateTag} className="w-full text-sm py-1.5 bg-blue-600 hover:bg-blue-500 rounded">ایجاد تگ</button>
                     </div>
                     <div className="space-y-2">
                        <input type="text" placeholder="ایجاد دسته‌بندی جدید..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full bg-gray-700/80 rounded-md py-1.5 px-3 text-sm" />
                        <button type="button" onClick={handleCreateCategory} className="w-full text-sm py-1.5 bg-blue-600 hover:bg-blue-500 rounded">ایجاد دسته‌بندی</button>
                     </div>
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setShowManageSection(showManageSection === 'tags' ? null : 'tags')} className={`text-sm ${showManageSection === 'tags' ? 'text-teal-400' : 'text-gray-300'}`}>مدیریت تگ‌ها</button>
                    <button type="button" onClick={() => setShowManageSection(showManageSection === 'categories' ? null : 'categories')} className={`text-sm ${showManageSection === 'categories' ? 'text-teal-400' : 'text-gray-300'}`}>مدیریت دسته‌بندی‌ها</button>
                </div>
                 {renderManageSection()}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
    <CalculatorModal 
        isOpen={isCalculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onCalculate={handleCalculate}
    />
    </>
  );
};

export default AddProductModal;