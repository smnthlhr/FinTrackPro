import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Repeat, Play, Pause, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Subscription, Account, Debt } from '../types';
import { generateId, formatCurrency } from '../utils';

interface SubscriptionsModuleProps {
    subscriptions: Subscription[];
    setSubscriptions: (subs: Subscription[]) => void;
    accounts: Account[];
    debts: Debt[];
    expenseCategories: string[];
    incomeCategories: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
}

const SubscriptionsModule: React.FC<SubscriptionsModuleProps> = ({ 
    subscriptions, setSubscriptions, accounts, debts, expenseCategories, incomeCategories, handleConfirmAction 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Subscription>({
        id: '', 
        name: '', 
        amount: 0, 
        type: 'expense', 
        category: 'EMI', 
        accountId: '', 
        frequency: 'monthly', 
        nextDueDate: new Date().toISOString().split('T')[0], 
        isActive: true
    });

    // Effect to set default account if one isn't selected
    useEffect(() => {
        if (isAdding && !formData.accountId) {
            if (accounts.length > 0) {
                setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
            } else if (debts.length > 0) {
                setFormData(prev => ({ ...prev, accountId: debts[0].id }));
            }
        }
    }, [isAdding, accounts, debts, formData.accountId]);

    const resetForm = () => {
        let defaultAcc = '';
        if (accounts.length > 0) defaultAcc = accounts[0].id;
        else if (debts.length > 0) defaultAcc = debts[0].id;

        setFormData({
            id: '', 
            name: '', 
            amount: 0, 
            type: 'expense', 
            category: 'EMI', 
            accountId: defaultAcc, 
            frequency: 'monthly', 
            nextDueDate: new Date().toISOString().split('T')[0], 
            isActive: true
        });
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!formData.name || formData.amount <= 0) {
            alert("Please enter a valid name and amount.");
            return;
        }
        if (!formData.accountId) {
            alert("Please select an account or credit card.");
            return;
        }

        if (formData.id) {
            // Edit existing
            setSubscriptions(subscriptions.map(s => s.id === formData.id ? formData : s));
        } else {
            // Add new
            setSubscriptions([...subscriptions, { ...formData, id: generateId() }]);
        }
        resetForm();
    };

    const handleEdit = (sub: Subscription) => {
        setFormData(sub);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        handleConfirmAction("Delete Subscription", "Are you sure? This will stop future auto-deductions. Past transactions will remain.", () => {
            setSubscriptions(subscriptions.filter(s => s.id !== id));
        });
    };

    const toggleStatus = (id: string) => {
        setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    };

    const getAccountName = (id: string) => {
        const acc = accounts.find(a => a.id === id);
        if (acc) return acc.name;
        const debt = debts.find(d => d.id === id);
        if (debt) return debt.title;
        return 'Unknown Account';
    };

    const monthlyTotal = subscriptions
        .filter(s => s.isActive && s.type === 'expense')
        .reduce((sum, s) => sum + s.amount, 0);

    const assetAccounts = accounts.filter(a => !a.isCredit);
    const creditAccounts = accounts.filter(a => a.isCredit);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Subscriptions & EMI</h2>
                    <p className="text-slate-500 text-sm">Manage recurring payments and auto-debits</p>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hidden md:block">
                        <p className="text-xs text-slate-500 uppercase font-bold">Monthly Commitment</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(monthlyTotal)}</p>
                     </div>
                     <button 
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-medium"
                    >
                        <Plus size={20} className="mr-2" /> Add New
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-down">
                    <div className="col-span-1 md:col-span-2 border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{formData.id ? 'Edit Subscription' : 'New Subscription / EMI'}</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name / Title</label>
                        <input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="e.g. Home Loan EMI, Netflix, Gym" 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                        <input 
                            type="number" 
                            value={formData.amount || ''} 
                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                            placeholder="0.00" 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                        <select 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value as any})} 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        >
                            <option value="expense">Expense (EMI/Bill)</option>
                            <option value="income">Income (Salary/Rent)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})} 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        >
                             {(formData.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deduct/Credit Account</label>
                        <select 
                            value={formData.accountId} 
                            onChange={e => setFormData({...formData, accountId: e.target.value})} 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        >
                            <option value="" disabled>-- Select Account --</option>
                            <optgroup label="Bank & Cash">
                                {assetAccounts.map(a => (
                                    <option key={a.id} value={a.id} className="dark:bg-slate-800">
                                        {a.name} ({formatCurrency(a.balance)})
                                    </option>
                                ))}
                            </optgroup>
                            {(creditAccounts.length > 0 || debts.length > 0) && (
                                <optgroup label="Credit Cards & Liabilities">
                                    {creditAccounts.map(a => (
                                        <option key={a.id} value={a.id} className="dark:bg-slate-800">
                                            {a.name} (Avail: {formatCurrency(a.balance)})
                                        </option>
                                    ))}
                                    {debts.map(d => (
                                        <option key={d.id} value={d.id} className="dark:bg-slate-800">
                                            {d.title} (Debt: {formatCurrency(d.amount)})
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        {(accounts.length === 0 && debts.length === 0) && <p className="text-xs text-red-500 mt-1">No accounts found. Please add an account first.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Due Date</label>
                        <input 
                            type="date" 
                            value={formData.nextDueDate} 
                            onChange={e => setFormData({...formData, nextDueDate: e.target.value})} 
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none" 
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex space-x-3 mt-4">
                        <button onClick={resetForm} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button onClick={handleSave} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium transition-colors hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                            {formData.id ? 'Update Subscription' : 'Start Subscription'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map(sub => (
                    <div key={sub.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border transition-all relative group hover:shadow-md ${sub.isActive ? 'border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${!sub.isActive ? 'bg-slate-100 text-slate-400' : sub.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                    {sub.type === 'income' ? <TrendingUp size={20} /> : <CreditCard size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{sub.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{sub.category}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => toggleStatus(sub.id)} className={`p-2 rounded-lg transition-colors ${sub.isActive ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-100'}`} title={sub.isActive ? "Pause" : "Resume"}>
                                    {sub.isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                </button>
                                <button onClick={() => handleEdit(sub)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(sub.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-t border-slate-50 dark:border-slate-700/50">
                                <span className="text-sm text-slate-500">Amount</span>
                                <span className={`font-bold font-mono text-lg ${sub.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                    {formatCurrency(sub.amount)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Calendar size={14} className="mr-2" /> Next Due
                                </div>
                                <span className={`text-sm font-semibold ${sub.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                    {sub.nextDueDate}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex items-center text-sm text-slate-500">
                                    <CreditCard size={14} className="mr-2" /> Account
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                    {getAccountName(sub.accountId)}
                                </span>
                            </div>

                             <div className="text-xs text-slate-400 mt-2 text-center bg-slate-50 dark:bg-slate-900/50 py-1.5 rounded-lg">
                                {sub.isActive ? 'Auto-deduct enabled' : 'Subscription Paused'}
                            </div>
                        </div>
                    </div>
                ))}
                
                {subscriptions.length === 0 && (
                    <div className="col-span-1 md:col-span-3 text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Repeat size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Subscriptions Found</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Add your EMIs, rent, or Netflix subscriptions here. We'll automatically add a transaction when they are due.</p>
                        <button onClick={() => { resetForm(); setIsAdding(true); }} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Create First Subscription</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionsModule;