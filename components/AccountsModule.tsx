import React, { useState } from 'react';
import { Wallet, Brain, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { Account, Transaction } from '../types';
import { generateId, formatCurrency } from '../utils';

interface AccountsModuleProps {
    accounts: Account[];
    setAccounts: (accounts: Account[]) => void;
    accountTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
    handleSaveTransaction: (txn: Transaction, isEdit?: boolean) => void;
    incomeCategories: string[];
}

const AccountsModule: React.FC<AccountsModuleProps> = ({ 
    accounts, setAccounts, accountTypes, handleConfirmAction, 
    handleSaveTransaction, incomeCategories 
}) => {
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState(accountTypes[0] || 'Bank');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editBalance, setEditBalance] = useState('');

    // Add Income Modal State
    const [incomeModalAccount, setIncomeModalAccount] = useState<string | null>(null);
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeCategory, setIncomeCategory] = useState(incomeCategories[0] || 'Salary');
    const [incomeNote, setIncomeNote] = useState('');

    const handleAddAccount = () => {
      if (!newAccountName.trim()) return;
      const newAcc: Account = { 
        id: generateId(), 
        name: newAccountName, 
        type: newAccountType, 
        balance: 0 
      };
      setAccounts([...accounts, newAcc]);
      setNewAccountName('');
      setIsAdding(false);
    };

    const startEditing = (acc: Account) => {
        setEditingId(acc.id);
        setEditName(acc.name);
        setEditBalance(String(acc.balance));
    };

    const saveEdit = () => {
        if(!editName.trim()) return;
        setAccounts(accounts.map(a => a.id === editingId ? {...a, name: editName, balance: parseFloat(editBalance) || 0} : a));
        setEditingId(null);
    };

    const deleteAccount = (id: string) => {
        handleConfirmAction("Delete Account", "Are you sure? This will hide the account from your dashboard.", () => {
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Accounts</h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={20} className="mr-2" /> Add Account
                </button>
            </div>

            {/* Income Modal Overlay */}
            {incomeModalAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Income</h3>
                            <button onClick={() => setIncomeModalAccount(null)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                <Trash2 size={20} className="hidden" /> {/* Placeholder for layout, maybe an X icon */}
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
                            <button onClick={submitIncome} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">Add Income</button>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-down">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                        <input 
                            type="text" 
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="e.g., HDFC Bank, Secret Stash"
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                        <select 
                            value={newAccountType} 
                            onChange={(e) => setNewAccountType(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {accountTypes.map(t => <option key={t} value={t} className="dark:bg-slate-800">{t}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAddAccount} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium col-span-2">Create Account</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative group hover:shadow-lg hover:border-blue-500/30 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                                    {acc.type === 'Crypto Wallet' ? <Brain size={24} className="text-purple-500" /> : <Wallet size={24} className="text-blue-500" />}
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditing(acc)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-500" title="Edit">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => deleteAccount(acc.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                            
                            {editingId === acc.id ? (
                                <div className="space-y-3 mb-2">
                                    <input 
                                        value={editName} 
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-bold"
                                    />
                                    <input 
                                        type="number"
                                        value={editBalance} 
                                        onChange={(e) => setEditBalance(e.target.value)}
                                        className="w-full p-2 border rounded bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-bold"
                                    />
                                    <div className="flex space-x-2 text-sm pt-2">
                                        <button onClick={saveEdit} className="bg-blue-500 text-white px-3 py-1 rounded">Save</button>
                                        <button onClick={() => setEditingId(null)} className="text-slate-500 px-3 py-1">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{acc.name}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">{acc.type}</p>
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(acc.balance)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {!editingId && (
                            <button 
                                onClick={() => openIncomeModal(acc.id)}
                                className="mt-4 w-full py-2 flex items-center justify-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors"
                            >
                                <TrendingUp size={16} className="mr-2" /> Add Income
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountsModule;