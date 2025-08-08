
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Product, Tag, Category, Transaction, TransactionType, InvoiceItem } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import StatCard from './components/StatCard';
import ProductList from './components/ProductList';
import AddProductModal from './components/AddProductModal';
import TransactionModal from './components/TransactionModal';
import TransactionList from './components/TransactionList';
import ExportModal from './components/ExportModal';
import ProductCardexModal from './components/ProductCardexModal';
import ConfirmationModal from './components/ConfirmationModal';
import { LOW_STOCK_THRESHOLD } from './components/constants';
import { PlusIcon, SearchIcon, InventoryIcon, WarningIcon, TagIcon, ClipboardListIcon, DownloadIcon, UploadIcon, EditIcon, TrashIcon } from './components/icons';

type View = 'products' | 'transactions' | 'lowStock';

const generateTagColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
};

const App: React.FC = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('inventory_products_v4', []);
  const [tags, setTags] = useLocalStorage<Tag[]>('inventory_tags_v4', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('inventory_categories_v4', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('inventory_transactions_v4', []);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [cardexModalOpen, setCardexModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [selectedProductIdForCardex, setSelectedProductIdForCardex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<View>('products');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const productsFromStorage: any[] = JSON.parse(localStorage.getItem('inventory_products_v4') || '[]');
    const needsMigration = productsFromStorage.length > 0 && productsFromStorage.some(p => p.hasOwnProperty('tagId') || p.hasOwnProperty('categoryId'));

    if (needsMigration) {
        console.log("Migration needed for multi-tag/category support. Updating data structure.");
        const migratedProducts = productsFromStorage.map(p => {
            const { tagId, categoryId, ...rest } = p;
            const newProduct: Product = {
                ...rest,
                tagIds: p.tagIds || (tagId ? [tagId] : []),
                categoryIds: p.categoryIds || (categoryId ? [categoryId] : [])
            };
            return newProduct;
        });
        setProducts(migratedProducts);
        alert("ساختار داده‌های محصولات برای پشتیبانی از چند تگ/دسته‌بندی به‌روزرسانی شد.");
    }
  }, []); // Run only once on mount

  // Memos for performance
  const tagsMap = useMemo(() => new Map(tags.map(t => [t.id, t.name])), [tags]);
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const productsMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    const sortedProducts = [...products].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    if (!lowercasedFilter) {
        return sortedProducts;
    }
    
    return sortedProducts.filter(product => {
      const tagNames = (product.tagIds || []).map(id => tagsMap.get(id)?.toLowerCase() || '').join(' ');
      const categoryNames = (product.categoryIds || []).map(id => categoriesMap.get(id)?.toLowerCase() || '').join(' ');
      return (
        product.name.toLowerCase().includes(lowercasedFilter) ||
        tagNames.includes(lowercasedFilter) ||
        categoryNames.includes(lowercasedFilter)
      );
    });
  }, [products, searchTerm, tagsMap, categoriesMap]);

  const filteredLowStockProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    const lowStockItems = products.filter(p => p.quantity < LOW_STOCK_THRESHOLD)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    if (!lowercasedFilter) {
        return lowStockItems;
    }

    return lowStockItems.filter(product => {
      const tagNames = (product.tagIds || []).map(id => tagsMap.get(id)?.toLowerCase() || '').join(' ');
      const categoryNames = (product.categoryIds || []).map(id => categoriesMap.get(id)?.toLowerCase() || '').join(' ');
      return (
        product.name.toLowerCase().includes(lowercasedFilter) ||
        tagNames.includes(lowercasedFilter) ||
        categoryNames.includes(lowercasedFilter)
      );
    });
  }, [products, searchTerm, tagsMap, categoriesMap]);

  const dashboardStats = useMemo(() => ({
    totalProductTypes: products.length,
    totalItems: new Intl.NumberFormat('fa-IR').format(products.reduce((acc, p) => acc + p.quantity, 0)),
    lowStockItems: products.filter(p => p.quantity < LOW_STOCK_THRESHOLD).length,
  }), [products]);

  const cardexProduct = useMemo(() => {
    if (!selectedProductIdForCardex) return null;
    return products.find(p => p.id === selectedProductIdForCardex) || null;
  }, [selectedProductIdForCardex, products]);

  // Modal Handlers
  const handleOpenProductModal = useCallback((product: Product | null) => { setProductToEdit(product); setProductModalOpen(true); }, []);
  const handleCloseProductModal = useCallback(() => { setProductToEdit(null); setProductModalOpen(false); }, []);
  const handleShowCardex = useCallback((productId: string) => { setSelectedProductIdForCardex(productId); setCardexModalOpen(true); }, []);
  const handleCloseTransactionModal = useCallback(() => { setTransactionModalOpen(false); }, []);
  
  // Data Manipulation Handlers
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
      const newTransaction: Transaction = { ...tx, id: Date.now().toString(), timestamp: new Date().toISOString() };
      setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [setTransactions]);

  const handleSaveTag = useCallback((tagName: string): Tag => {
    const newTag: Tag = { id: Date.now().toString(), name: tagName, color: generateTagColor() };
    setTags(prev => [...prev, newTag]);
    return newTag;
  }, [setTags]);
  
  const handleDeleteTag = useCallback((tagId: string) => {
      setTags(prev => prev.filter(t => t.id !== tagId));
      setProducts(prev => prev.map(p => ({
        ...p,
        tagIds: (p.tagIds || []).filter(id => id !== tagId)
      })));
  }, [setTags, setProducts]);

  const handleSaveCategory = useCallback((categoryName: string): Category => {
    const newCategory: Category = { id: Date.now().toString(), name: categoryName };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [setCategories]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setProducts(prev => prev.map(p => ({
        ...p,
        categoryIds: (p.categoryIds || []).filter(id => id !== categoryId)
      })));
  }, [setCategories, setProducts]);

  const handleSaveProduct = useCallback((product: Product) => {
    setProducts(prevProducts => {
      const existingIndex = prevProducts.findIndex(p => p.id === product.id);
      if (existingIndex > -1) {
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = product;
        return updatedProducts;
      }
      return [product, ...prevProducts];
    });
  }, [setProducts]);

  const handleDeleteProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setConfirmModalState({
        isOpen: true,
        title: `حذف محصول: ${product.name}`,
        message: (
            <>
                <p>آیا از حذف این محصول اطمینان دارید؟</p>
                <p className="text-sm text-yellow-400 mt-2">توجه: تاریخچه عملیات مربوط به این محصول حذف نخواهد شد.</p>
            </>
        ),
        onConfirm: () => {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    });
  }, [products, setProducts]);

  const handleDeleteTransaction = useCallback((transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const confirmAction = () => {
        setProducts(prev => prev.map(p => {
            if (p.id === transaction.productId) {
                // To revert, we subtract the quantityChange
                return { ...p, quantity: p.quantity - transaction.quantityChange, lastUpdated: new Date().toISOString() };
            }
            return p;
        }));
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };

    const productName = productsMap.get(transaction.productId) || 'محصول حذف شده';

    setConfirmModalState({
        isOpen: true,
        title: 'حذف عملیات',
        message: (
            <>
                <p>آیا از حذف این عملیات ثبت شده برای محصول <span className="font-bold text-teal-400">{productName}</span> اطمینان دارید؟</p>
                <p className="text-sm text-yellow-400 mt-2">توجه: این کار موجودی کالا را برمی‌گرداند و قابل بازگشت نیست.</p>
            </>
        ),
        onConfirm: confirmAction,
    });
  }, [transactions, setTransactions, setProducts, productsMap]);
  
  const handleSaveInvoice = useCallback((
    invoice: { type: TransactionType, invoiceNumber: string, items: InvoiceItem[] }
  ) => {
    const { type, invoiceNumber, items } = invoice;
    const currentProductsMap = new Map(products.map(p => [p.id, p]));

    // --- Pre-flight check for validity ---
    if (type === 'sale') {
      for (const item of items) {
        const product = currentProductsMap.get(item.productId);
        if (!product || product.quantity < item.quantity) {
          alert(`موجودی محصول "${item.productName}" کافی نیست. موجودی فعلی: ${product?.quantity || 0}، درخواست: ${item.quantity}`);
          return; // Abort
        }
      }
    }
    // --- End of pre-flight check ---

    const newTransactions: Omit<Transaction, 'id'|'timestamp'>[] = [];
    const updatedProductsState = [...products];
    const timestamp = new Date().toISOString();

    items.forEach(item => {
        const quantityChange = type === 'purchase' ? item.quantity : -item.quantity;
        
        // Create transaction record
        newTransactions.push({
            productId: item.productId,
            type,
            invoiceNumber,
            quantityChange,
        });

        // Update product quantity
        const productIndex = updatedProductsState.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            updatedProductsState[productIndex] = {
                ...updatedProductsState[productIndex],
                quantity: updatedProductsState[productIndex].quantity + quantityChange,
                lastUpdated: timestamp
            };
        }
    });

    setProducts(updatedProductsState);
    
    const transactionsToCommit: Transaction[] = newTransactions.map(tx => ({
        ...tx,
        id: `${Date.now()}-${Math.random()}`,
        timestamp
    }));

    setTransactions(prev => [...transactionsToCommit, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    
    handleCloseTransactionModal();

  }, [products, setProducts, setTransactions, handleCloseTransactionModal]);

  const handleExport = useCallback((options: { dataType: 'products' | 'transactions' | 'lowStock', columns: { [key: string]: boolean }}) => {
    const { dataType, columns } = options;
    let dataToExport: any[] = [];
    const headers: { [key: string]: string } = {};

    if (dataType === 'products' || dataType === 'lowStock') {
        const productHeaders = { id: 'ID', name: 'نام محصول', categoryName: 'دسته‌بندی', tagName: 'تگ', quantity: 'تعداد', lastUpdated: 'آخرین بروزرسانی' };
        Object.keys(columns).filter(k => columns[k]).forEach(k => headers[k] = productHeaders[k]);
        
        const productsToExport = dataType === 'products'
          ? filteredProducts
          : products.filter(p => p.quantity < LOW_STOCK_THRESHOLD);
        
        dataToExport = productsToExport.map(p => ({
            id: p.id,
            name: p.name,
            categoryName: (p.categoryIds || []).map(id => categoriesMap.get(id)).filter(Boolean).join('، ') || 'ندارد',
            tagName: (p.tagIds || []).map(id => tagsMap.get(id)).filter(Boolean).join('، ') || 'ندارد',
            quantity: p.quantity,
            lastUpdated: new Date(p.lastUpdated).toLocaleString('fa-IR'),
        }));

    } else { // transactions
        const txHeaders = { productName: 'نام محصول', type: 'نوع عملیات', invoiceNumber: 'شماره فاکتور', quantityChange: 'تغییر تعداد', timestamp: 'تاریخ و زمان'};
        Object.keys(columns).filter(k => columns[k]).forEach(k => headers[k] = txHeaders[k]);

        dataToExport = transactions.map(t => ({
            productName: productsMap.get(t.productId) || 'محصول حذف شده',
            type: { purchase: 'ورود', sale: 'خروج', adjustment: 'اصلاح دستی' }[t.type],
            invoiceNumber: t.invoiceNumber,
            quantityChange: t.quantityChange,
            timestamp: new Date(t.timestamp).toLocaleString('fa-IR'),
        }));
    }

    const finalData = dataToExport.map(row => {
        const newRow = {};
        Object.keys(headers).forEach(key => {
            newRow[headers[key]] = row[key];
        });
        return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش');
    XLSX.writeFile(workbook, `گزارش_انبار_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`);
    setExportModalOpen(false);
  }, [filteredProducts, products, transactions, categoriesMap, tagsMap, productsMap]);
  
    const handleSaveBackup = () => {
        const backupData = {
            products,
            tags,
            categories,
            transactions,
            version: '4.2-fixes' 
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("آیا مطمئن هستید؟ با بازیابی پشتیبان، تمام اطلاعات فعلی شما پاک خواهد شد.")) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                const data = JSON.parse(text);

                if (data && typeof data === 'object') {
                    // Migration from old single tag/category format if needed
                    const productsToMigrate = data.products ?? [];
                    const migratedProducts = productsToMigrate.map(p => {
                       if (p.hasOwnProperty('tagId') || p.hasOwnProperty('categoryId')) {
                           const { tagId, categoryId, ...rest } = p;
                            return {
                                ...rest,
                                tagIds: p.tagIds || (tagId ? [tagId] : []),
                                categoryIds: p.categoryIds || (categoryId ? [categoryId] : [])
                            };
                       }
                       return p;
                    });

                    setProducts(migratedProducts);
                    setTags(data.tags ?? []);
                    setCategories(data.categories ?? []);
                    setTransactions(data.transactions ?? []);
                    alert("پشتیبان با موفقیت بازیابی شد.");
                } else {
                    throw new Error("فایل پشتیبان نامعتبر است یا فرمت درستی ندارد.");
                }
            } catch (error) {
                console.error("Failed to load backup:", error);
                alert("خطا در بازیابی فایل پشتیبان. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.");
            } finally {
                // Reset file input to allow re-uploading the same file
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    }


  const searchPlaceholder = {
    products: "جستجو بر اساس نام محصول، تگ یا دسته‌بندی...",
    transactions: "جستجو در تاریخچه عملیات...",
    lowStock: "جستجو در کالاهای ته انباری...",
  }[currentView];

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-white">سیستم مدیریت انبار محصول (05)</h1>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                 <input type="file" accept=".json" onChange={handleLoadBackup} ref={fileInputRef} className="hidden" />
                 <button onClick={triggerFileInput} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg transition-transform transform hover:scale-105 text-sm">
                    <UploadIcon className="w-4 h-4"/><span>بازیابی</span>
                 </button>
                 <button onClick={handleSaveBackup} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg transition-transform transform hover:scale-105 text-sm">
                    <DownloadIcon className="w-4 h-4"/><span>پشتیبان</span>
                 </button>
                 <button onClick={() => setExportModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-lg transition-transform transform hover:scale-105 text-sm">
                    <DownloadIcon className="w-4 h-4"/><span>اکسل</span>
                 </button>
                 <button onClick={() => setTransactionModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <ClipboardListIcon className="w-5 h-5"/><span>ثبت عملیات</span>
                 </button>
                <button onClick={() => handleOpenProductModal(null)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                  <PlusIcon className="w-5 h-5"/><span>افزودن محصول</span>
                </button>
            </div>
          </header>

          <main>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="انواع محصول" value={dashboardStats.totalProductTypes} icon={<TagIcon className="w-8 h-8"/>} colorClass="bg-blue-500/80" />
                <StatCard title="تعداد کل کالاها" value={dashboardStats.totalItems} icon={<InventoryIcon />} colorClass="bg-green-500/80" />
                <StatCard title="کالاهای ته انباری" value={dashboardStats.lowStockItems} icon={<WarningIcon />} colorClass="bg-yellow-500/80" />
            </div>
            
            <div className="mb-6">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setCurrentView('products')} className={`py-2 px-4 text-sm font-medium ${currentView === 'products' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>محصولات</button>
                    <button onClick={() => setCurrentView('transactions')} className={`py-2 px-4 text-sm font-medium ${currentView === 'transactions' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>تاریخچه عملیات</button>
                    <button onClick={() => setCurrentView('lowStock')} className={`py-2 px-4 text-sm font-medium ${currentView === 'lowStock' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>کالاهای ته انباری</button>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md pr-10 pl-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-400" />
                    </div>
                </div>
            </div>

            {currentView === 'products' ? (
                <ProductList 
                  products={filteredProducts} 
                  tags={tags}
                  categories={categories}
                  onEdit={handleOpenProductModal} 
                  onDelete={handleDeleteProduct} 
                  onShowCardex={handleShowCardex}
                />
            ) : currentView === 'transactions' ? (
                <TransactionList 
                    transactions={transactions} 
                    productsMap={productsMap} 
                    searchTerm={searchTerm}
                    onDelete={handleDeleteTransaction}
                />
            ) : (
                <ProductList 
                    products={filteredLowStockProducts}
                    tags={tags}
                    categories={categories}
                    onEdit={handleOpenProductModal}
                    onDelete={handleDeleteProduct}
                    onShowCardex={handleShowCardex}
                />
            )}
          </main>
        </div>
      </div>

      <AddProductModal 
        isOpen={productModalOpen} 
        onClose={handleCloseProductModal} 
        onSave={handleSaveProduct}
        productToEdit={productToEdit} 
        products={products}
        tags={tags}
        categories={categories}
        onSaveTag={handleSaveTag}
        onSaveCategory={handleSaveCategory}
        onDeleteTag={handleDeleteTag}
        onDeleteCategory={handleDeleteCategory}
      />
      
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleSaveInvoice}
        products={products}
        tagsMap={tagsMap}
        categoriesMap={categoriesMap}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
      />

      {cardexProduct && (
        <ProductCardexModal
            isOpen={cardexModalOpen}
            onClose={() => setCardexModalOpen(false)}
            product={cardexProduct}
            transactions={transactions.filter(t => t.productId === selectedProductIdForCardex)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
       />
    </>
  );
};

export default App;