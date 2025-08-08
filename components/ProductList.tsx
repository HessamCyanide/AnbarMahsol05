import React from 'react';
import { Product, Tag, Category, Permission } from '../types';
import ProductItem from './ProductItem';

interface ProductListProps {
  products: Product[];
  tags: Tag[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onShowCardex: (productId: string) => void;
  onRecount: (product: Product) => void;
  hasPermission: (permission: Permission) => boolean;
}

const ProductList: React.FC<ProductListProps> = ({ products, tags, categories, onEdit, onDelete, onShowCardex, onRecount, hasPermission }) => {
  const tagsMap = new Map(tags.map(t => [t.id, t]));
  const categoriesMap = new Map(categories.map(c => [c.id, c]));

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(180px,auto)] bg-gray-700/50">
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نام محصول</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">دسته‌بندی</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تگ</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تعداد</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">آخرین بروزرسانی</div>
        <div className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">عملیات</div>
      </div>
      
      <div className="md:divide-y md:divide-gray-700">
        {products.length > 0 ? (
          products.map(product => (
            <ProductItem 
                key={product.id} 
                product={product} 
                tags={product.tagIds.map(id => tagsMap.get(id)).filter((t): t is Tag => !!t)}
                categories={product.categoryIds.map(id => categoriesMap.get(id)).filter((c): c is Category => !!c)}
                onEdit={onEdit} 
                onDelete={onDelete}
                onShowCardex={onShowCardex}
                onRecount={onRecount}
                hasPermission={hasPermission}
            />
          ))
        ) : (
          <p className="px-6 py-12 text-center text-gray-400">
            هیچ محصولی یافت نشد. برای شروع یک محصول جدید اضافه کنید.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductList;