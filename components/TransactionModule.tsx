import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Edit2, Trash2, ArrowRightLeft, TrendingUp, TrendingDown, ArrowRight, Camera, Repeat, CheckCircle, Play, Pause, Loader2 } from 'lucide-react';
import { Transaction, Account, Debt, Subscription } from '../types';
import { formatCurrency, generateId } from '../utils';
import { GoogleGenAI } from '@google/genai';

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
    subscriptions: Subscription[];
    setSubscriptions: (subs: Subscription[]) => void;
}

const TransactionModule: React.FC<TransactionModuleProps> = ({ 
    transactions, setTransactions, accounts, debts, incomeCategories, expenseCategories, 
    handleSaveTransaction, deleteTransaction, handleEditClick, editingTxnId, 
    showAddTxn, setShowAddTxn, setEditingTxnId, subscriptions, setSubscriptions 
}) => {
    const [activeTab, setActiveTab] = useState<'history' | 'recurring'>('history');
    const [formData, setFormData] = useState<Transaction>({
      id: '', amount: '', type: 'expense', category: expenseCategories[0] || 'Food', accountId: accounts[0]?.id || '', toAccountId: '', notes: '', date: new Date().toISOString().split('T')[0]
    });
    
    // Receipt Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Subscription Form State
    const [showSubForm, setShowSubForm] = useState(false);
    const [subFormData, setSubFormData] = useState<Subscription>({
        id: '', name: '', amount: 0, type: 'expense', category: 'Subscription', accountId: accounts[0]?.id || '', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0], isActive: true
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

    const handleSubSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSub = { ...subFormData, id: subFormData.id || generateId() };
        if (subFormData.id) {
            setSubscriptions(subscriptions.map(s => s.id === subFormData.id ? newSub : s));
        } else {
            setSubscriptions([...subscriptions, newSub]);
        }
        setShowSubForm(false);
        setSubFormData({ id: '', name: '', amount: 0, type: 'expense', category: 'Subscription', accountId: accounts[0]?.id || '', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0], isActive: true });
    };

    const deleteSubscription = (id: string) => {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
    };

    const toggleSubscription = (id: string) => {
        setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
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
    };

    // AI Receipt Scanner Logic
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result?.toString().split(',')[1];
                if (!base64Data) return;

                const ai = new GoogleGenAI({ apiKey });
                const prompt = `Analyze this receipt image. Extract: 
                1. Total Amount (number only)
                2. Date (YYYY-MM-DD format, use today if missing)
                3. Merchant Name (string)
                4. Infer a Category from this list: ${expenseCategories.join(', ')}.
                
                Return JSON only: { "amount": number, "date": "string", "merchant": "string", "category": "string" }`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { inlineData: { mimeType: file.type, data: base64Data } },
                                { text: prompt }
                            ]
                        }
                    ]
                });

                const text = response.text;
                // Simple cleanup to find JSON block if markdown is used
                const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
                const data = JSON.parse(jsonStr);

                setFormData(prev => ({
                    ...prev,
                    amount: data.amount || prev.amount,
                    date: data.date || prev.date,
                    notes: data.merchant ? `Receipt: ${data.merchant}` : prev.notes,
                    category: data.category || prev.category,
                    type: 'expense' // Receipt mostly implies expense
                }));
                setShowAddTxn(true);
                setIsScanning(false);
            };
        } catch (error) {
            console.error("Scanning failed", error);
            alert("Failed to scan receipt. Please try again.");
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h2>
                    <div className="flex space-x-4 mt-2 text-sm text-slate-500">
                        <button onClick={() => setActiveTab('history')} className={`pb-1 border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent hover:text-slate-700'}`}>History</button>
                        <button onClick={() => setActiveTab('recurring')} className={`pb-1 border-b-2 transition-colors ${activeTab === 'recurring' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent hover:text-slate-700'}`}>Subscriptions</button>
                    </div>
                </div>
                
                {activeTab === 'history' && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl flex items-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                            {isScanning ? <Loader2 size={20} className="mr-2 animate-spin"/> : <Camera size={20} className="mr-2" />} 
                            {isScanning ? 'Scanning...' : 'Scan Receipt'}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                        <button 
                            onClick={() => { setShowAddTxn(true); setEditingTxnId(null); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Plus size={20} className="mr-2" /> Add Transaction
                        </button>
                    </div>
                )}
                 {activeTab === 'recurring' && (
                     <button 
                        onClick={() => setShowSubForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                    >
                        <Plus size={20} className="mr-2" /> Add Subscription
                    </button>
                 )}
            </div>

            {/* SUBSCRIPTION FORM */}
            {activeTab === 'recurring' && showSubForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in-down">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">New Subscription / Recurring</h3>
                    <form onSubmit={handleSubSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input value={subFormData.name} onChange={e => setSubFormData({...subFormData, name: e.target.value})} placeholder="Netflix, Rent..." className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                <input type="number" value={subFormData.amount} onChange={e => setSubFormData({...subFormData, amount: parseFloat(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Due Date</label>
                                <input type="date" value={subFormData.nextDueDate} onChange={e => setSubFormData({...subFormData, nextDueDate: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" required />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                <select value={subFormData.type} onChange={e => setSubFormData({...subFormData, type: e.target.value as any})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select value={subFormData.category} onChange={e => setSubFormData({...subFormData, category: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                                     {(subFormData.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Account</label>
                                <select value={subFormData.accountId} onChange={e => setSubFormData({...subFormData, accountId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                                    {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name}</option>)}
                                </select>
                            </div>
                         </div>
                         <div className="flex space-x-3">
                             <button type="button" onClick={() => setShowSubForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl">Cancel</button>
                             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl">Save Subscription</button>
                         </div>
                    </form>
                </div>
            )}

            {/* SUBSCRIPTIONS LIST */}
            {activeTab === 'recurring' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptions.map(sub => (
                        <div key={sub.id} className={`p-4 rounded-xl border flex justify-between items-center ${sub.isActive ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 opacity-70'}`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-full ${sub.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    <Repeat size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                                    <p className="text-xs text-slate-500">Next: {sub.nextDueDate} • {formatCurrency(sub.amount)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => toggleSubscription(sub.id)} className={`p-2 rounded-lg ${sub.isActive ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 bg-slate-100'}`}>
                                    {sub.isActive ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
                                </button>
                                <button onClick={() => { setSubFormData(sub); setShowSubForm(true); }} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={18}/></button>
                                <button onClick={() => deleteSubscription(sub.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {subscriptions.length === 0 && <p className="col-span-2 text-center text-slate-400 py-10">No recurring subscriptions setup.</p>}
                </div>
            )}

            {/* TRANSACTION FORM (Collapsible) */}
            {activeTab === 'history' && showAddTxn && (
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
            {activeTab === 'history' && (
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
            )}
        </div>
    );
};

export default TransactionModule;