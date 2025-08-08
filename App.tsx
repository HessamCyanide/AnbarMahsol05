
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Product, Tag, Category, Transaction, TransactionType, InvoiceItem, User, Permission, Log } from './types';
import useDatabase from './hooks/useDatabase';
import StatCard from './components/StatCard';
import ProductList from './components/ProductList';
import AddProductModal from './components/AddProductModal';
import TransactionModal from './components/TransactionModal';
import TransactionList from './components/TransactionList';
import ExportModal from './components/ExportModal';
import ProductCardexModal from './components/ProductCardexModal';
import ConfirmationModal from './components/ConfirmationModal';
import Login from './components/Login';
import UserManagementModal from './components/UserManagementModal';
import ProfileModal from './components/ProfileModal';
import RecountModal from './components/RecountModal';
import Clock from './components/Clock';
import AutoBackupIndicator from './components/AutoBackupIndicator';
import { LOW_STOCK_THRESHOLD, INACTIVITY_LOGOUT_TIME } from './constants';
import { PlusIcon, SearchIcon, InventoryIcon, WarningIcon, TagIcon, ClipboardListIcon, UploadIcon, ArchiveBoxXMarkIcon, UserGroupIcon, LogoutIcon, UserCircleIcon, DotsVerticalIcon, ChevronDownIcon, DocumentChartBarIcon, PencilIcon, TableCellsIcon, ArchiveBoxArrowDownIcon, ArchiveBoxArrowUpIcon } from './components/icons';

type View = 'products' | 'transactions' | 'lowStock' | 'finished' | 'logs';

// --- ACTION TRANSLATIONS FOR LOGS ---
const ACTION_TRANSLATIONS: { [key: string]: string } = {
  CREATE_PRODUCT: 'ایجاد محصول',
  UPDATE_PRODUCT: 'ویرایش محصول',
  DELETE_PRODUCT: 'حذف محصول',
  CREATE_INVOICE_PURCHASE: 'ثبت فاکتور ورود',
  CREATE_INVOICE_SALE: 'ثبت فاکتور خروج',
  DELETE_TRANSACTION: 'حذف عملیات',
  UPDATE_TRANSACTION: 'ویرایش عملیات',
  CREATE_USER: 'ایجاد کاربر',
  UPDATE_USER: 'ویرایش کاربر',
  DELETE_USER: 'حذف کاربر',
  UPDATE_PROFILE: 'ویرایش پروفایل',
  DB_BACKUP: 'دریافت پشتیبان',
  DB_RESTORE: 'بازیابی پشتیبان',
  UPDATE_TAG: 'ویرایش تگ',
  UPDATE_CATEGORY: 'ویرایش دسته‌بندی',
  RECOUNT_STOCK: 'شمارش مجدد انبار',
};


// --- ACTIVITY LOG COMPONENT ---
interface ActivityLogProps {
  logs: Log[];
}
const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        if (!lowercasedFilter) return logs;
        
        return logs.filter(log =>
            log.username.toLowerCase().includes(lowercasedFilter) ||
            log.action.toLowerCase().includes(lowercasedFilter) ||
            (ACTION_TRANSLATIONS[log.action] || '').toLowerCase().includes(lowercasedFilter) ||
            log.details.toLowerCase().includes(lowercasedFilter)
        );
    }, [logs, searchTerm]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-700/50">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="جستجو در گزارشات (بر اساس کاربر، عملیات یا جزئیات)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md pr-10 pl-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-400" />
                    </div>
                </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                        <div key={log.id} className="p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="font-semibold text-white">
                                    <span className="text-teal-400">{log.username}</span>
                                    <span className="text-gray-400 font-normal mx-2">-</span>
                                    <span>{ACTION_TRANSLATIONS[log.action] || log.action}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(log.timestamp).toLocaleString('fa-IR')}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-300">{log.details}</p>
                        </div>
                    ))
                ) : (
                    <p className="px-6 py-12 text-center text-gray-400">
                        هیچ گزارشی یافت نشد.
                    </p>
                )}
            </div>
        </div>
    );
};


