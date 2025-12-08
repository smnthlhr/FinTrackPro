import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, ArrowRightLeft, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatCurrency } from '../utils';

interface TransactionModuleProps {
    transactions: Transaction[];
    setTransactions: (txns: Transaction[]) => void;
    accounts: Account[];
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
    transactions, setTransactions, accounts, incomeCategories, expenseCategories, 
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

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
          <button 
            onClick={() => { setEditingTxnId(null); setShowAddTxn(!showAddTxn); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
          >
            {showAddTxn && !editingTxnId ? <X size={20} className="mr-2"/> : <Plus size={20} className="mr-2" />}
            {showAddTxn && !editingTxnId ? 'Close' : 'Add Transaction'}
          </button>
        </div>

        {showAddTxn && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in-down slide-in-from-top-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                {editingTxnId ? 'Edit Transaction' : 'New Transaction'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                <div className="flex space-x-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'expense', category: expenseCategories[0] || ''})}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500'}`}
                  >Expense</button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'income', category: incomeCategories[0] || ''})}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >Income</button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'transfer', category: 'Transfer', toAccountId: accounts.find(a => a.id !== formData.accountId)?.id || ''})}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.type === 'transfer' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >Transfer</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">₹</span>
                    <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-8 p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="0.00"
                    />
                </div>
              </div>

              {formData.type === 'transfer' ? (
                  <>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">From Account</label>
                        <select 
                        value={formData.accountId}
                        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                        className="w-full p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">To Account</label>
                        <select 
                        value={formData.toAccountId}
                        onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                        className="w-full p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="">Select Destination</option>
                        {accounts.filter(a => a.id !== formData.accountId).map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                        </select>
                    </div>
                  </>
              ) : (
                  <>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                        <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {currentCategories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account</label>
                        <select 
                        value={formData.accountId}
                        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                        className="w-full p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                        </select>
                    </div>
                  </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Details</label>
                <div className="flex gap-4">
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none"
                  />
                  <input 
                    type="text" 
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="flex-1 p-3 rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a note..."
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={handleCancel} className="px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105">{editingTxnId ? 'Update' : 'Save'} Transaction</button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Amount</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {transactions.map(txn => {
                const fromAccName = accounts.find(a => a.id === txn.accountId)?.name || 'Unknown';
                const toAccName = txn.type === 'transfer' ? accounts.find(a => a.id === txn.toAccountId)?.name : '';
                
                return (
                <tr key={txn.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-medium text-sm">{txn.date}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${txn.type === 'transfer' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {txn.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    {txn.type === 'transfer' ? (
                        <div className="flex items-center space-x-1">
                            <span>{fromAccName}</span>
                            <ArrowRight size={12} className="text-slate-400"/>
                            <span>{toAccName}</span>
                        </div>
                    ) : (
                        fromAccName
                    )}
                  </td>
                  <td className={`p-4 text-right font-bold font-mono ${
                      txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                      txn.type === 'expense' ? 'text-red-500 dark:text-red-400' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                     {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(txn.id)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteTransaction(txn.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <ArrowRightLeft size={24}/>
                </div>
                <h3 className="text-slate-900 dark:text-white font-medium mb-1">No transactions yet</h3>
                <p className="text-slate-500 text-sm">Add your first income or expense to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    );
};

export default TransactionModule;