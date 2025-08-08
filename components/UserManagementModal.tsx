
import React, { useState, useEffect } from 'react';
import { User, Permission, Category } from '../types';
import { ALL_PERMISSIONS, TAG_PREFIXES } from '../constants';
import { TrashIcon } from './icons';
import MultiSelect from './MultiSelect';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
  onEdit: (user: User) => void;
  onNew: () => void;
  userToEdit: User | null;
  users: User[];
  allCategories: Category[];
  currentUser: User;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ 
    isOpen, onClose, onSave, onDelete, onEdit, onNew, 
    userToEdit, users, allCategories, currentUser 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedPrefixes, setAllowedPrefixes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setError('');
    if (userToEdit) {
      setUsername(userToEdit.username);
      setPassword(''); // Password field is blank for editing for security
      setPermissions(userToEdit.permissions);
      setAllowedCategories(userToEdit.allowedCategoryIds || []);
      setAllowedPrefixes(userToEdit.allowedTagPrefixes || []);
    } else {
      setUsername('');
      setPassword('');
      setPermissions([]);
      setAllowedCategories([]);
      setAllowedPrefixes([]);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePermissionChange = (permissionId: Permission) => {
    setPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };
  
  const handlePrefixChange = (prefix: string) => {
    setAllowedPrefixes(prev =>
        prev.includes(prefix)
        ? prev.filter(p => p !== prefix)
        : [...prev, prefix]
    );
  };

  const handleSelectAllPermissions = () => setPermissions(ALL_PERMISSIONS.map(p => p.id));
  const handleDeselectAllPermissions = () => setPermissions([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || (!password && !userToEdit)) {
      setError("نام کاربری و رمز عبور نمی‌توانند خالی باشند.");
      setIsSaving(false);
      return;
    }
    
    const isDuplicate = users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== userToEdit?.id);
    if (isDuplicate) {
        setError("کاربری با این نام کاربری از قبل وجود دارد.");
        setIsSaving(false);
        return;
    }

    const finalUser: User = {
      id: userToEdit ? userToEdit.id : '',
      username: trimmedUsername,
      password: password, // Send the raw password; the DB hook will handle empty strings
      permissions: permissions,
      allowedCategoryIds: allowedCategories,
      allowedTagPrefixes: allowedPrefixes,
      profilePicture: userToEdit?.profilePicture
    };
    
    await onSave(finalUser);
    setIsSaving(false);
  };
  
  const handleDeleteClick = async (userId: string) => {
    if (window.confirm("آیا از حذف این کاربر اطمینان دارید؟ این عمل قابل بازگشت نیست.")) {
        await onDelete(userId);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">مدیریت کاربران</h2>
          <button onClick={onNew} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">کاربر جدید</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
            {/* User List */}
            <div className="lg:col-span-1 border border-gray-700 rounded-lg self-start">
                <h3 className="text-lg font-semibold text-gray-200 p-3 bg-gray-700/50 rounded-t-lg">لیست کاربران</h3>
                <div className="max-h-96 overflow-y-auto">
                  {users.map(user => (
                      <div key={user.id} className={`flex justify-between items-center p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 ${userToEdit?.id === user.id ? 'bg-teal-900/50' : ''}`}>
                          <div>
                            <span className="font-semibold text-white">{user.username}</span>
                            {user.id === currentUser.id && <span className="text-xs text-teal-400 mr-2">(شما)</span>}
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => onEdit(user)} className="text-sm text-teal-400 hover:text-teal-300">ویرایش</button>
                               {user.id !== currentUser.id && (
                                 <button onClick={() => handleDeleteClick(user.id)} className="p-1 text-red-500 hover:text-red-400 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                 </button>
                               )}
                          </div>
                      </div>
                  ))}
                </div>
            </div>

            {/* Edit/Create Form */}
            <div className="lg:col-span-2 flex-grow">
                <h3 className="text-xl font-bold mb-4 text-white">{userToEdit ? `ویرایش کاربر: ${userToEdit.username}` : 'افزودن کاربر جدید'}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">نام کاربری</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">رمز عبور</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={userToEdit ? 'برای عدم تغییر، خالی بگذارید' : ''} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                  
                  <fieldset className="border border-gray-600 p-4 rounded-lg space-y-4">
                    <legend className="px-2 text-base font-medium text-teal-400">دسترسی‌ها</legend>
                    <div className="flex gap-4 mb-3">
                      <button type="button" onClick={handleSelectAllPermissions} className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded">انتخاب همه</button>
                      <button type="button" onClick={handleDeselectAllPermissions} className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded">لغو همه</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-700/50 rounded-lg max-h-60 overflow-y-auto">
                        {ALL_PERMISSIONS.map(p => (
                            <label key={p.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                <input type="checkbox" checked={permissions.includes(p.id)} onChange={() => handlePermissionChange(p.id)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-600"/>
                                <span className="text-white text-sm">{p.label}</span>
                            </label>
                        ))}
                    </div>
                  </fieldset>

                  <fieldset className="border border-gray-600 p-4 rounded-lg space-y-4">
                      <legend className="px-2 text-base font-medium text-teal-400">محدودیت‌های دسترسی</legend>
                      <p className="text-xs text-gray-400 -mt-2">اگر هیچ گزینه‌ای انتخاب نشود، کاربر به همه موارد آن بخش دسترسی خواهد داشت.</p>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">بخش‌های انبار مجاز (براساس پیشوند تگ)</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-700/50 rounded-lg">
                              {TAG_PREFIXES.map(prefix => (
                                <label key={prefix} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                    <input type="checkbox" checked={allowedPrefixes.includes(prefix)} onChange={() => handlePrefixChange(prefix)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-600"/>
                                    <span className="text-white text-sm font-semibold">بخش {prefix}</span>
                                </label>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">دسته‌بندی‌های کالا مجاز</label>
                          <MultiSelect
                            options={allCategories}
                            selectedIds={allowedCategories}
                            onChange={setAllowedCategories}
                            placeholder="انتخاب دسته‌بندی‌های مجاز"
                          />
                      </div>
                  </fieldset>

                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">بستن</button>
                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors disabled:bg-gray-500" disabled={isSaving}>
                      {isSaving ? 'در حال ذخیره...' : 'ذخیره کاربر'}
                    </button>
                  </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;