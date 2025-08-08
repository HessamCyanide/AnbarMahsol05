export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
}

export type TransactionType = 'purchase' | 'sale' | 'adjustment';

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
