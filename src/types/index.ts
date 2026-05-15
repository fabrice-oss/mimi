export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string; // "YYYY-MM-DD"
  description: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
}

export interface Budget {
  id: string;
  monthYear: string; // "YYYY-MM"
  categoryId: string;
  amount: number;
}

export interface User {
  email: string;
  name: string;
  picture: string;
}
