import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, ArrowRightLeft, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Transaction, Account, Debt } from '../types';
import { formatCurrency } from '../utils';

interface TransactionModuleProps {
    transactions: Transaction[];
    setTransactions: (txns: Transaction[]) => void;
    accounts: Account[];
    debts: Debt[];
    incomeCategories: string[];
    expenseCategories: string[];
    handleSaveTransaction: (txn: Transaction, isEdit: boolean) => void;
    deleteTransaction: (id: string) => void;
    handleEditClick: (id: string) => void;
    editingTxnId: string | null;
    showAddTxn: boolean;
    setShowAddTxn: (show: boolean) => void;
    setEditingTxnId: (id: string | null) => void;
}

const TransactionModule: React.FC<TransactionModuleProps> = ({ 
    transactions, setTransactions, accounts, debts, incomeCategories, expenseCategories, 
    handleSaveTransaction, deleteTransaction, handleEditClick, editingTxnId, 
    showAddTxn, setShowAddTxn, setEditingTxnId 
}) => {
    const [formData, setFormData] = useState<Transaction>({
      id: '', amount: '', type: 'expense', category: expenseCategories[0] || 'Food', accountId: accounts[0]?.id || '', toAccountId: '', notes: '', date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (editingTxnId) {
            const txn = transactions.find(t => t.id === editingTxnId);
            if (txn) setFormData({ ...txn, toAccountId: txn.toAccountId || '' });
            setShowAddTxn(true);
        } else {
             setFormData(prev => ({ id: '', amount: '', type: 'expense', category: expenseCategories[0] || 'Food', accountId: accounts[0]?.id || '', toAccountId: '', notes: '', date: new Date().toISOString().split('T')[0] }));
        }
    }, [editingTxnId, accounts, expenseCategories, transactions, setShowAddTxn]);

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        handleSaveTransaction(formData, !!editingTxnId); 
    };
    
    const handleCancel = () => { setShowAddTxn(false); setEditingTxnId(null); };
    const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

    // Helper to render mixed options (Accounts + Debts)
    const renderAccountOptions = (includeDebts = false) => {
        return (
            <>
                <optgroup label="Accounts">
                    {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                </optgroup>
                {includeDebts && debts.length > 0 && (
                    <optgroup label="Credit Cards / Debts">
                        {debts.map(d => <option key={d.id} value={d.id} className="dark:bg-slate-800">{d.title} (Debt: {formatCurrency(d.amount)})</option>)}
                    </optgroup>
                )}
            </>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
                <button 
                    onClick={() => { setShowAddTxn(true); setEditingTxnId(null); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={20} className="mr-2" /> Add Transaction
                </button>
            </div>

            {/* Transaction Form (Collapsible) */}
            {showAddTxn && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in-down">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{editingTxnId ? 'Edit Transaction' : 'New Transaction'}</h3>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X size={20}/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Transaction Type Buttons */}
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
                            {(['income', 'expense', 'transfer'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({...formData, type})}
                                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center capitalize ${formData.type === type ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    {type === 'income' ? <TrendingUp size={16} className="mr-2"/> : type === 'expense' ? <TrendingDown size={16} className="mr-2"/> : <ArrowRightLeft size={16} className="mr-2"/>}
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={formData.date} 
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={formData.amount} 
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {formData.type === 'transfer' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">From Account</label>
                                    <select 
                                        value={formData.accountId} 
                                        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {renderAccountOptions(true)} 
                                    </select>
                                </div>
                                <div className="flex items-center justify-center md:pt-6">
                                    <ArrowRight className="text-slate-400 hidden md:block" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">To Account / Debt</label>
                                    <select 
                                        value={formData.toAccountId} 
                                        onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                         <option value="">-- Select Destination --</option>
                                         {renderAccountOptions(true)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{formData.type === 'income' ? 'Deposit To' : 'Pay From'}</label>
                                    <select 
                                        value={formData.accountId} 
                                        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {/* For Expenses, allow Debts (Credit Cards). For Income, allow Debts (Refunds) */}
                                        {renderAccountOptions(true)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <select 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {currentCategories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.notes} 
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Description..."
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 dark:bg-slate-700 dark:text-white font-medium">Cancel</button>
                            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30">Save Transaction</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.map(txn => {
                    const accountName = accounts.find(a => a.id === txn.accountId)?.name || debts.find(d => d.id === txn.accountId)?.title || 'Unknown Account';
                    const toAccountName = txn.toAccountId ? (accounts.find(a => a.id === txn.toAccountId)?.name || debts.find(d => d.id === txn.toAccountId)?.title || 'Unknown') : '';
                    
                    return (
                    <div key={txn.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                txn.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                txn.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                                {txn.type === 'income' ? <TrendingUp size={20} /> : txn.type === 'expense' ? <TrendingDown size={20} /> : <ArrowRightLeft size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{txn.category}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {txn.date} • {txn.type === 'transfer' ? `${accountName} ➔ ${toAccountName}` : accountName}
                                </p>
                                {txn.notes && <p className="text-xs text-slate-400 mt-1 italic">"{txn.notes}"</p>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                             <span className={`font-mono font-bold text-lg ${
                                txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                                txn.type === 'expense' ? 'text-red-500 dark:text-red-400' : 
                                'text-slate-700 dark:text-slate-300'
                            }`}>
                                {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount)}
                            </span>
                            <div className="flex space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(txn.id)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit2 size={16} /></button>
                                <button onClick={() => deleteTransaction(txn.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                )})}
                {transactions.length === 0 && <div className="text-center py-10 text-slate-400 italic">No transactions found.</div>}
            </div>
        </div>
    );
};

export default TransactionModule;