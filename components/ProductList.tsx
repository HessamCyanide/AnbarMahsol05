import React from 'react';
import { Product, Tag, Category } from '../types';
import ProductItem from './ProductItem';

interface ProductListProps {
  products: Product[];
  tags: Tag[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onShowCardex: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, tags, categories, onEdit, onDelete, onShowCardex }) => {
  const tagsMap = new Map(tags.map(t => [t.id, t]));
  const categoriesMap = new Map(categories.map(c => [c.id, c]));

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr className="text-center">
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">نام محصول</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">دسته‌بندی</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تگ</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">تعداد</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">آخرین بروزرسانی</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
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
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  هیچ محصولی یافت نشد. برای شروع یک محصول جدید اضافه کنید.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;