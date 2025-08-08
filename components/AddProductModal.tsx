import React, { useState, useEffect } from 'react';
import { Product, Tag, Category } from '../types';
import { TrashIcon } from './icons';
import MultiSelect from './MultiSelect';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  products: Product[];
  tags: Tag[];
  categories: Category[];
  onSaveTag: (tagName: string) => Tag;
  onSaveCategory: (categoryName: string) => Category;
  onDeleteTag: (tagId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ 
    isOpen, onClose, onSave, productToEdit, products,
    tags, categories, 
    onSaveTag, onSaveCategory, 
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
  const [itemToDelete, setItemToDelete] = useState<{ type: 'tag' | 'category', id: string } | null>(null);

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
        setItemToDelete(null); 
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCreateTag = () => {
    if (newTagName.trim() === '' || tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      alert("نام تگ نمی‌تواند خالی یا تکراری باشد.");
      return;
    }
    const newTag = onSaveTag(newTagName.trim());
    setTagIds(prev => [...prev, newTag.id]);
    setNewTagName('');
  };
  
  const handleCreateCategory = () => {
      if (newCategoryName.trim() === '' || categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        alert("نام دسته‌بندی نمی‌تواند خالی یا تکراری باشد.");
        return;
      }
      const newCategory = onSaveCategory(newCategoryName.trim());
      setCategoryIds(prev => [...prev, newCategory.id]);
      setNewCategoryName('');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === '') {
        alert("نام محصول نمی‌تواند خالی باشد.");
        return;
    }

    const isDuplicate = products.some(
      p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== (productToEdit?.id || '')
    );

    if (isDuplicate) {
        alert("محصولی با این نام از قبل وجود دارد.");
        return;
    }

    const finalProduct: Product = {
      id: productToEdit ? productToEdit.id : Date.now().toString(),
      lastUpdated: new Date().toISOString(),
      name: trimmedName,
      quantity,
      tagIds,
      categoryIds,
    };
    
    onSave(finalProduct);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    const { type, id } = itemToDelete;

    if (type === 'tag') {
        setTagIds(prev => prev.filter(tagId => tagId !== id));
        onDeleteTag(id);
    } else {
        setCategoryIds(prev => prev.filter(catId => catId !== id));
        onDeleteCategory(id);
    }
    setItemToDelete(null); 
  };

  const renderManagementList = (type: 'tags' | 'categories') => {
    const items = type === 'tags' ? tags : categories;
    const title = type === 'tags' ? 'مدیریت تگ‌ها' : 'مدیریت دسته‌بندی‌ها';
    const searchTerm = type === 'tags' ? manageTagSearch : manageCategorySearch;
    const setSearchTerm = type === 'tags' ? setManageTagSearch : setManageCategorySearch;

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-200 mb-3">{title}</h4>
            
            <div className="mb-3">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
            
            <ul className="space-y-2 max-h-40 overflow-y-auto">
                {filteredItems.map(item => {
                  const isPendingDelete = itemToDelete?.type === (type === 'tags' ? 'tag' : 'category') && itemToDelete?.id === item.id;
                  
                  return (
                    <li key={item.id} className="flex justify-between items-center bg-gray-600/50 p-2 rounded-md transition-all duration-200">
                        <span className="text-sm text-white">{item.name}</span>
                        {isPendingDelete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400">حذف شود؟</span>
                            <button type="button" onClick={handleConfirmDelete} className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-500 rounded text-white font-bold">بله</button>
                            <button type="button" onClick={() => setItemToDelete(null)} className="px-2 py-0.5 text-xs bg-gray-500 hover:bg-gray-400 rounded text-white">خیر</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setItemToDelete({ type: type === 'tags' ? 'tag' : 'category', id: item.id })} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/20 transition-colors">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                    </li>
                  );
                })}
                {filteredItems.length === 0 && <li className="text-center text-xs text-gray-400">موردی یافت نشد.</li>}
            </ul>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[95vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">{productToEdit ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">نام محصول</label>
              <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-1">دسته‌بندی‌ها</label>
                     <MultiSelect
                        options={categories}
                        selectedIds={categoryIds}
                        onChange={setCategoryIds}
                        placeholder="انتخاب دسته‌بندی"
                     />
                    <div className="flex gap-2 mt-2">
                        <input type="text" placeholder="ایجاد دسته‌بندی جدید..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"/>
                        <button type="button" onClick={handleCreateCategory} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors shrink-0">افزودن</button>
                    </div>
                     <button type="button" onClick={() => setShowManageSection(showManageSection === 'categories' ? null : 'categories')} className="text-xs text-teal-400 hover:text-teal-300 mt-2">مدیریت دسته‌بندی‌ها</button>
                     {showManageSection === 'categories' && renderManagementList('categories')}
                </div>
                <div>
                    <label htmlFor="tagId" className="block text-sm font-medium text-gray-300 mb-1">تگ‌ها</label>
                     <MultiSelect
                        options={tags}
                        selectedIds={tagIds}
                        onChange={setTagIds}
                        placeholder="انتخاب تگ"
                     />
                    <div className="flex gap-2 mt-2">
                        <input type="text" placeholder="ایجاد تگ جدید..." value={newTagName} onChange={e => setNewTagName(e.target.value)} className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"/>
                        <button type="button" onClick={handleCreateTag} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors shrink-0">افزودن</button>
                    </div>
                    <button type="button" onClick={() => setShowManageSection(showManageSection === 'tags' ? null : 'tags')} className="text-xs text-teal-400 hover:text-teal-300 mt-2">مدیریت تگ‌ها</button>
                    {showManageSection === 'tags' && renderManagementList('tags')}
                </div>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">تعداد اولیه</label>
              <input 
                type="number" 
                id="quantity" 
                value={quantity} 
                onChange={e => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                min="0"
                required
                disabled={!!productToEdit}
                className={`w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${productToEdit ? 'cursor-not-allowed bg-gray-600' : ''}`}
              />
               {productToEdit && <p className="text-xs text-gray-400 mt-1">تعداد محصول فقط از طریق ثبت عملیات (ورود/خروج) قابل تغییر است.</p>}
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">{productToEdit ? 'ذخیره تغییرات' : 'افزودن'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;