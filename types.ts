export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
}

export type TransactionType = 'purchase' | 'sale' | 'adjustment' | 'recount';

export interface Transaction {
  id: string;
  type: TransactionType;
  invoiceNumber: string;
  productId: string;
  quantityChange: number;
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  tagIds: string[];
  categoryIds: string[];
  lastUpdated: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  currentStock: number;
}

export interface Log {
  id:string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
}

export type Permission =
  | 'CAN_MANAGE_USERS'
  | 'CAN_EDIT_PRODUCTS'
  | 'CAN_DELETE_PRODUCTS'
  | 'CAN_ADD_PRODUCTS'
  | 'CAN_PERFORM_TRANSACTIONS'
  | 'CAN_EDIT_TRANSACTIONS'
  | 'CAN_DELETE_TRANSACTIONS'
  | 'CAN_EXPORT_DATA'
  | 'CAN_BACKUP_RESTORE'
  | 'CAN_VIEW_LOGS'
  | 'CAN_RECOUNT_STOCK';

export interface User {
  id: string;
  username: string;
  password: string; // In a real-world app, this should be a hashed password.
  permissions: Permission[];
  profilePicture?: string | null;
  allowedCategoryIds: string[];
  allowedTagPrefixes: string[];
}