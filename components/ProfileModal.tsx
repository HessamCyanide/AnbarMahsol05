import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { UserCircleIcon, TrashIcon } from './icons';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currentPassword, newUsername, newPassword, profilePicture) => Promise<void>;
  currentUser: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewUsername(currentUser.username);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfilePicture(currentUser.profilePicture);
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 128;
        const MAX_HEIGHT = 128;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Compress to jpeg
            setProfilePicture(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("رمز عبور جدید و تکرار آن مطابقت ندارند.");
      return;
    }

    if (!currentPassword) {
        setError("برای اعمال تغییرات، وارد کردن رمز عبور فعلی الزامی است.");
        return;
    }

    const finalUsername = newUsername.trim() !== currentUser.username ? newUsername.trim() : '';
    const finalPassword = newPassword.trim() !== '' ? newPassword.trim() : '';
    
    // Determine if picture was changed from original state
    const finalProfilePicture = profilePicture !== currentUser.profilePicture ? profilePicture : undefined;
    
    if (!finalUsername && !finalPassword && finalProfilePicture === undefined) {
        onClose();
        return; // Nothing to save
    }

    setIsSaving(true);
    try {
      await onSave(currentPassword, finalUsername, finalPassword, finalProfilePicture);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[95vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">ویرایش پروفایل</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-teal-500" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                    <UserCircleIcon className="w-12 h-12 text-gray-400"/>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 transition-colors">تغییر عکس</button>
                {profilePicture && (
                    <button type="button" onClick={() => setProfilePicture(null)} className="flex items-center justify-center gap-1 px-4 py-2 bg-red-700 text-white text-sm rounded-md hover:bg-red-600 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                        <span>حذف</span>
                    </button>
                )}
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">نام کاربری</label>
            <input type="text" id="username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500" />
          </div>

          <fieldset className="border border-gray-600 p-4 rounded-lg space-y-4">
            <legend className="px-2 text-sm font-medium text-teal-400">تغییر رمز عبور</legend>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">رمز عبور جدید</label>
              <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="برای عدم تغییر، خالی بگذارید" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">تکرار رمز عبور جدید</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-500" />
            </div>
          </fieldset>

          <div className="border-t border-yellow-500/30 pt-4">
             <label htmlFor="currentPassword" className="block text-sm font-medium text-yellow-300 mb-1">رمز عبور فعلی (برای تایید)</label>
             <input type="password" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full bg-gray-700 border border-yellow-500 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400" />
          </div>

          {error && <p className="text-sm text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">لغو</button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors disabled:bg-gray-500" disabled={isSaving}>
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
