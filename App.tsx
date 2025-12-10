import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, TrendingUp, Target, Settings, Brain, Menu, X, ArrowRightLeft, 
  CreditCard, Activity, Briefcase, CheckCircle, Lock, HandCoins, PieChart
} from 'lucide-react';

import { 
  Account, Transaction, Goal, Investment, Debt, Lending, AppMetadata, SecurityQA, Budget, Subscription 
} from './types';
import { 
  INITIAL_ACCOUNTS, INITIAL_GOALS, INITIAL_DEBTS, 
  DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_DEBT_TYPES, DEFAULT_INVESTMENT_TYPES, DEFAULT_ACCOUNT_TYPES 
} from './constants';
import { formatCurrency, generateId, generateAIContext, setCurrencyConfig } from './utils';

import Dashboard from './components/Dashboard';
import AccountsModule from './components/AccountsModule';
import DebtsModule from './components/DebtsModule';
import TransactionModule from './components/TransactionModule';
import InvestmentsModule from './components/InvestmentsModule';
import GoalsModule from './components/GoalsModule';
import AIModule from './components/AIModule';
import SettingsModule from './components/SettingsModule';
import ConfirmationModal from './components/ConfirmationModal';
import FloatingAssistant from './components/FloatingAssistant';
import LockScreen from './components/LockScreen';
import LendingsModule from './components/LendingsModule';
import BudgetModule from './components/BudgetModule';

