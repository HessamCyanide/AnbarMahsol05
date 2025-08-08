

import React from 'react';
import { Product, Tag, Category, Permission } from '../types';
import { PencilIcon, TrashIcon, DocumentChartBarIcon, ClipboardDocumentCheckIcon } from './icons';

interface ProductItemProps {
  product: Product;
  tags: Tag[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onShowCardex: (productId: string) => void;
  onRecount: (product: Product) => void;
  hasPermission: (permission: Permission) => boolean;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, tags, categories, onEdit, onDelete, onShowCardex, onRecount, hasPermission }) => {
  const lastUpdatedDate = new Date(product.lastUpdated).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  return (
    <div className="block md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(180px,auto)] md:items-center hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-700 md:border-none">
      {/* Mobile Card Layout */}
      <div className="p-4 md:hidden">
        <div className="flex justify-between items-start mb-3 gap-2">
            <h3 className="font-bold text-lg text-white break-words flex-1 min-w-0">{product.name}</h3>
            <div className="flex justify-end items-center flex-wrap gap-1">
                <button onClick={() => onShowCardex(product.id)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/20" title="نمایش کاردکس">
                    <DocumentChartBarIcon className="w-5 h-5" />
                </button>
                {hasPermission('CAN_RECOUNT_STOCK') && (
                    <button onClick={() => onRecount(product)} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-cyan-500/20" title="شمارش مجدد">
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    </button>
                )}
                {hasPermission('CAN_EDIT_PRODUCTS') && (
                  <button onClick={() => onEdit(product)} className="p-2 text-teal-400 hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-500/20" title="ویرایش">
                      <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                {hasPermission('CAN_DELETE_PRODUCTS') && (
                  <button onClick={() => onDelete(product.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20" title="حذف">
                      <TrashIcon className="w-5 h-5" />
                  </button>
                )}
            </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
            <div>
                <span className="text-gray-400">تعداد: </span>
                <span className="font-mono font-semibold text-white">{product.quantity.toLocaleString('en-US')}</span>
            </div>
            <div>
                <span className="text-gray-400">دسته‌بندی: </span>
                <span className="text-gray-200">{categories.length > 0 ? categories.map(c => c.name).join('، ') : <span className="text-gray-500">ندارد</span>}</span>
            </div>
            <div className="col-span-2">
                <span className="text-gray-400">آخرین بروزرسانی: </span>
                <span className="text-gray-200">{lastUpdatedDate}</span>
            </div>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
            {tags.length > 0 ? (
                tags.map(tag => (
                    <span key={tag.id} style={{ backgroundColor: tag.color }} className="px-2 py-1 text-xs rounded-full font-semibold text-black shadow-sm">
                        {tag.name}
                    </span>
                ))
            ) : (
                <div className="flex items-center">
                    <span className="text-gray-400 text-sm">تگ: </span>
                    <span className="text-gray-500 text-xs ml-1">بدون تگ</span>
                </div>
            )}
        </div>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden md:block px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-white align-middle">{product.name}</div>
      <div className="hidden md:block px-4 py-3 whitespace-nowrap text-center text-sm text-gray-300 align-middle">
        {categories.length > 0 ? categories.map(c => c.name).join('، ') : <span className="text-gray-500 text-xs">بدون دسته</span>}
      </div>
      <div className="hidden md:block px-4 py-3 whitespace-nowrap text-center text-sm text-gray-300 align-middle">
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
      </div>
      <div className="hidden md:block px-4 py-3 whitespace-nowrap text-center text-base font-mono text-white align-middle">{product.quantity.toLocaleString('en-US')}</div>
      <div className="hidden md:block px-4 py-3 whitespace-nowrap text-center text-sm text-gray-300 align-middle">{lastUpdatedDate}</div>
      <div className="hidden md:flex justify-center items-center space-x-3 space-x-reverse px-4 py-3 whitespace-nowrap text-center text-sm font-medium align-middle">
          <button onClick={() => onShowCardex(product.id)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/20 border border-blue-500/30" title="نمایش کاردکس">
            <DocumentChartBarIcon className="w-4 h-4" />
          </button>
          {hasPermission('CAN_RECOUNT_STOCK') && (
            <button onClick={() => onRecount(product)} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-cyan-500/20 border border-cyan-500/30" title="شمارش مجدد">
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
            </button>
          )}
          {hasPermission('CAN_EDIT_PRODUCTS') && (
            <button onClick={() => onEdit(product)} className="p-2 text-teal-400 hover:text-teal-300 transition-colors rounded-lg hover:bg-teal-500/20 border border-teal-500/30" title="ویرایش">
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {hasPermission('CAN_DELETE_PRODUCTS') && (
            <button onClick={() => onDelete(product.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20 border border-red-500/30" title="حذف">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
      </div>
    </div>
  );
};

export default ProductItem;