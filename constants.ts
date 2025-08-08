
import { Permission } from './types';

export const LOW_STOCK_THRESHOLD = 100;
export const INACTIVITY_LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes
export const TAG_PREFIXES = ['A', 'B', 'C', 'D'];

export const ALL_PERMISSIONS: { id: Permission, label: string }[] = [
    { id: 'CAN_MANAGE_USERS', label: 'مدیریت کاربران' },
    { id: 'CAN_ADD_PRODUCTS', label: 'افزودن محصول' },
    { id: 'CAN_EDIT_PRODUCTS', label: 'ویرایش محصول' },
    { id: 'CAN_DELETE_PRODUCTS', label: 'حذف محصول' },
    { id: 'CAN_PERFORM_TRANSACTIONS', label: 'ثبت عملیات ورود/خروج' },
    { id: 'CAN_EDIT_TRANSACTIONS', label: 'ویرایش عملیات' },
    { id: 'CAN_DELETE_TRANSACTIONS', label: 'حذف تاریخچه عملیات' },
    { id: 'CAN_EXPORT_DATA', label: 'خروجی اکسل' },
    { id: 'CAN_BACKUP_RESTORE', label: 'پشتیبان‌گیری و بازیابی' },
    { id: 'CAN_VIEW_LOGS', label: 'مشاهده گزارش فعالیت‌ها' },
    { id: 'CAN_RECOUNT_STOCK', label: 'شمارش مجدد انبار' },
];