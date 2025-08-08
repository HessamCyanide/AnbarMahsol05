import React from 'react';
import { Product, Tag, Category } from '../types';
import { EditIcon, TrashIcon, FileTextIcon } from './icons';

interface ProductItemProps {
  product: Product;
  tags: Tag[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onShowCardex: (productId: string) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, tags, categories, onEdit, onDelete, onShowCardex }) => {
  const lastUpdatedDate = new Date(product.lastUpdated).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  return (
    <tr className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200 text-center">
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-white align-middle">{product.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300 align-middle">
        {categories.length > 0 ? categories.map(c => c.name).join('، ') : <span className="text-gray-500 text-xs">بدون دسته</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300 align-middle">
        <div className="flex flex-wrap justify-center gap-1">
            {tags.length > 0 ? (
                tags.map(tag => (
                    <span key={tag.id} style={{ backgroundColor: tag.color }} className="px-2 py-1 text-xs rounded-full font-semibold text-black shadow-sm">
                        {tag.name}
                    </span>
                ))
            ) : (
                <span className="text-gray-500 text-xs">بدون تگ</span>
            )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-base font-mono text-white align-middle">{product.quantity}</td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300 align-middle">{lastUpdatedDate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium align-middle">
        <div className="flex justify-center items-center space-x-4 space-x-reverse">
          <button onClick={() => onShowCardex(product.id)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/20 border border-blue-500/30" title="نمایش کاردکس">
            <FileTextIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(product)} className="p-2 text-teal-400 hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-500/20 border border-teal-500/30" title="ویرایش">
            <EditIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20 border border-red-500/30" title="حذف">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductItem;