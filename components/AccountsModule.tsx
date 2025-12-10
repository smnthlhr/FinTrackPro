import React, { useState } from 'react';
import { Wallet, Brain, Plus, Edit2, Trash2, TrendingUp, CreditCard, ShieldAlert, Calendar, AlertCircle } from 'lucide-react';
import { Account, Transaction, Debt } from '../types';
import { generateId, formatCurrency } from '../utils';

interface AccountsModuleProps {
    accounts: Account[];
    setAccounts: (accounts: Account[]) => void;
    accountTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
    handleSaveTransaction: (txn: Transaction, isEdit?: boolean) => void;
    incomeCategories: string[];
    debts: Debt[];
}

const AccountsModule: React.FC<AccountsModuleProps> = ({ 
    accounts, setAccounts, accountTypes, handleConfirmAction, 
    handleSaveTransaction, incomeCategories, debts
}) => {
    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState(accountTypes[0] || 'Bank');
    const [isCreditAccount, setIsCreditAccount] = useState(false);
    const [creditLimit, setCreditLimit] = useState('');
    const [usedAmount, setUsedAmount] = useState(''); 
    const [availableAmount, setAvailableAmount] = useState(''); // New state for bidirectional calc
    const [initialBalance, setInitialBalance] = useState(''); 
    const [billingDay, setBillingDay] = useState('');
    const [maskedNumber, setMaskedNumber] = useState('');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editBalance, setEditBalance] = useState('');
    const [editCreditLimit, setEditCreditLimit] = useState('');
    const [editUsedAmount, setEditUsedAmount] = useState(''); 
    const [editBillingDay, setEditBillingDay] = useState('');
    const [editMaskedNumber, setEditMaskedNumber] = useState('');

    // Income Modal State
    const [incomeModalAccount, setIncomeModalAccount] = useState<string | null>(null);
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeCategory, setIncomeCategory] = useState(incomeCategories[0] || 'Salary');
    const [incomeNote, setIncomeNote] = useState('');

    // Auto-calculation handlers for Add Form
    const handleAddCalc = (field: 'total' | 'used' | 'avail', val: string) => {
        const v = parseFloat(val) || 0;
        if (field === 'total') {
            setCreditLimit(val);
            const u = parseFloat(usedAmount) || 0;
            setAvailableAmount((v - u).toString());
        } else if (field === 'used') {
            setUsedAmount(val);
            const t = parseFloat(creditLimit) || 0;
            setAvailableAmount((t - v).toString());
        } else if (field === 'avail') {
            setAvailableAmount(val);
            const t = parseFloat(creditLimit) || 0;
            setUsedAmount((t - v).toString());
        }
    };

    // Auto-calculation handlers for Edit Form
    const handleEditCalc = (field: 'total' | 'used' | 'avail', val: string) => {
        const v = parseFloat(val) || 0;
        if (field === 'total') {
            setEditCreditLimit(val);
            const u = parseFloat(editUsedAmount) || 0;
            setEditBalance((v - u).toString()); // Balance is Available
        } else if (field === 'used') {
            setEditUsedAmount(val);
            const t = parseFloat(editCreditLimit) || 0;
            setEditBalance((t - v).toString());
        } else if (field === 'avail') {
            setEditBalance(val);
            const t = parseFloat(editCreditLimit) || 0;
            setEditUsedAmount((t - v).toString());
        }
    };

    const handleAddAccount = () => {
      if (!newAccountName.trim()) return;
      
      let finalBalance = 0;
      let limitVal = 0;

      if (isCreditAccount) {
          limitVal = parseFloat(creditLimit) || 0;
          // Available Amount corresponds to 'balance' for credit accounts
          finalBalance = parseFloat(availableAmount) || 0;
      } else {
          finalBalance = parseFloat(initialBalance) || 0;
      }

      const newAcc: Account = { 
        id: generateId(), 
        name: newAccountName, 
        type: newAccountType, 
        balance: finalBalance,
        isCredit: isCreditAccount,
        creditLimit: isCreditAccount ? limitVal : undefined,
        billingDay: isCreditAccount ? (parseInt(billingDay) || undefined) : undefined,
        maskedNumber: isCreditAccount ? maskedNumber : undefined
      };
      
      setAccounts([...accounts, newAcc]);
      
      // Reset Form
      setNewAccountName('');
      setInitialBalance('');
      setCreditLimit('');
      setUsedAmount('');
      setAvailableAmount('');
      setIsCreditAccount(false);
      setBillingDay('');
      setMaskedNumber('');
      setIsAdding(false);
    };

    const startEditing = (acc: Account) => {
        setEditingId(acc.id);
        setEditName(acc.name);
        
        if (acc.isCredit) {
            setEditCreditLimit(acc.creditLimit ? String(acc.creditLimit) : '');
            setEditBalance(String(acc.balance)); // Available
            // Calculate Used based on Total - Available(balance)
            const used = (acc.creditLimit || 0) - acc.balance;
            setEditUsedAmount(String(used));
        } else {
            setEditBalance(String(acc.balance));
        }

        setEditBillingDay(acc.billingDay ? String(acc.billingDay) : '');
        setEditMaskedNumber(acc.maskedNumber || '');
    };

    const saveEdit = (acc: Account) => {
        if(!editName.trim()) return;
        
        let finalBalance = 0;
        if (acc.isCredit) {
            // Balance is Available Credit
            finalBalance = parseFloat(editBalance) || 0; 
        } else {
            finalBalance = parseFloat(editBalance) || 0;
        }

        const updatedAcc = {
            ...acc,
            name: editName,
            balance: finalBalance,
            creditLimit: acc.isCredit ? (parseFloat(editCreditLimit) || 0) : undefined,
            billingDay: acc.isCredit ? (parseInt(editBillingDay) || undefined) : undefined,
            maskedNumber: acc.isCredit ? editMaskedNumber : undefined
        };

        setAccounts(accounts.map(a => a.id === editingId ? updatedAcc : a));
        setEditingId(null);
    };

    const deleteAccount = (id: string) => {
        handleConfirmAction("Delete Account", "Are you sure? This will hide the account from your dashboard and transactions may lose their reference.", () => {
             setAccounts(accounts.filter(a => a.id !== id));
        });
    };

    const openIncomeModal = (accountId: string) => {
        setIncomeModalAccount(accountId);
        setIncomeAmount('');
        setIncomeCategory(incomeCategories[0] || 'Salary');
        setIncomeNote('');
    };

    const submitIncome = () => {
        if (!incomeModalAccount || !incomeAmount) return;
        const amount = parseFloat(incomeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const newTxn: Transaction = {
            id: generateId(),
            amount: amount,
            type: 'income',
            category: incomeCategory,
            accountId: incomeModalAccount,
            notes: incomeNote,
            date: new Date().toISOString().split('T')[0]
        };

        handleSaveTransaction(newTxn);
        setIncomeModalAccount(null);
    };

    // Separate accounts into assets and liabilities (credit)
    const assetAccounts = accounts.filter(a => !a.isCredit);
    const creditAccounts = accounts.filter(a => a.isCredit);

    // Helper to calculate progress bar width safely
    const calculateProgress = (acc: Account) => {
        if (!acc.creditLimit || acc.creditLimit === 0) return 0;
        const used = acc.creditLimit - acc.balance;
        const percent = (used / acc.creditLimit) * 100;
        return Math.max(0, Math.min(percent, 100));
    };

    const getProgressColor = (percent: number) => {
        if (percent > 80) return 'bg-red-500';
        if (percent > 50) return 'bg-amber-500';
        return 'bg-blue-500';
    };

    return (
        <div className="space-y-8 relative pb-20">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Accounts</h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={20} className="mr-2" /> Add Account
                </button>
            </div>

            {/* Income Modal */}
            {incomeModalAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Income / Repayment</h3>
                            <button onClick={() => setIncomeModalAccount(null)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                <span className="text-2xl font-light">&times;</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={incomeAmount} 
                                    onChange={e => setIncomeAmount(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Source / Category</label>
                                <select 
                                    value={incomeCategory} 
                                    onChange={e => setIncomeCategory(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    {incomeCategories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Description (Optional)</label>
                                <input 
                                    type="text" 
                                    value={incomeNote} 
                                    onChange={e => setIncomeNote(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. Freelance project A"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setIncomeModalAccount(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors hover:bg-slate-200">Cancel</button>
                            <button onClick={submitIncome} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">Add Funds</button>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                        <input 
                            type="text" 
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="e.g., HDFC Bank, SBI Credit Card"
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                        <select 
                            value={newAccountType} 
                            onChange={(e) => {
                                setNewAccountType(e.target.value);
                                if (['Credit Card', 'Lending Platform'].includes(e.target.value)) {
                                    setIsCreditAccount(true);
                                }
                            }}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {accountTypes.map(t => <option key={t} value={t} className="dark:bg-slate-800">{t}</option>)}
                        </select>
                    </div>

                    <div className="col-span-2">
                         <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <input 
                                type="checkbox" 
                                checked={isCreditAccount} 
                                onChange={e => setIsCreditAccount(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">This is a Credit / Lending Account</span>
                                <p className="text-xs text-slate-500">Enable this for Credit Cards to track limit utilization.</p>
                            </div>
                        </label>
                    </div>
                    
                    {isCreditAccount ? (
                         <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Credit Limit</label>
                                <input 
                                    type="number" 
                                    value={creditLimit} 
                                    onChange={(e) => handleAddCalc('total', e.target.value)}
                                    placeholder="e.g. 100000"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Used Amount (Debt)</label>
                                <input 
                                    type="number" 
                                    value={usedAmount} 
                                    onChange={(e) => handleAddCalc('used', e.target.value)}
                                    placeholder="e.g. 12000"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Available Credit</label>
                                <input 
                                    type="number" 
                                    value={availableAmount} 
                                    onChange={(e) => handleAddCalc('avail', e.target.value)}
                                    placeholder="Calculated automatically"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Billing Day (1-31)</label>
                                <input 
                                    type="number" 
                                    value={billingDay} 
                                    onChange={(e) => setBillingDay(e.target.value)}
                                    placeholder="e.g. 5"
                                    min="1"
                                    max="31"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Last 4 Digits</label>
                                <input 
                                    type="text" 
                                    value={maskedNumber} 
                                    onChange={(e) => setMaskedNumber(e.target.value.slice(0, 4))}
                                    placeholder="e.g. 1234"
                                    maxLength={4}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                         </>
                    ) : (
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Balance</label>
                            <input 
                                type="number" 
                                value={initialBalance} 
                                onChange={(e) => setInitialBalance(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    <div className="col-span-2 flex gap-3 pt-2">
                         <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                         <button onClick={handleAddAccount} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium">Create Account</button>
                    </div>
                </div>
            )}
            
            {/* Section 1: Liquid Assets */}
            {assetAccounts.length > 0 && (
                <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <Wallet className="mr-2 text-emerald-500" size={20}/> Cash & Bank Accounts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assetAccounts.map(acc => (
                            <div key={acc.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative group hover:shadow-lg hover:border-blue-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
                                            {acc.type === 'Crypto Wallet' ? <Brain size={24} className="text-purple-500" /> : <Wallet size={24} className="text-blue-500" />}
                                        </div>
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditing(acc)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-500" title="Edit"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteAccount(acc.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    
                                    {editingId === acc.id ? (
                                        <div className="space-y-3 mb-2">
                                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold text-sm" placeholder="Account Name"/>
                                            <div>
                                                 <label className="text-[10px] text-slate-400 uppercase font-bold">Current Balance</label>
                                                 <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold"/>
                                            </div>
                                            <div className="flex space-x-2 text-sm pt-2">
                                                <button onClick={() => saveEdit(acc)} className="flex-1 bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600">Save</button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-200">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center">{acc.name}</h3>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">{acc.type}</p>
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(acc.balance)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {!editingId && (
                                    <button onClick={() => openIncomeModal(acc.id)} className="mt-4 w-full py-2 flex items-center justify-center text-sm font-semibold rounded-xl transition-colors text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                                        <TrendingUp size={16} className="mr-2" /> Add Income
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Credit Liabilities */}
            {(creditAccounts.length > 0 || debts.length > 0) && (
                 <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 mt-8 flex items-center">
                        <ShieldAlert className="mr-2 text-indigo-500" size={20}/> Credit Cards & Liabilities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creditAccounts.map(acc => {
                            const progress = calculateProgress(acc);
                            const progressColor = getProgressColor(progress);
                            const usedAmount = (acc.creditLimit || 0) - acc.balance;

                            return (
                                <div key={acc.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative group hover:shadow-lg hover:border-blue-500/30 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                                <CreditCard size={24} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditing(acc)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-500"><Edit2 size={16}/></button>
                                                <button onClick={() => deleteAccount(acc.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                        </div>

                                        {editingId === acc.id ? (
                                            <div className="space-y-3 mb-2">
                                                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold text-sm" placeholder="Account Name"/>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold">Total Limit</label>
                                                    <input type="number" value={editCreditLimit} onChange={(e) => handleEditCalc('total', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold"/>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold">Used Amount (Debt)</label>
                                                    <input type="number" value={editUsedAmount} onChange={(e) => handleEditCalc('used', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold"/>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold">Available Credit</label>
                                                    <input type="number" value={editBalance} onChange={(e) => handleEditCalc('avail', e.target.value)} className="w-full p-2 border rounded bg-white text-emerald-700 dark:text-emerald-400 dark:bg-slate-900 dark:border-slate-600 font-bold"/>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input value={editMaskedNumber} onChange={(e) => setEditMaskedNumber(e.target.value.slice(0,4))} placeholder="1234" className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold text-sm flex-1"/>
                                                    <input type="number" value={editBillingDay} onChange={(e) => setEditBillingDay(e.target.value)} placeholder="DD" className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 font-bold text-sm flex-1"/>
                                                </div>
                                                <div className="flex space-x-2 text-sm pt-2">
                                                    <button onClick={() => saveEdit(acc)} className="flex-1 bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-200">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center">
                                                    {acc.name}
                                                    {acc.maskedNumber && <span className="ml-2 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">...{acc.maskedNumber}</span>}
                                                </h3>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold flex items-center justify-between">
                                                    {acc.type}
                                                    {acc.billingDay && <span className="flex items-center text-[10px] text-orange-500"><Calendar size={10} className="mr-1"/> Bill on {acc.billingDay}th</span>}
                                                </p>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Total Limit</p>
                                                            <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(acc.creditLimit)}</p>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Available</p>
                                                            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(acc.balance)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative pt-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-medium text-slate-500">Used: <span className="text-slate-700 dark:text-slate-300">{formatCurrency(usedAmount)}</span></span>
                                                            <span className="text-xs font-bold text-red-500 font-mono">{progress.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                             <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!editingId && (
                                        <button onClick={() => openIncomeModal(acc.id)} className="mt-4 w-full py-2 flex items-center justify-center text-sm font-semibold rounded-xl transition-colors text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                                            <TrendingUp size={16} className="mr-2" /> Pay Bill / Add Limit
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        
                        {/* Read-only Debts */}
                        {debts.map(d => (
                            <div key={d.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl shadow-none border border-slate-200 dark:border-slate-700 opacity-80 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800">
                                            <CreditCard size={24} className="text-slate-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">{d.title}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">{d.type} (Manual Debt)</p>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 mb-1">Amount Owed</p>
                                        <p className="text-2xl font-bold text-red-500 font-mono">-{formatCurrency(d.amount)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-[10px] text-slate-400 justify-center bg-slate-200 dark:bg-slate-800 py-1.5 rounded-lg">
                                    <AlertCircle size={10} className="mr-1"/> Manage in 'Debts & EMI'
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {accounts.length === 0 && debts.length === 0 && !isAdding && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No accounts found. Add your first bank account or credit card.</p>
                </div>
            )}
        </div>
    );
};

export default AccountsModule;