// --- EDIT TRANSACTION MODAL ---
interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { quantityChange: number; invoiceNumber: string; }) => void;
  transaction: Transaction;
  productName: string;
}
const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, onSave, transaction, productName }) => {
  const [quantity, setQuantity] = useState('1');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setQuantity(String(Math.abs(transaction.quantityChange)));
      setInvoiceNumber(transaction.invoiceNumber);
      setError('');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
        setError('تعداد وارد شده باید یک عدد مثبت و بزرگتر از صفر باشد.');
        return;
    }

    const finalQuantityChange = transaction.type === 'sale' ? -numQuantity : numQuantity;
    onSave({ quantityChange: finalQuantityChange, invoiceNumber });
  };
  
  const { type } = transaction;
  const transactionTypeInfo = {
    purchase: { text: 'ورود', color: 'text-green-400' },
    sale: { text: 'خروج', color: 'text-red-400' },
    adjustment: { text: 'اصلاح دستی', color: 'text-yellow-400' },
    recount: { text: 'شمارش مجدد', color: 'text-cyan-400' },
  }[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-white pb-3 border-b border-gray-600">ویرایش عملیات</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">محصول</label>
              <p className="text-lg text-white font-semibold">{productName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">نوع عملیات</label>
               <p className={`text-lg font-semibold ${transactionTypeInfo.color}`}>{transactionTypeInfo.text} (غیرقابل تغییر)</p>
            </div>
            <div>
                <label htmlFor="editInvoiceNumber" className="block text-sm font-medium text-gray-300 mb-1">نام مشتری / شماره فاکتور</label>
                <input type="text" id="editInvoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-300 mb-1">تعداد</label>
              <input 
                type="number" 
                id="editQuantity" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                min="1"
                required 
                lang="en"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono" 
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="mt-8 flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">ذخیره تغییرات</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const { db, loading, exportDatabase, importDatabase, refreshData } = useDatabase();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLogs, setAllLogs] = useState<Log[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [cardexModalOpen, setCardexModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [recountModalOpen, setRecountModalOpen] = useState(false);

  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [productToRecount, setProductToRecount] = useState<Product | null>(null);

  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; confirmVariant?: 'primary' | 'danger' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedProductIdForCardex, setSelectedProductIdForCardex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<View>('products');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (db) {
        refreshAllData();
    }
  }, [db]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inactivity Logout Effect
  useEffect(() => {
    if (!currentUser) {
        return;
    }

    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            handleLogout(true); // Auto-logout
        }, INACTIVITY_LOGOUT_TIME);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
        clearTimeout(inactivityTimer);
        events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser]);

  const refreshAllData = useCallback(async () => {
    if (!db) return;
    const allData = await db.getAllData();
    setAllProducts(allData.products);
    setAllTags(allData.tags);
    setAllCategories(allData.categories);
    setAllTransactions(allData.transactions);
    setAllUsers(allData.users);
    setAllLogs(allData.logs);
  }, [db]);
  

  const hasPermission = useCallback((permission: Permission): boolean => {
    return currentUser?.permissions.includes(permission) ?? false;
  }, [currentUser]);

  const handleLogin = async (username: string, password: string) => {
    if (!db) return;
    const user = await db.checkUserCredentials(username, password);
    if (user) {
        setCurrentUser(user);
        setLoginError('');
        setCurrentView('products');
    } else {
        setLoginError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  const handleLogout = (isAutoLogout = false) => {
    if (isAutoLogout) {
        setCurrentUser(null);
        return;
    }
    setConfirmModalState({
        isOpen: true,
        title: 'خروج از حساب کاربری',
        message: 'آیا برای خروج از حساب کاربری خود اطمینان دارید؟',
        onConfirm: () => setCurrentUser(null),
        confirmText: 'خروج',
        confirmVariant: 'danger',
    });
  };

  const handleOpenUserModal = (user: User | null = null) => {
    setUserToEdit(user);
    setUserModalOpen(true);
  };
  
  const handleSaveUser = async (user: User) => {
    if(!db || !currentUser) return;
    const isEditing = !!user.id;
    await db.saveUser(user);
    await db.logAction(
      isEditing ? 'UPDATE_USER' : 'CREATE_USER',
      `User "${user.username}" was ${isEditing ? `updated by ${currentUser.username}` : `created by ${currentUser.username}`}.`,
      currentUser
    );
    await refreshAllData();
    
    if (currentUser?.id === user.id && isEditing) {
        const updatedCurrentUser = await db.getUserById(user.id);
        if(updatedCurrentUser) setCurrentUser(updatedCurrentUser);
    }

    setUserToEdit(null);
    setUserModalOpen(false);
  };

  const handleSaveProfile = async (currentPassword: string, newUsername: string, newPassword: string, profilePicture: string | null | undefined) => {
    if (!db || !currentUser) return;
    try {
        const updatedUser = await db.updateAccount(currentUser.id, currentPassword, newUsername, newPassword, profilePicture);
        if (updatedUser) {
            await db.logAction(
                'UPDATE_PROFILE',
                `User "${currentUser.username}" updated their own profile.`,
                currentUser
            );
            setCurrentUser(updatedUser);
            setProfileModalOpen(false);
            alert("اطلاعات کاربری با موفقیت بروزرسانی شد.");
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
      if (!db || !currentUser) return;
      if (userId === currentUser?.id) {
          alert("شما نمی‌توانید حساب کاربری خود را حذف کنید.");
          return;
      }
      const userToDelete = allUsers.find(u => u.id === userId);
      await db.deleteUser(userId);
      if(userToDelete) {
        await db.logAction('DELETE_USER', `User "${userToDelete.username}" was deleted by ${currentUser.username}.`, currentUser);
      }
      await refreshAllData();
  };

  const allTagsMap = useMemo(() => new Map(allTags.map(t => [t.id, t.name])), [allTags]);
  const allCategoriesMap = useMemo(() => new Map(allCategories.map(c => [c.id, c.name])), [allCategories]);
  const allProductsMap = useMemo(() => new Map(allProducts.map(p => [p.id, p.name])), [allProducts]);

  const isRestrictedUser = useMemo(() =>
      (currentUser?.allowedCategoryIds?.length ?? 0) > 0 ||
      (currentUser?.allowedTagPrefixes?.length ?? 0) > 0,
      [currentUser]
  );
  const userAllowedCats = useMemo(() => new Set(currentUser?.allowedCategoryIds || []), [currentUser]);
  const userAllowedPrefixes = useMemo(() => currentUser?.allowedTagPrefixes || [], [currentUser]);

  const visibleCategories = useMemo(() => {
      if (!isRestrictedUser || userAllowedCats.size === 0) return allCategories;
      return allCategories.filter(c => userAllowedCats.has(c.id));
  }, [allCategories, isRestrictedUser, userAllowedCats]);

  const visibleTags = useMemo(() => {
      if (!isRestrictedUser || userAllowedPrefixes.length === 0) return allTags;
      return allTags.filter(t => userAllowedPrefixes.some(prefix => t.name.toUpperCase().startsWith(prefix)));
  }, [allTags, isRestrictedUser, userAllowedPrefixes]);
  
  const canUserAccessProduct = useCallback((product: Product): boolean => {
    if (!isRestrictedUser) return true;

    const hasAllowedCategory = (userAllowedCats.size === 0) || product.categoryIds.some(catId => userAllowedCats.has(catId));
    
    const productTagNames = product.tagIds.map(tid => allTagsMap.get(tid) || '').filter(Boolean);
    const hasAllowedTag = (userAllowedPrefixes.length === 0) || productTagNames.some(tagName => userAllowedPrefixes.some(prefix => tagName.toUpperCase().startsWith(prefix)));

    return hasAllowedCategory && hasAllowedTag;
  }, [isRestrictedUser, userAllowedCats, userAllowedPrefixes, allTagsMap]);

  const visibleProducts = useMemo(() => {
    if (!isRestrictedUser) return allProducts;
    return allProducts.filter(canUserAccessProduct);
  }, [allProducts, isRestrictedUser, canUserAccessProduct]);

  const visibleTransactions = useMemo(() => {
      if (!isRestrictedUser) return allTransactions;
      const visibleProductIds = new Set(visibleProducts.map(p => p.id));
      return allTransactions.filter(t => visibleProductIds.has(t.productId));
  }, [allTransactions, visibleProducts, isRestrictedUser]);

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    if (!lowercasedFilter) return [...visibleProducts].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    
    return visibleProducts.filter(product => {
      const tagNames = (product.tagIds || []).map(id => allTagsMap.get(id)?.toLowerCase() || '').join(' ');
      const categoryNames = (product.categoryIds || []).map(id => allCategoriesMap.get(id)?.toLowerCase() || '').join(' ');
      return product.name.toLowerCase().includes(lowercasedFilter) || tagNames.includes(lowercasedFilter) || categoryNames.includes(lowercasedFilter);
    }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [visibleProducts, searchTerm, allTagsMap, allCategoriesMap]);

  const filteredLowStockProducts = useMemo(() => filteredProducts.filter(p => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD), [filteredProducts]);
  const filteredFinishedGoods = useMemo(() => filteredProducts.filter(p => p.quantity === 0), [filteredProducts]);

  const dashboardStats = useMemo(() => ({
    totalProductTypes: visibleProducts.length,
    totalItems: visibleProducts.reduce((acc, p) => acc + p.quantity, 0),
    lowStockItems: visibleProducts.filter(p => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD).length,
    finishedItems: visibleProducts.filter(p => p.quantity === 0).length,
  }), [visibleProducts]);

  const cardexProduct = useMemo(() => selectedProductIdForCardex ? allProducts.find(p => p.id === selectedProductIdForCardex) || null : null, [selectedProductIdForCardex, allProducts]);

  const handleOpenProductModal = useCallback((product: Product | null) => { setProductToEdit(product); setProductModalOpen(true); }, []);
  const handleCloseProductModal = useCallback(() => { setProductToEdit(null); setProductModalOpen(false); }, []);
  const handleShowCardex = useCallback((productId: string) => { setSelectedProductIdForCardex(productId); setCardexModalOpen(true); }, []);
  const handleCloseTransactionModal = useCallback(() => { setTransactionModalOpen(false); }, []);
  
  const handleSaveTag = useCallback(async (tagName: string): Promise<Tag> => {
    if(!db) throw new Error("Database not connected");
    const newTag = await db.saveTag({ id: '', name: tagName, color: '' });
    await refreshAllData();
    return newTag;
  }, [db, refreshAllData]);

  const handleUpdateTag = useCallback(async (tag: Tag) => {
    if (!db || !currentUser) return;
    const oldTag = allTags.find(t => t.id === tag.id);
    await db.updateTag(tag);
    await db.logAction('UPDATE_TAG', `نام تگ از "${oldTag?.name}" به "${tag.name}" تغییر یافت.`, currentUser);
    await refreshAllData();
  }, [db, currentUser, refreshAllData, allTags]);
  
  const handleDeleteTag = useCallback(async (tagId: string) => {
    if(!db) return;
    await db.deleteTag(tagId);
    await refreshAllData();
  }, [db, refreshAllData]);

  const handleSaveCategory = useCallback(async (categoryName: string): Promise<Category> => {
    if(!db) throw new Error("Database not connected");
    const newCategory = await db.saveCategory({ id: '', name: categoryName });
    await refreshAllData();
    return newCategory;
  }, [db, refreshAllData]);

  const handleUpdateCategory = useCallback(async (category: Category) => {
    if (!db || !currentUser) return;
    const oldCategory = allCategories.find(c => c.id === category.id);
    await db.updateCategory(category);
    await db.logAction('UPDATE_CATEGORY', `نام دسته‌بندی از "${oldCategory?.name}" به "${category.name}" تغییر یافت.`, currentUser);
    await refreshAllData();
  }, [db, currentUser, refreshAllData, allCategories]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if(!db) return;
    await db.deleteCategory(categoryId);
    await refreshAllData();
  }, [db, refreshAllData]);

  const handleSaveProduct = useCallback(async (product: Product) => {
    if(!db || !currentUser) return;
    const isEditing = !!productToEdit;
    await db.saveProduct(product);
    await db.logAction(
        isEditing ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
        `محصول "${product.name}" ${isEditing ? 'ویرایش شد' : 'ایجاد شد'}.`,
        currentUser
    );
    await refreshAllData();
  }, [db, refreshAllData, currentUser, productToEdit]);

  const handleDeleteProduct = useCallback((productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !db || !currentUser) return;
    
    if (!canUserAccessProduct(product)) {
      alert("شما دسترسی لازم برای حذف این محصول را ندارید.");
      return;
    }

    setConfirmModalState({
        isOpen: true,
        title: `حذف محصول: ${product.name}`,
        message: ( <> <p>آیا از حذف این محصول اطمینان دارید؟</p> <p className="text-sm text-yellow-400 mt-2">توجه: تاریخچه عملیات مربوط به این محصول حذف نخواهد شد.</p> </> ),
        onConfirm: async () => { 
          await db.deleteProduct(productId);
          await db.logAction('DELETE_PRODUCT', `محصول "${product.name}" حذف شد.`, currentUser);
          await refreshAllData();
        },
        confirmText: 'تایید حذف',
        confirmVariant: 'danger'
    });
  }, [allProducts, db, refreshAllData, canUserAccessProduct, currentUser]);
  
  const handleEditTransaction = useCallback((transaction: Transaction) => {
    const product = allProducts.find(p => p.id === transaction.productId);
    if (product && !canUserAccessProduct(product)) {
        alert("شما دسترسی لازم برای ویرایش این عملیات را ندارید.");
        return;
    }
    setTransactionToEdit(transaction);
  }, [allProducts, canUserAccessProduct]);

  const handleSaveEditedTransaction = async (updatedDetails: { quantityChange: number; invoiceNumber: string; }) => {
    if (!db || !transactionToEdit || !currentUser) return;
    const productName = allProductsMap.get(transactionToEdit.productId) || 'ناشناخته';
    await db.updateTransaction(transactionToEdit.id, updatedDetails);
    await db.logAction(
        'UPDATE_TRANSACTION',
        `عملیات برای محصول "${productName}" (فاکتور: ${updatedDetails.invoiceNumber}) ویرایش شد.`,
        currentUser
    );
    await refreshAllData();
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = useCallback((transactionId: string) => {
    if (!db || !currentUser) return;
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const product = allProducts.find(p => p.id === transaction.productId);
    if (product && !canUserAccessProduct(product)) {
        alert("شما دسترسی لازم برای حذف این عملیات را ندارید.");
        return;
    }

    const productName = allProductsMap.get(transaction.productId) || 'محصول حذف شده';
    const confirmAction = async () => {
        await db.deleteTransaction(transactionId);
        await db.logAction(
            'DELETE_TRANSACTION',
            `عملیات (نوع: ${transaction.type}, تعداد: ${transaction.quantityChange}) برای محصول "${productName}" حذف شد.`,
            currentUser
        );
        await refreshAllData();
    };

    setConfirmModalState({
        isOpen: true,
        title: 'حذف عملیات',
        message: ( <> <p>آیا از حذف این عملیات ثبت شده برای محصول <span className="font-bold text-teal-400">{productName}</span> اطمینان دارید؟</p> <p className="text-sm text-yellow-400 mt-2">توجه: این کار موجودی کالا را برمی‌گرداند و قابل بازگشت نیست.</p> </> ),
        onConfirm: confirmAction,
        confirmText: 'تایید حذف',
        confirmVariant: 'danger'
    });
  }, [allTransactions, allProducts, db, refreshAllData, allProductsMap, canUserAccessProduct, currentUser]);
  
  const handleSaveInvoice = useCallback(async (invoice: { type: TransactionType, invoiceNumber: string, items: InvoiceItem[] }) => {
    if(!db || !currentUser) return;
    
    const { type, items, invoiceNumber } = invoice;
    const currentProductsMap = new Map(allProducts.map(p => [p.id, p]));

    if (type === 'sale') {
      for (const item of items) {
        const product = currentProductsMap.get(item.productId);
        if (!product || product.quantity < item.quantity) {
          alert(`موجودی محصول "${item.productName}" کافی نیست. موجودی فعلی: ${product?.quantity || 0}، درخواست: ${item.quantity}`);
          return;
        }
      }
    }
    
    await db.saveInvoice(invoice);
    await db.logAction(
        type === 'purchase' ? 'CREATE_INVOICE_PURCHASE' : 'CREATE_INVOICE_SALE',
        `فاکتور (شماره: ${invoiceNumber || 'عمومی'}) با ${items.length} قلم کالا ثبت شد.`,
        currentUser
    );
    await refreshAllData();
    handleCloseTransactionModal();
  }, [allProducts, db, refreshAllData, handleCloseTransactionModal, currentUser]);

  const handleOpenRecountModal = useCallback((product: Product) => {
    if (!hasPermission('CAN_RECOUNT_STOCK')) {
        alert("شما دسترسی لازم برای این کار را ندارید.");
        return;
    }
    setProductToRecount(product);
    setRecountModalOpen(true);
  }, [hasPermission]);

  const handlePerformRecount = useCallback(async (details: { newQuantity: number; notes: string }) => {
      if (!db || !productToRecount || !currentUser) return;
      
      await db.recountStock(productToRecount.id, details.newQuantity, details.notes);
      
      await db.logAction(
          'RECOUNT_STOCK',
          `موجودی محصول "${productToRecount.name}" به ${details.newQuantity.toLocaleString('en-US')} تغییر یافت. یادداشت: ${details.notes}`,
          currentUser
      );
      
      await refreshAllData();
      setRecountModalOpen(false);
      setProductToRecount(null);
  }, [db, productToRecount, currentUser, refreshAllData]);

  const handleExport = useCallback((options: { dataType: 'products' | 'transactions' | 'lowStock' | 'finished', columns: { [key: string]: boolean }}) => {
    // This is a client-side action, logging might be optional but good for tracking.
    // if(db && currentUser) {
    //     db.logAction('EXPORT_DATA', `User exported ${options.dataType} data.`, currentUser);
    // }
    
    const { dataType, columns } = options;
    let dataToExport: any[] = [];
    const headers: { [key:string]: string } = {};

    if (dataType === 'products' || dataType === 'lowStock' || dataType === 'finished') {
        const productHeaders = { id: 'ID', name: 'نام محصول', categoryName: 'دسته‌بندی', tagName: 'تگ', quantity: 'تعداد', lastUpdated: 'آخرین بروزرسانی' };
        Object.keys(columns).filter(k => columns[k]).forEach(k => headers[k] = productHeaders[k]);
        
        let productsToExport;
        if (dataType === 'products') productsToExport = filteredProducts;
        else if (dataType === 'lowStock') productsToExport = filteredLowStockProducts;
        else productsToExport = filteredFinishedGoods;
        
        dataToExport = productsToExport.map(p => ({ id: p.id, name: p.name, categoryName: (p.categoryIds || []).map(id => allCategoriesMap.get(id)).filter(Boolean).join('، ') || 'ندارد', tagName: (p.tagIds || []).map(id => allTagsMap.get(id)).filter(Boolean).join('، ') || 'ندارد', quantity: p.quantity, lastUpdated: new Date(p.lastUpdated).toLocaleString('fa-IR') }));
    } else { // transactions
        const txHeaders = { productName: 'نام محصول', type: 'نوع عملیات', invoiceNumber: 'شماره فاکتور', quantityChange: 'تغییر تعداد', timestamp: 'تاریخ و زمان'};
        Object.keys(columns).filter(k => columns[k]).forEach(k => headers[k] = txHeaders[k]);
        dataToExport = visibleTransactions.map(t => ({ productName: allProductsMap.get(t.productId) || 'محصول حذف شده', type: { purchase: 'ورود', sale: 'خروج', adjustment: 'اصلاح دستی', recount: 'شمارش مجدد' }[t.type], invoiceNumber: t.invoiceNumber, quantityChange: t.quantityChange, timestamp: new Date(t.timestamp).toLocaleString('fa-IR') }));
    }

    const finalData = dataToExport.map(row => { const newRow = {}; Object.keys(headers).forEach(key => { newRow[headers[key]] = row[key]; }); return newRow; });
    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش');
    XLSX.writeFile(workbook, `گزارش_انبار_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`);
    setExportModalOpen(false);
  }, [filteredProducts, filteredLowStockProducts, filteredFinishedGoods, visibleTransactions, allCategoriesMap, allTagsMap, allProductsMap]);
  
  const handleSaveBackup = useCallback(async () => {
    if(!exportDatabase || !db || !currentUser) return;
    const dbFile: Uint8Array = await exportDatabase();
    const blob = new Blob([dbFile], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_database.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await db.logAction('DB_BACKUP', 'یک فایل پشتیبان از پایگاه داده دریافت شد.', currentUser);
  }, [exportDatabase, db, currentUser]);

  const handleLoadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!importDatabase || !db || !currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm("آیا مطمئن هستید؟ با بازیابی پشتیبان، تمام اطلاعات فعلی شما (از جمله کاربران و گزارشات) پاک خواهد شد.")) {
        event.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const fileBuffer = e.target?.result;
            if (fileBuffer instanceof ArrayBuffer) {
                // Log before losing current DB context
                await db.logAction('DB_RESTORE', `کاربر تلاش کرد یک پشتیبان را بازیابی کند. سیستم برای اعمال تغییرات مجددا راه اندازی می شود.`, currentUser);

                await importDatabase(new Uint8Array(fileBuffer));
                await refreshAllData();
                alert("پشتیبان با موفقیت بازیابی شد. برای اعمال تغییرات، لطفا مجددا وارد شوید.");
                setCurrentUser(null);
            } else { throw new Error("File is not readable as ArrayBuffer"); }
        } catch (error) {
            console.error("Failed to load backup:", error);
            alert("خطا در بازیابی فایل پشتیبان. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.");
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); }
  
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="flex flex-col items-center">
                <InventoryIcon className="w-16 h-16 text-teal-500 animate-pulse" />
                <p className="mt-4 text-lg">در حال بارگذاری پایگاه داده...</p>
            </div>
        </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  const searchPlaceholder = { products: "جستجو بر اساس نام محصول، تگ یا دسته‌بندی...", transactions: "جستجو در تاریخچه عملیات...", lowStock: "جستجو در کالاهای ته انباری...", finished: "جستجو در کالاهای تمام شده...", logs: "جستجو در گزارش فعالیت ها..." }[currentView];
  const activeProducts = currentView === 'products' ? filteredProducts : currentView === 'lowStock' ? filteredLowStockProducts : filteredFinishedGoods;


  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
             <div className="flex justify-between items-start mb-4">
                {db && <AutoBackupIndicator onAutoBackup={handleSaveBackup} />}
                <Clock />
            </div>
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">سیستم مدیریت انبار محصول تسکو</h1>
              <div className="flex items-center gap-3 justify-center flex-wrap">
                  {hasPermission('CAN_ADD_PRODUCTS') && (
                      <button onClick={() => handleOpenProductModal(null)} className="flex-shrink-0 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <PlusIcon className="w-5 h-5"/><span className="hidden sm:inline">افزودن محصول</span>
                      </button>
                  )}
                  {hasPermission('CAN_PERFORM_TRANSACTIONS') && (
                      <button onClick={() => setTransactionModalOpen(true)} className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <ClipboardListIcon className="w-5 h-5"/><span className="hidden sm:inline">ثبت عملیات</span>
                      </button>
                  )}
                  {hasPermission('CAN_EXPORT_DATA') && (
                      <button onClick={() => setExportModalOpen(true)} className="flex-shrink-0 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <TableCellsIcon className="w-5 h-5"/>
                          <span className="hidden sm:inline">خروجی اکسل</span>
                      </button>
                  )}
                  {hasPermission('CAN_BACKUP_RESTORE') && (
                    <>
                      <button onClick={handleSaveBackup} className="flex-shrink-0 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <ArchiveBoxArrowDownIcon className="w-5 h-5"/>
                          <span className="hidden sm:inline">بک‌آپ</span>
                      </button>
                      <button onClick={triggerFileInput} className="flex-shrink-0 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <ArchiveBoxArrowUpIcon className="w-5 h-5"/>
                          <span className="hidden sm:inline">بازیابی</span>
                      </button>
                    </>
                  )}
                  {hasPermission('CAN_MANAGE_USERS') && (
                      <button onClick={() => handleOpenUserModal()} className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold h-10 px-3 sm:px-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
                          <UserGroupIcon className="w-5 h-5"/>
                          <span className="hidden sm:inline">مدیریت کاربران</span>
                      </button>
                  )}

                  <div className="relative flex-shrink-0" ref={profileDropdownRef}>
                       <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white h-10 px-2 rounded-lg transition-colors shadow-inner">
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}/>
                          <span className="font-medium hidden sm:inline">{currentUser.username}</span>
                          {currentUser.profilePicture ? (
                              <img src={currentUser.profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                              <UserCircleIcon className="w-8 h-8 text-gray-500" />
                          )}
                       </button>
                       {profileDropdownOpen && (
                           <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-20 focus:outline-none origin-top-left left-0">
                               <div className="py-1">
                                   <a href="#" onClick={(e) => { e.preventDefault(); setProfileModalOpen(true); setProfileDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">
                                      <UserCircleIcon className="w-4 h-4"/>
                                      <span>ویرایش پروفایل</span>
                                   </a>
                                   <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setProfileDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white">
                                      <LogoutIcon className="w-4 h-4"/>
                                      <span>خروج</span>
                                   </a>
                               </div>
                           </div>
                       )}
                  </div>
              </div>
               <input type="file" accept=".sqlite, .db" onChange={handleLoadBackup} ref={fileInputRef} className="hidden" />
            </div>
          </header>

          <main>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="انواع محصول" value={dashboardStats.totalProductTypes} icon={<TagIcon className="w-8 h-8"/>} colorClass="bg-blue-500/80" />
                <StatCard title="تعداد کل کالاها" value={dashboardStats.totalItems} icon={<InventoryIcon />} colorClass="bg-green-500/80" />
                <StatCard title="کالاهای ته انباری" value={dashboardStats.lowStockItems} icon={<WarningIcon />} colorClass="bg-yellow-500/80" />
                <StatCard title="کالاهای تمام شده" value={dashboardStats.finishedItems} icon={<ArchiveBoxXMarkIcon />} colorClass="bg-red-500/80" />
            </div>
            
            <div className="mb-6"><div className="flex flex-wrap border-b border-gray-700"><button onClick={() => setCurrentView('products')} className={`py-2 px-4 text-sm font-medium ${currentView === 'products' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>محصولات</button><button onClick={() => setCurrentView('transactions')} className={`py-2 px-4 text-sm font-medium ${currentView === 'transactions' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>تاریخچه عملیات</button><button onClick={() => setCurrentView('lowStock')} className={`py-2 px-4 text-sm font-medium ${currentView === 'lowStock' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>کالاهای ته انباری</button><button onClick={() => setCurrentView('finished')} className={`py-2 px-4 text-sm font-medium ${currentView === 'finished' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>کالاهای تمام شده</button>{hasPermission('CAN_VIEW_LOGS') && (<button onClick={() => setCurrentView('logs')} className={`py-2 px-4 text-sm font-medium ${currentView === 'logs' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-white'}`}>گزارش فعالیت‌ها</button>)}</div></div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8"><div className="relative"><input type="text" placeholder={searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md pr-10 pl-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500" /><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon className="text-gray-400" /></div></div></div>

            {currentView === 'transactions' ? (
                <TransactionList 
                  transactions={visibleTransactions} 
                  productsMap={allProductsMap} 
                  searchTerm={searchTerm} 
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
                  hasPermission={hasPermission} 
                />
            ) : currentView === 'logs' ? (
                <ActivityLog logs={allLogs} />
            ) : (
                <ProductList products={activeProducts} tags={allTags} categories={allCategories} onEdit={handleOpenProductModal} onDelete={handleDeleteProduct} onShowCardex={handleShowCardex} onRecount={handleOpenRecountModal} hasPermission={hasPermission} />
            )}
          </main>
           <footer className="text-center text-gray-500 text-sm mt-8 py-4 border-t border-gray-700">
            Made by Hessamodin Delkhosh
          </footer>
        </div>
      </div>

      {hasPermission('CAN_ADD_PRODUCTS') && 
        <AddProductModal 
            isOpen={productModalOpen} 
            onClose={handleCloseProductModal} 
            onSave={handleSaveProduct} 
            productToEdit={productToEdit} 
            allProducts={allProducts} 
            allTags={allTags}
            allCategories={allCategories}
            optionsTags={visibleTags}
            optionsCategories={visibleCategories}
            allowedTagPrefixes={currentUser?.allowedTagPrefixes || []}
            onSaveTag={handleSaveTag} 
            onSaveCategory={handleSaveCategory}
            onUpdateTag={handleUpdateTag}
            onUpdateCategory={handleUpdateCategory}
            onDeleteTag={handleDeleteTag} 
            onDeleteCategory={handleDeleteCategory} 
        />
      }
      
      {hasPermission('CAN_PERFORM_TRANSACTIONS') && <TransactionModal isOpen={transactionModalOpen} onClose={handleCloseTransactionModal} onSave={handleSaveInvoice} products={visibleProducts} tagsMap={allTagsMap} categoriesMap={allCategoriesMap} />}

      {hasPermission('CAN_EXPORT_DATA') && <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleExport} />}

      {cardexModalOpen && cardexProduct && (
        <ProductCardexModal isOpen={cardexModalOpen} onClose={() => setCardexModalOpen(false)} product={cardexProduct} transactions={allTransactions.filter(t => t.productId === selectedProductIdForCardex)} />
      )}

       {transactionToEdit && hasPermission('CAN_EDIT_TRANSACTIONS') && (
        <EditTransactionModal
            isOpen={!!transactionToEdit}
            onClose={() => setTransactionToEdit(null)}
            onSave={handleSaveEditedTransaction}
            transaction={transactionToEdit}
            productName={allProductsMap.get(transactionToEdit.productId) || 'محصول حذف شده'}
        />
      )}

      {productToRecount && hasPermission('CAN_RECOUNT_STOCK') && (
        <RecountModal
            isOpen={recountModalOpen}
            onClose={() => { setRecountModalOpen(false); setProductToRecount(null); }}
            onConfirm={handlePerformRecount}
            product={productToRecount}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmModalState.isOpen} 
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })} 
        onConfirm={confirmModalState.onConfirm} 
        title={confirmModalState.title} 
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        confirmVariant={confirmModalState.confirmVariant}
      />
      
      {hasPermission('CAN_MANAGE_USERS') && (
        <UserManagementModal 
            isOpen={userModalOpen}
            onClose={() => {setUserModalOpen(false); setUserToEdit(null);}}
            onSave={handleSaveUser}
            onDelete={handleDeleteUser}
            onEdit={handleOpenUserModal}
            onNew={() => handleOpenUserModal(null)}
            userToEdit={userToEdit}
            users={allUsers}
            allCategories={allCategories}
            currentUser={currentUser}
        />
      )}

      {profileModalOpen && currentUser && (
        <ProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onSave={handleSaveProfile}
            currentUser={currentUser}
        />
      )}
    </>
  );
};

export default App;
