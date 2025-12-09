import { Account, Goal, Debt } from './types';

export const INITIAL_ACCOUNTS: Account[] = [];

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

export const INITIAL_GOALS: Goal[] = [];

export const INITIAL_DEBTS: Debt[] = [];