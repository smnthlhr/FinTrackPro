export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface Transaction {
  id: string;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  accountId: string; // Source account
  toAccountId?: string; // Destination account for transfers
  notes?: string;
  date: string; // ISO Date string YYYY-MM-DD
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  investedAmount: number;
  sipAmount?: number;
  date: string;
}

export interface Debt {
  id: string;
  title: string;
  amount: number;
  type: string;
  dueDate: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  accountId: string;
}

export interface Lending {
  id: string;
  borrower: string;
  totalAmount: number;
  date: string;
  returnDate: string;
  interestRate: number;
  contactDetails: string;
  payments: Payment[];
  status: 'active' | 'settled';
}

export interface SecurityQA {
  question: string;
  answer: string;
}

export interface AppMetadata {
  createdAt: string;
  lastModified: string;
}

export type IncomeCategory = string;
export type ExpenseCategory = string;
export type DebtType = string;
export type InvestmentType = string;
export type AccountType = string;