export default function App() {
  const [view, setView] = useState('dashboard'); 
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // AI Settings
  const [aiLanguage, setAiLanguage] = useState<string>('English');
  const [aiVoice, setAiVoice] = useState<string>('Zephyr');

  // Currency Settings
  const [currency, setCurrency] = useState<string>('INR');
  const [currencyRate, setCurrencyRate] = useState<number>(1);

  // Security Settings
  const [appPin, setAppPin] = useState<string | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [securityQA, setSecurityQA] = useState<SecurityQA[]>([]);

  const [appMetadata, setAppMetadata] = useState<AppMetadata>({
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
  });

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [debtTypes, setDebtTypes] = useState<string[]>(DEFAULT_DEBT_TYPES);
  const [investmentTypes, setInvestmentTypes] = useState<string[]>(DEFAULT_INVESTMENT_TYPES);
  const [accountTypes, setAccountTypes] = useState<string[]>(DEFAULT_ACCOUNT_TYPES);

  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null); 
  
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      actionType: 'delete' | 'update';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, actionType: 'delete' });

  // Sync Currency Config with Utility
  useMemo(() => {
      setCurrencyConfig(currency, currencyRate);
  }, [currency, currencyRate]);

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem('finance_app_data_v10');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAccounts(parsed.accounts || INITIAL_ACCOUNTS);
        setTransactions(parsed.transactions || []);
        setGoals(parsed.goals || INITIAL_GOALS);
        setInvestments(parsed.investments || []);
        setDebts(parsed.debts || INITIAL_DEBTS);
        setLendings(parsed.lendings || []);
        setBudgets(parsed.budgets || []);
        setSubscriptions(parsed.subscriptions || []);
        setTheme(parsed.theme || 'dark');
        setAppMetadata(parsed.appMetadata || { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() });
        setIncomeCategories(parsed.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setExpenseCategories(parsed.expenseCategories || DEFAULT_EXPENSE_CATEGORIES);
        setDebtTypes(parsed.debtTypes || DEFAULT_DEBT_TYPES);
        setInvestmentTypes(parsed.investmentTypes || DEFAULT_INVESTMENT_TYPES);
        setAccountTypes(parsed.accountTypes || DEFAULT_ACCOUNT_TYPES);
        
        // Restore AI settings
        setAiLanguage(parsed.aiLanguage || 'English');
        setAiVoice(parsed.aiVoice || 'Zephyr');

        // Restore Currency Settings
        setCurrency(parsed.currency || 'INR');
        setCurrencyRate(parsed.currencyRate || 1);

        // Restore Security Settings
        if (parsed.appPin) setAppPin(parsed.appPin);
        if (parsed.isAppLocked) setIsAppLocked(true); 
        if (parsed.securityQA) setSecurityQA(parsed.securityQA);

        if (parsed.view) setView(parsed.view);
      } catch (e) {
        console.error("Data restore failed", e);
      }
    }
  }, []);

  // Check for recurring transactions (subscriptions) on load/update
  useEffect(() => {
    if (subscriptions.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let newTransactions: Transaction[] = [];
      let updatedSubscriptions = [...subscriptions];
      let updatedAccounts = [...accounts];
      let hasUpdates = false;

      updatedSubscriptions = updatedSubscriptions.map(sub => {
        if (sub.isActive && sub.nextDueDate <= today) {
          // Trigger Transaction
          hasUpdates = true;
          const txnId = generateId();
          newTransactions.push({
            id: txnId,
            amount: sub.amount,
            type: sub.type,
            category: sub.category,
            accountId: sub.accountId,
            date: sub.nextDueDate,
            notes: `Auto-generated subscription: ${sub.name}`
          });

          // Update Account Balance
          const accIdx = updatedAccounts.findIndex(a => a.id === sub.accountId);
          if (accIdx >= 0) {
            updatedAccounts[accIdx] = {
              ...updatedAccounts[accIdx],
              balance: updatedAccounts[accIdx].balance + (sub.type === 'income' ? sub.amount : -sub.amount)
            };
          }

          // Advance Date by 1 Month
          const nextDate = new Date(sub.nextDueDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          return { ...sub, nextDueDate: nextDate.toISOString().split('T')[0] };
        }
        return sub;
      });

      if (hasUpdates) {
        setTransactions(prev => [...prev, ...newTransactions]);
        setAccounts(updatedAccounts);
        setSubscriptions(updatedSubscriptions);
        // We trigger a save effect via the main dependency array below
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]); // Only depend on subscriptions to avoid infinite loops with transactions/accounts

  // Separate effect for Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Separate effect for Auto-Save
  useEffect(() => {
    const newMetadata = { ...appMetadata, lastModified: new Date().toISOString() };
    const dataToSave = { 
        accounts, transactions, goals, investments, debts, lendings, budgets, subscriptions, theme, 
        incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes,
        appMetadata: newMetadata,
        view,
        aiLanguage, aiVoice,
        currency, currencyRate,
        appPin, isAppLocked, securityQA
    };
    localStorage.setItem('finance_app_data_v10', JSON.stringify(dataToSave));
    setLastSaved(new Date());
  }, [accounts, transactions, goals, investments, debts, lendings, budgets, subscriptions, theme, incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes, view, aiLanguage, aiVoice, currency, currencyRate, appPin, isAppLocked, securityQA]);

  const totalWalletBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
  const totalDebtValue = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalNetWorth = (totalWalletBalance + totalInvestmentValue) - totalDebtValue;
  
  const monthlyMetrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let income = 0; let expense = 0;
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'income') income += Number(t.amount);
        if (t.type === 'expense') expense += Number(t.amount);
      }
    });
    const totalSIP = investments.reduce((sum, inv) => sum + (inv.sipAmount || 0), 0);
    return { income, expense, savings: income - expense, totalSIP };
  }, [transactions, investments]);

  // AI Context for Floating Assistant
  const aiContext = useMemo(() => generateAIContext(
    transactions, accounts, investments, debts, goals, lendings, appMetadata,
    incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes,
    totalNetWorth, totalDebtValue, monthlyMetrics
  ), [transactions, accounts, investments, debts, goals, lendings, appMetadata, incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes, totalNetWorth, totalDebtValue, monthlyMetrics]);

  const floatingSystemPrompt = `You are FinTrackPro's smart voice assistant. User's financial data: ${JSON.stringify(aiContext)}. 
  
  CRITICAL RULES:
  1. LANGUAGE: You must speak ONLY in ${aiLanguage}. Even if the user speaks another language, reply strictly in ${aiLanguage}.
  2. DATA ACCESS: You have READ-ONLY access. 
  3. DENY DATA ENTRY: If the user asks you to add, edit, or delete a transaction, account, or any data (e.g., "Add 500 for lunch", "Create a new goal"), you MUST REFUSE. 
     - Say exactly: "I cannot modify your data directly. Please use the manual buttons in the app to add this."
  4. Keep responses concise, friendly, and helpful.`;

  const handleConfirmAction = (title: string, message: string, action: () => void, type: 'delete' | 'update' = 'delete') => {
    setModalConfig({ isOpen: true, title, message, onConfirm: action, actionType: type });
  };

  const handleUnlock = (pin: string) => {
      if (pin === appPin) {
          setIsAppLocked(false);
          return true;
      }
      return false;
  };
  
  const handleRecoveryUnlock = () => {
      setIsAppLocked(false);
  };

  const lockApp = () => {
      setIsAppLocked(true);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleSaveTransaction = (txn: Transaction, isEdit = false) => {
    const amount = Number(txn.amount);
    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid amount"); return; }
    
    if (txn.type === 'transfer') {
        if (!txn.toAccountId) { alert("Please select a destination."); return; }
        if (txn.accountId === txn.toAccountId) { alert("Source and destination cannot be the same."); return; }
    }

    const processSave = () => {
      let updatedAccounts = [...accounts];
      let updatedDebts = [...debts];
      let updatedTransactions = [...transactions];
      
      const updateBalance = (id: string, delta: number) => {
          // Check Account (Asset)
          const accIdx = updatedAccounts.findIndex(a => a.id === id);
          if (accIdx >= 0) {
              updatedAccounts[accIdx] = { ...updatedAccounts[accIdx], balance: updatedAccounts[accIdx].balance + delta };
              return;
          }
          // Check Debt (Liability)
          const debtIdx = updatedDebts.findIndex(d => d.id === id);
          if (debtIdx >= 0) {
             updatedDebts[debtIdx] = { ...updatedDebts[debtIdx], amount: Math.max(0, updatedDebts[debtIdx].amount - delta) };
          }
      };

      // 1. REVERT OLD TRANSACTION IMPACT (If Editing)
      if (isEdit) {
        const oldTxn = transactions.find(t => t.id === txn.id);
        if (oldTxn) {
          const oldAmt = Number(oldTxn.amount);
          
          if (oldTxn.type === 'income') {
             updateBalance(oldTxn.accountId, -oldAmt); 
          } else if (oldTxn.type === 'expense') {
             updateBalance(oldTxn.accountId, oldAmt);
          } else if (oldTxn.type === 'transfer') {
             updateBalance(oldTxn.accountId, oldAmt);
             if(oldTxn.toAccountId) updateBalance(oldTxn.toAccountId, -oldAmt);
          }
          updatedTransactions = updatedTransactions.filter(t => t.id !== txn.id);
        }
      }

      // 2. APPLY NEW TRANSACTION IMPACT
      if (txn.type === 'income') {
          updateBalance(txn.accountId, amount);
      } else if (txn.type === 'expense') {
          updateBalance(txn.accountId, -amount);
      } else if (txn.type === 'transfer') {
          updateBalance(txn.accountId, -amount);
          if(txn.toAccountId) updateBalance(txn.toAccountId, amount);
      }

      const finalTxn: Transaction = { 
          ...txn, 
          id: txn.id || generateId(), 
          amount, 
          date: txn.date || new Date().toISOString().split('T')[0],
          category: txn.type === 'transfer' ? 'Transfer' : txn.category
      };
      
      setAccounts(updatedAccounts);
      setDebts(updatedDebts);
      setTransactions([finalTxn, ...updatedTransactions]);
      setShowAddTxn(false);
      setEditingTxnId(null);
    };

    if (isEdit) handleConfirmAction("Update Transaction?", "Are you sure? Account balances and debts will be recalculated.", processSave, 'update');
    else processSave();
  };

  const deleteTransaction = (id: string) => {
    handleConfirmAction("Delete Transaction?", "This cannot be undone. Balances and debts will be reverted.", () => {
        const txn = transactions.find(t => t.id === id);
        if (!txn) return;
        
        const amount = Number(txn.amount);
        
        const updateBalance = (id: string, delta: number, accountsCopy: Account[], debtsCopy: Debt[]) => {
            const accIdx = accountsCopy.findIndex(a => a.id === id);
            if (accIdx >= 0) {
                accountsCopy[accIdx].balance += delta;
            } else {
                const debtIdx = debtsCopy.findIndex(d => d.id === id);
                if (debtIdx >= 0) {
                     debtsCopy[debtIdx].amount = Math.max(0, debtsCopy[debtIdx].amount - delta);
                }
            }
        };

        const updatedAccounts = [...accounts];
        const updatedDebts = [...debts];

        if (txn.type === 'income') {
            updateBalance(txn.accountId, -amount, updatedAccounts, updatedDebts);
        } else if (txn.type === 'expense') {
            updateBalance(txn.accountId, amount, updatedAccounts, updatedDebts);
        } else if (txn.type === 'transfer') {
            updateBalance(txn.accountId, amount, updatedAccounts, updatedDebts);
            if(txn.toAccountId) updateBalance(txn.toAccountId, -amount, updatedAccounts, updatedDebts);
        }
        
        setAccounts(updatedAccounts);
        setDebts(updatedDebts);
        setTransactions(transactions.filter(t => t.id !== id));
    });
  };

  const exportToExcel = () => {
    const escapeXml = (str: string | number | undefined | null) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };

    const styles = `<Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Borders/><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/><Interior/><NumberFormat/><Protection/></Style><Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/></Style><Style ss:ID="Title"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#4472C4" ss:Bold="1"/></Style><Style ss:ID="Currency"><NumberFormat ss:Format="Standard"/><Alignment ss:Horizontal="Right"/></Style><Style ss:ID="Date"><NumberFormat ss:Format="Short Date"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="Bold"><Font ss:FontName="Calibri" ss:Bold="1"/></Style></Styles>`;
    
    const createRow = (cells: { value: string | number, style?: string, type?: 'String' | 'Number' }[]) => {
        const cellXml = cells.map(cell => {
            const type = cell.type || (typeof cell.value === 'number' ? 'Number' : 'String');
            const style = cell.style ? ` ss:StyleID="${cell.style}"` : '';
            return `<Cell${style}><Data ss:Type="${type}">${escapeXml(cell.value)}</Data></Cell>`;
        }).join('');
        return `<Row>${cellXml}</Row>`;
    };
    
    const createWorksheet = (name: string, title: string, headers: string[], rows: { value: string | number, style?: string }[][]) => {
        const headerRow = createRow(headers.map(h => ({ value: h, style: 'Header' })));
        const dataRows = rows.map(r => createRow(r)).join('');
        const titleRow = `<Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row><Row></Row>`;
        return `<Worksheet ss:Name="${escapeXml(name)}"><Table><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="200"/>${titleRow}${headerRow}${dataRows}</Table></Worksheet>`;
    };
    
    // Sheet 1: Overview
    const totalAssets = totalWalletBalance + totalInvestmentValue;
    const overviewRows = [
        [{ value: 'Metric', style: 'Bold' }, { value: 'Value', style: 'Currency' }],
        [{ value: 'Total Net Worth' }, { value: totalNetWorth, style: 'Currency' }],
        [{ value: 'Total Liquid Assets' }, { value: totalWalletBalance, style: 'Currency' }],
        [{ value: 'Total Investments' }, { value: totalInvestmentValue, style: 'Currency' }],
        [{ value: 'Total Liabilities' }, { value: totalDebtValue, style: 'Currency' }],
        [{ value: 'Monthly Income' }, { value: monthlyMetrics.income, style: 'Currency' }],
        [{ value: 'Monthly Expense' }, { value: monthlyMetrics.expense, style: 'Currency' }]
    ];
    const sheetOverview = createWorksheet('Overview', 'Financial Snapshot', [], overviewRows);

    // Sheet 2: Accounts
    const accountRows = accounts.map(a => [
        { value: a.name }, { value: a.type }, { value: a.balance, style: 'Currency' }
    ]);
    const sheetAccounts = createWorksheet('Accounts', 'My Accounts', ['Name', 'Type', 'Current Balance'], accountRows);

    // Sheet 3: Debts
    const debtRows = debts.map(d => [
        { value: d.title }, { value: d.type }, { value: d.amount, style: 'Currency' }, { value: d.dueDate || 'N/A' }
    ]);
    const sheetDebts = createWorksheet('Debts', 'Liabilities', ['Title', 'Type', 'Amount Owed', 'Due Date'], debtRows);

    // Sheet 4: Investments
    const investmentRows = investments.map(i => [
        { value: i.name }, { value: i.type }, { value: i.investedAmount, style: 'Currency' }, { value: i.sipAmount || 0, style: 'Currency' }, { value: i.date }
    ]);
    const sheetInvestments = createWorksheet('Investments', 'Investment Portfolio', ['Asset Name', 'Type', 'Total Invested', 'Monthly SIP', 'Start Date'], investmentRows);

    // Sheet 5: Goals
    const goalRows = goals.map(g => [
        { value: g.title }, { value: g.target, style: 'Currency' }, { value: g.current, style: 'Currency' }, { value: g.deadline || 'N/A' }, { value: `${((g.current / g.target) * 100).toFixed(1)}%` }
    ]);
    const sheetGoals = createWorksheet('Goals', 'Financial Goals', ['Goal Title', 'Target Amount', 'Saved', 'Deadline', 'Progress'], goalRows);

    // Sheet 6: Lending
    const lendingRows = lendings.map(l => {
        const repaid = l.payments.reduce((sum, p) => sum + p.amount, 0);
        return [
            { value: l.borrower }, { value: l.totalAmount, style: 'Currency' }, { value: repaid, style: 'Currency' }, { value: l.status.toUpperCase() }, { value: l.date }, { value: l.returnDate || 'N/A' }
        ];
    });
    const sheetLending = createWorksheet('Lending', 'Lending Records', ['Borrower', 'Lent Amount', 'Repaid Amount', 'Status', 'Lent Date', 'Due Date'], lendingRows);

    // Sheet 7: Budgets
    const budgetRows = budgets.map(b => [
        { value: b.category }, { value: b.limit, style: 'Currency' }, { value: `${b.alertThreshold}%` }
    ]);
    const sheetBudgets = createWorksheet('Budgets', 'Monthly Category Budgets', ['Category', 'Limit', 'Alert Threshold'], budgetRows);
    
    // Sheet 8: Subscriptions
    const subRows = subscriptions.map(s => [
        { value: s.name }, { value: s.amount, style: 'Currency' }, { value: s.frequency }, { value: s.type }, { value: s.category }, { value: s.nextDueDate }
    ]);
    const sheetSubs = createWorksheet('Subscriptions', 'Recurring Payments', ['Name', 'Amount', 'Frequency', 'Type', 'Category', 'Next Due'], subRows);

    // Sheet 9: Transactions (Grouped by Year logic from before, but simplified to single sheet for robustness or keep multi-sheet)
    // Let's make one master sheet for transactions to be cleaner
    const txnRows = transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => [
        { value: t.date, style: 'Date' },
        { value: t.type.toUpperCase() },
        { value: t.category },
        { value: Number(t.amount), style: 'Currency' },
        { value: accounts.find(a => a.id === t.accountId)?.name || debts.find(d => d.id === t.accountId)?.title || 'Unknown' },
        { value: t.notes || '' }
    ]);
    const sheetTransactions = createWorksheet('Transactions', 'Transaction History', ['Date', 'Type', 'Category', 'Amount', 'Account', 'Notes'], txnRows);

    const workbookXml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">${styles}${sheetOverview}${sheetAccounts}${sheetTransactions}${sheetDebts}${sheetInvestments}${sheetGoals}${sheetLending}${sheetBudgets}${sheetSubs}</Workbook>`;
    
    const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinTrackPro_Full_Export.xls`;
    link.click();
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify({ 
        accounts, transactions, goals, investments, debts, lendings, budgets, subscriptions, theme, 
        incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes, 
        appMetadata, aiLanguage, aiVoice, currency, currencyRate,
        appPin, isAppLocked, securityQA
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'finance_backup.json');
    linkElement.click();
  };

  const resetData = () => {
    setAccounts([]); setTransactions([]); setGoals([]); setInvestments([]); setDebts([]); setLendings([]); setBudgets([]); setSubscriptions([]);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setDebtTypes(DEFAULT_DEBT_TYPES);
    setInvestmentTypes(DEFAULT_INVESTMENT_TYPES);
    setAccountTypes(DEFAULT_ACCOUNT_TYPES);
    setAppMetadata({ createdAt: new Date().toISOString(), lastModified: new Date().toISOString() });
    setAppPin(null); setIsAppLocked(false); setSecurityQA([]);
    setCurrency('INR'); setCurrencyRate(1);
    localStorage.removeItem('finance_app_data_v10');
    setView('dashboard');
  };

  if (isAppLocked && appPin) {
      return <LockScreen onUnlock={handleUnlock} securityQA={securityQA} onRecoveryUnlock={handleRecoveryUnlock} />;
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans`}>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-slate-200 dark:border-slate-800`}>
        <div className="p-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                FinTrack<span className="text-slate-400 dark:text-slate-500 font-light">Pro</span>
            </h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 dark:text-slate-400">
            <X size={24} />
            </button>
        </div>
        <nav className="mt-6 px-3 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
            {[
            { id: 'dashboard', icon: Briefcase, label: 'Dashboard' },
            { id: 'accounts', icon: Wallet, label: 'Accounts' }, 
            { id: 'debts', icon: CreditCard, label: 'Debts & EMI' },
            { id: 'lending', icon: HandCoins, label: 'Lending' },
            { id: 'transactions', icon: ArrowRightLeft, label: 'Transactions' },
            { id: 'budget', icon: PieChart, label: 'Budgeting' },
            { id: 'investments', icon: TrendingUp, label: 'Investments' },
            { id: 'goals', icon: Target, label: 'Goals' },
            { id: 'ai', icon: Brain, label: 'AI Advisor' },
            { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(item => (
            <button
                key={item.id}
                onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }}
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white'}`}
            >
                <item.icon size={20} className={`mr-3 z-10 transition-transform group-hover:scale-110 ${view === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                <span className="z-10">{item.label}</span>
                {view === item.id && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100" />}
            </button>
            ))}
            
            {/* Lock Button */}
            {appPin && (
                <button
                    onClick={lockApp}
                    className="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 mt-4 group"
                >
                    <Lock size={20} className="mr-3 text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
                    <span>Lock App</span>
                </button>
            )}
        </nav>
      </div>

      <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} actionType={modalConfig.actionType} />
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
      
      {/* Floating Assistant Component */}
      <FloatingAssistant apiKey={process.env.API_KEY} systemInstruction={floatingSystemPrompt} voiceName={aiVoice} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm z-10 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 sticky top-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600 dark:text-slate-300"><Menu size={24} /></button>
          <div className="font-bold text-xl text-slate-900 dark:text-white capitalize ml-4 md:ml-0 flex items-center">{view === 'ai' ? 'AI Advisor' : view.replace('-', ' & ')}</div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-all">
                {lastSaved ? (
                    <>
                        <CheckCircle size={14} className="text-emerald-500 mr-2" />
                        <span className="text-slate-600 dark:text-slate-300">Auto-saved</span>
                    </>
                ) : (
                    <span className="text-slate-400">Syncing...</span>
                )}
            </div>

            <div className="hidden md:block text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Net Worth</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono">{formatCurrency(totalNetWorth)}</p>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 scrollbar-hide bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard */}
            {view === 'dashboard' && <Dashboard transactions={transactions} accounts={accounts} monthlyMetrics={monthlyMetrics} totalNetWorth={totalNetWorth} totalWalletBalance={totalWalletBalance} totalInvestmentValue={totalInvestmentValue} totalDebtValue={totalDebtValue} setView={setView} />}
            
            <div className={view === 'accounts' ? 'block' : 'hidden'}>
                <AccountsModule accounts={accounts} setAccounts={setAccounts} accountTypes={accountTypes} handleConfirmAction={handleConfirmAction} handleSaveTransaction={handleSaveTransaction} incomeCategories={incomeCategories} />
            </div>
            
            <div className={view === 'debts' ? 'block' : 'hidden'}>
                <DebtsModule debts={debts} setDebts={setDebts} debtTypes={debtTypes} handleConfirmAction={handleConfirmAction} handleSaveTransaction={handleSaveTransaction} accounts={accounts} />
            </div>

            <div className={view === 'lending' ? 'block' : 'hidden'}>
                <LendingsModule lendings={lendings} setLendings={setLendings} accounts={accounts} handleSaveTransaction={handleSaveTransaction} handleConfirmAction={handleConfirmAction} />
            </div>

            <div className={view === 'transactions' ? 'block' : 'hidden'}>
                <TransactionModule 
                    transactions={transactions} 
                    setTransactions={setTransactions} 
                    accounts={accounts} 
                    debts={debts} 
                    incomeCategories={incomeCategories} 
                    expenseCategories={expenseCategories} 
                    handleSaveTransaction={handleSaveTransaction} 
                    deleteTransaction={deleteTransaction} 
                    handleEditClick={setEditingTxnId} 
                    editingTxnId={editingTxnId} 
                    showAddTxn={showAddTxn} 
                    setShowAddTxn={setShowAddTxn} 
                    setEditingTxnId={setEditingTxnId}
                    subscriptions={subscriptions}
                    setSubscriptions={setSubscriptions}
                />
            </div>

             <div className={view === 'budget' ? 'block' : 'hidden'}>
                <BudgetModule transactions={transactions} expenseCategories={expenseCategories} budgets={budgets} setBudgets={setBudgets} />
            </div>

            <div className={view === 'investments' ? 'block' : 'hidden'}>
                <InvestmentsModule 
                    investments={investments} 
                    setInvestments={setInvestments} 
                    investmentTypes={investmentTypes} 
                    handleConfirmAction={handleConfirmAction} 
                    accounts={accounts}
                    handleSaveTransaction={handleSaveTransaction}
                />
            </div>

            <div className={view === 'goals' ? 'block' : 'hidden'}>
                <GoalsModule goals={goals} setGoals={setGoals} handleConfirmAction={handleConfirmAction} />
            </div>

            <div className={view === 'ai' ? 'block' : 'hidden'}>
                <AIModule 
                  setView={setView} 
                  transactions={transactions} 
                  accounts={accounts} 
                  investments={investments} 
                  debts={debts} 
                  goals={goals} 
                  lendings={lendings}
                  totalNetWorth={totalNetWorth} 
                  totalDebtValue={totalDebtValue} 
                  monthlyMetrics={monthlyMetrics} 
                  appMetadata={appMetadata} 
                  incomeCategories={incomeCategories} 
                  expenseCategories={expenseCategories} 
                  accountTypes={accountTypes} 
                  investmentTypes={investmentTypes} 
                  debtTypes={debtTypes} 
                  aiLanguage={aiLanguage} 
                  aiVoice={aiVoice} 
                />
            </div>

            {view === 'settings' && <SettingsModule 
                theme={theme} setTheme={setTheme} exportData={exportToJSON} 
                importData={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const fileReader = new FileReader();
                    fileReader.readAsText(file, "UTF-8");
                    fileReader.onload = e => {
                        try {
                            const result = e.target?.result as string;
                            const parsed = JSON.parse(result);
                            // Basic validation
                            if (parsed.accounts && parsed.transactions) {
                                setAccounts(parsed.accounts); setTransactions(parsed.transactions); setGoals(parsed.goals || INITIAL_GOALS); setInvestments(parsed.investments || []); setDebts(parsed.debts || []); setTheme(parsed.theme || 'dark'); setAppMetadata(parsed.appMetadata || { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }); setIncomeCategories(parsed.incomeCategories || DEFAULT_INCOME_CATEGORIES); setExpenseCategories(parsed.expenseCategories || DEFAULT_EXPENSE_CATEGORIES); setDebtTypes(parsed.debtTypes || DEFAULT_DEBT_TYPES); setInvestmentTypes(parsed.investmentTypes || DEFAULT_INVESTMENT_TYPES); setAccountTypes(parsed.accountTypes || DEFAULT_ACCOUNT_TYPES);
                                if(parsed.lendings) setLendings(parsed.lendings);
                                if(parsed.budgets) setBudgets(parsed.budgets);
                                if(parsed.subscriptions) setSubscriptions(parsed.subscriptions);
                                // Restore AI Settings
                                if(parsed.aiLanguage) setAiLanguage(parsed.aiLanguage);
                                if(parsed.aiVoice) setAiVoice(parsed.aiVoice);
                                // Restore Currency
                                if(parsed.currency) setCurrency(parsed.currency);
                                if(parsed.currencyRate) setCurrencyRate(parsed.currencyRate);
                                // Restore Security Settings
                                if(parsed.appPin) setAppPin(parsed.appPin);
                                if(parsed.securityQA) setSecurityQA(parsed.securityQA);
                                alert("Backup restored successfully!");
                            }
                        } catch (err) { alert("Invalid backup file."); }
                    };
                }} 
                exportToExcel={exportToExcel} resetData={resetData} 
                incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories} 
                expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} 
                debtTypes={debtTypes} setDebtTypes={setDebtTypes} 
                investmentTypes={investmentTypes} setInvestmentTypes={setInvestmentTypes} 
                accountTypes={accountTypes} setAccountTypes={setAccountTypes} 
                aiLanguage={aiLanguage} setAiLanguage={setAiLanguage} 
                aiVoice={aiVoice} setAiVoice={setAiVoice} 
                currency={currency} setCurrency={setCurrency}
                currencyRate={currencyRate} setCurrencyRate={setCurrencyRate}
                appPin={appPin} setAppPin={setAppPin} setSecurityQA={setSecurityQA}
                handleSaveTransaction={handleSaveTransaction}
            />}
          </div>
        </main>
      </div>
    </div>
  );
}