import { Account, Goal, Debt } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_1', name: 'SBI Savings', type: 'Bank', balance: 25000 },
  { id: 'acc_2', name: 'Cash', type: 'Cash', balance: 5000 },
  { id: 'acc_3', name: 'Delta Exchange', type: 'Crypto Wallet', balance: 0 }, 
];

export const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelancing', 'Bonus', 'Investment Profit', 'Rental Income', 'Gift'];
export const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Rent', 'Travel', 'Entertainment', 'EMI', 'Trading Loss', 'Health', 'Groceries', 'Utilities', 'Shopping'];
export const DEFAULT_DEBT_TYPES = ['EMI / Loan', 'Personal / Friends', 'Credit Card Bill', 'Business Loan', 'Mortgage'];
export const DEFAULT_INVESTMENT_TYPES = ['Mutual Fund', 'Stocks', 'Crypto', 'FD', 'Real Estate', 'Gold', 'Bonds'];
export const DEFAULT_ACCOUNT_TYPES = ['Bank', 'Cash', 'Crypto Wallet', 'Credit Card', 'Digital Wallet'];

export const SECURITY_QUESTIONS = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the first car you owned?",
  "What city were you born in?",
  "What is your favorite food?",
  "What is the name of your favorite teacher?",
  "Where did you go for your first vacation?",
  "What is your father's middle name?"
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Emergency Fund', target: 50000, current: 15000, deadline: '2025-12-31' }
];

export const INITIAL_DEBTS: Debt[] = [
  { id: 'd1', title: 'Car Loan', amount: 200000, type: 'EMI / Loan', dueDate: '2025-05-10' }
];