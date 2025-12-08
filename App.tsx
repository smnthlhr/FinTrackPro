import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, TrendingUp, Target, Settings, Brain, Menu, X, ArrowRightLeft, 
  CreditCard, Activity, Briefcase, CheckCircle
} from 'lucide-react';

import { 
  Account, Transaction, Goal, Investment, Debt, AppMetadata 
} from './types';
import { 
  INITIAL_ACCOUNTS, INITIAL_GOALS, INITIAL_DEBTS, 
  DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_DEBT_TYPES, DEFAULT_INVESTMENT_TYPES, DEFAULT_ACCOUNT_TYPES 
} from './constants';
import { formatCurrency, generateId, generateAIContext } from './utils';

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

export default function App() {
  const [view, setView] = useState('dashboard'); 
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [appMetadata, setAppMetadata] = useState<AppMetadata>({
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
  });

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  
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
        setTheme(parsed.theme || 'dark');
        setAppMetadata(parsed.appMetadata || { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() });
        setIncomeCategories(parsed.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setExpenseCategories(parsed.expenseCategories || DEFAULT_EXPENSE_CATEGORIES);
        setDebtTypes(parsed.debtTypes || DEFAULT_DEBT_TYPES);
        setInvestmentTypes(parsed.investmentTypes || DEFAULT_INVESTMENT_TYPES);
        setAccountTypes(parsed.accountTypes || DEFAULT_ACCOUNT_TYPES);
        // Restore view if exists
        if (parsed.view) setView(parsed.view);
      } catch (e) {
        console.error("Data restore failed", e);
      }
    }
  }, []);

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
        accounts, transactions, goals, investments, debts, theme, 
        incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes,
        appMetadata: newMetadata,
        view // Save current view
    };
    localStorage.setItem('finance_app_data_v10', JSON.stringify(dataToSave));
    setLastSaved(new Date());
  }, [accounts, transactions, goals, investments, debts, theme, incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes, view]);

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
    transactions, accounts, investments, debts, goals, appMetadata,
    incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes,
    totalNetWorth, totalDebtValue, monthlyMetrics
  ), [transactions, accounts, investments, debts, goals, appMetadata, incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes, totalNetWorth, totalDebtValue, monthlyMetrics]);

  const floatingSystemPrompt = `You are FinTrackPro's smart voice assistant. User's financial data: ${JSON.stringify(aiContext)}. 
  
  LANGUAGE INSTRUCTIONS:
  - You support English, Hindi (Devanagari/Hinglish), and Bengali.
  - Listen carefully to the user's language and respond in the SAME language.
  - If the user speaks Hindi, reply in Hindi. If Bengali, reply in Bengali.
  - Keep responses concise, friendly, and helpful.`;

  const handleConfirmAction = (title: string, message: string, action: () => void, type: 'delete' | 'update' = 'delete') => {
    setModalConfig({ isOpen: true, title, message, onConfirm: action, actionType: type });
  };

  const handleSaveTransaction = (txn: Transaction, isEdit = false) => {
    const amount = Number(txn.amount);
    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid amount"); return; }
    
    if (txn.type === 'transfer') {
        if (!txn.toAccountId) { alert("Please select a destination account."); return; }
        if (txn.accountId === txn.toAccountId) { alert("Source and destination accounts cannot be the same."); return; }
    }

    const processSave = () => {
      let updatedAccounts = [...accounts];
      let updatedTransactions = [...transactions];
      
      // 1. REVERT OLD TRANSACTION IMPACT (If Editing)
      if (isEdit) {
        const oldTxn = transactions.find(t => t.id === txn.id);
        if (oldTxn) {
          const oldAmt = Number(oldTxn.amount);
          updatedAccounts = updatedAccounts.map(acc => {
            let bal = acc.balance;
            
            // Revert changes on the primary account (Source for Expense/Transfer, Target for Income)
            if (acc.id === oldTxn.accountId) {
              if (oldTxn.type === 'income') bal -= oldAmt;
              else bal += oldAmt; // Expense or Transfer Source (reverting deduction)
            }
            
            // Revert changes on destination account (for Transfer)
            if (oldTxn.type === 'transfer' && acc.id === oldTxn.toAccountId) {
                bal -= oldAmt; // Reverting addition to destination
            }
            
            return { ...acc, balance: bal };
          });
          updatedTransactions = updatedTransactions.filter(t => t.id !== txn.id);
        }
      }

      // 2. APPLY NEW TRANSACTION IMPACT
      updatedAccounts = updatedAccounts.map(acc => {
        let bal = acc.balance;
        
        // Apply to primary account
        if (acc.id === txn.accountId) {
          if (txn.type === 'income') bal += amount;
          else bal -= amount; // Expense or Transfer Source
        }
        
        // Apply to destination account (for Transfer)
        if (txn.type === 'transfer' && acc.id === txn.toAccountId) {
            bal += amount;
        }
        return { ...acc, balance: bal };
      });

      const finalTxn: Transaction = { 
          ...txn, 
          id: txn.id || generateId(), 
          amount, 
          date: txn.date || new Date().toISOString().split('T')[0],
          category: txn.type === 'transfer' ? 'Transfer' : txn.category // Force category name for transfers
      };
      
      setAccounts(updatedAccounts);
      setTransactions([finalTxn, ...updatedTransactions]);
      setShowAddTxn(false);
      setEditingTxnId(null);
    };

    if (isEdit) handleConfirmAction("Update Transaction?", "Are you sure? Account balances will be recalculated.", processSave, 'update');
    else processSave();
  };

  const deleteTransaction = (id: string) => {
    handleConfirmAction("Delete Transaction?", "This cannot be undone. Balances will be reverted.", () => {
        const txn = transactions.find(t => t.id === id);
        if (!txn) return;
        
        const amount = Number(txn.amount);
        const updatedAccounts = accounts.map(acc => {
          let bal = acc.balance;
          
          if (acc.id === txn.accountId) {
            if (txn.type === 'income') bal -= amount; // Revert income addition
            else bal += amount; // Revert expense/transfer deduction
          }
          
          if (txn.type === 'transfer' && acc.id === txn.toAccountId) {
             bal -= amount; // Revert transfer addition
          }
          
          return { ...acc, balance: bal };
        });
        
        setAccounts(updatedAccounts);
        setTransactions(transactions.filter(t => t.id !== id));
    });
  };

  const exportToExcel = () => {
    // Helper to generate table HTML
    const createTable = (title: string, headers: string[], rows: (string | number)[][]) => `
      <tr><td colspan="${headers.length}" style="font-size:16px; font-weight:bold; height:30px;">${title}</td></tr>
      <tr>${headers.map(h => `<th style="background:#f0f0f0; font-weight:bold; border:1px solid #ddd;">${h}</th>`).join('')}</tr>
      ${rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ddd;">${c}</td>`).join('')}</tr>`).join('')}
      <tr><td></td></tr>
    `;

    // 1. Transactions Data
    const txnRows = transactions.map(t => {
        let accName = accounts.find(a=>a.id===t.accountId)?.name || 'Unknown';
        if (t.type === 'transfer') {
             const toAccName = accounts.find(a=>a.id===t.toAccountId)?.name || 'Unknown';
             accName = `${accName} -> ${toAccName}`;
        }
        return [t.date, t.type, t.category, t.amount, t.notes || '-', accName];
    });
    const txnTable = createTable('Transaction History', ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Account Details'], txnRows);

    // 2. Accounts Data
    const accRows = accounts.map(a => [a.name, a.type, a.balance]);
    const accTable = createTable('Accounts Snapshot', ['Account Name', 'Type', 'Balance'], accRows);

    // 3. Investments Data
    const invRows = investments.map(i => [i.date, i.name, i.type, i.investedAmount, i.sipAmount || 0]);
    const invTable = createTable('Investment Portfolio', ['Date', 'Asset Name', 'Type', 'Invested Amount', 'SIP Amount'], invRows);

    // 4. Debts Data
    const debtRows = debts.map(d => [d.title, d.type, d.amount, d.dueDate || '-']);
    const debtTable = createTable('Liabilities & Debts', ['Title', 'Type', 'Amount Owed', 'Due Date'], debtRows);

    // 5. Net Worth Summary
    const summaryRows = [
        ['Total Assets (Cash + Investments)', totalWalletBalance + totalInvestmentValue],
        ['Total Liabilities', totalDebtValue],
        ['NET WORTH', totalNetWorth]
    ];
    const summaryTable = createTable('Financial Summary', ['Metric', 'Value'], summaryRows);

    // Combine into HTML
    const excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>FinTrack Data Export</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table>
          ${summaryTable}
          ${accTable}
          ${txnTable}
          ${invTable}
          ${debtTable}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinTrack_Export_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify({ accounts, transactions, goals, investments, debts, theme, incomeCategories, expenseCategories, debtTypes, investmentTypes, accountTypes, appMetadata }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'finance_backup.json');
    linkElement.click();
  };

  const resetData = () => {
    setAccounts([]);
    setTransactions([]);
    setGoals([]);
    setInvestments([]);
    setDebts([]);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setDebtTypes(DEFAULT_DEBT_TYPES);
    setInvestmentTypes(DEFAULT_INVESTMENT_TYPES);
    setAccountTypes(DEFAULT_ACCOUNT_TYPES);
    setAppMetadata({ createdAt: new Date().toISOString(), lastModified: new Date().toISOString() });
    
    // Clear localStorage
    localStorage.removeItem('finance_app_data_v10');
    setView('dashboard');
  };

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
        <nav className="mt-6 px-3 space-y-2">
            {[
            { id: 'dashboard', icon: Briefcase, label: 'Dashboard' },
            { id: 'accounts', icon: Wallet, label: 'Accounts' }, 
            { id: 'debts', icon: CreditCard, label: 'Debts & EMI' },
            { id: 'transactions', icon: ArrowRightLeft, label: 'Transactions' },
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
        </nav>
      </div>

      <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} actionType={modalConfig.actionType} />
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
      
      {/* Floating Assistant Component */}
      <FloatingAssistant apiKey={process.env.API_KEY} systemInstruction={floatingSystemPrompt} />

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
            {/* Dashboard needs to be conditional for re-charts to size correctly on mount */}
            {view === 'dashboard' && <Dashboard transactions={transactions} accounts={accounts} monthlyMetrics={monthlyMetrics} totalNetWorth={totalNetWorth} totalWalletBalance={totalWalletBalance} totalInvestmentValue={totalInvestmentValue} totalDebtValue={totalDebtValue} setView={setView} />}
            
            {/* Keeping other modules mounted but hidden preserves form state */}
            <div className={view === 'accounts' ? 'block' : 'hidden'}>
                <AccountsModule accounts={accounts} setAccounts={setAccounts} accountTypes={accountTypes} handleConfirmAction={handleConfirmAction} handleSaveTransaction={handleSaveTransaction} incomeCategories={incomeCategories} />
            </div>
            
            <div className={view === 'debts' ? 'block' : 'hidden'}>
                <DebtsModule debts={debts} setDebts={setDebts} debtTypes={debtTypes} handleConfirmAction={handleConfirmAction} />
            </div>

            <div className={view === 'transactions' ? 'block' : 'hidden'}>
                <TransactionModule transactions={transactions} setTransactions={setTransactions} accounts={accounts} incomeCategories={incomeCategories} expenseCategories={expenseCategories} handleSaveTransaction={handleSaveTransaction} deleteTransaction={deleteTransaction} handleEditClick={setEditingTxnId} editingTxnId={editingTxnId} showAddTxn={showAddTxn} setShowAddTxn={setShowAddTxn} setEditingTxnId={setEditingTxnId} />
            </div>

            <div className={view === 'investments' ? 'block' : 'hidden'}>
                <InvestmentsModule investments={investments} setInvestments={setInvestments} investmentTypes={investmentTypes} handleConfirmAction={handleConfirmAction} />
            </div>

            <div className={view === 'goals' ? 'block' : 'hidden'}>
                <GoalsModule goals={goals} setGoals={setGoals} handleConfirmAction={handleConfirmAction} />
            </div>

            <div className={view === 'ai' ? 'block' : 'hidden'}>
                <AIModule setView={setView} transactions={transactions} accounts={accounts} investments={investments} debts={debts} goals={goals} totalNetWorth={totalNetWorth} totalDebtValue={totalDebtValue} monthlyMetrics={monthlyMetrics} appMetadata={appMetadata} incomeCategories={incomeCategories} expenseCategories={expenseCategories} accountTypes={accountTypes} investmentTypes={investmentTypes} debtTypes={debtTypes} />
            </div>

            {view === 'settings' && <SettingsModule theme={theme} setTheme={setTheme} exportData={exportToJSON} importData={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const fileReader = new FileReader();
                fileReader.readAsText(file, "UTF-8");
                fileReader.onload = e => {
                    try {
                        const result = e.target?.result as string;
                        const parsed = JSON.parse(result);
                        if (parsed.accounts && parsed.transactions) {
                            setAccounts(parsed.accounts); setTransactions(parsed.transactions); setGoals(parsed.goals || INITIAL_GOALS); setInvestments(parsed.investments || []); setDebts(parsed.debts || []); setTheme(parsed.theme || 'dark'); setAppMetadata(parsed.appMetadata || { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }); setIncomeCategories(parsed.incomeCategories || DEFAULT_INCOME_CATEGORIES); setExpenseCategories(parsed.expenseCategories || DEFAULT_EXPENSE_CATEGORIES); setDebtTypes(parsed.debtTypes || DEFAULT_DEBT_TYPES); setInvestmentTypes(parsed.investmentTypes || DEFAULT_INVESTMENT_TYPES); setAccountTypes(parsed.accountTypes || DEFAULT_ACCOUNT_TYPES);
                            alert("Backup restored successfully!");
                        }
                    } catch (err) { alert("Invalid backup file."); }
                };
            }} exportToExcel={exportToExcel} resetData={resetData} incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} debtTypes={debtTypes} setDebtTypes={setDebtTypes} investmentTypes={investmentTypes} setInvestmentTypes={setInvestmentTypes} accountTypes={accountTypes} setAccountTypes={setAccountTypes} />}
          </div>
        </main>
      </div>
    </div>
  );
}