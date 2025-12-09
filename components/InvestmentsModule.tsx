import React, { useState } from 'react';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, ArrowRight, Wallet, History, Info } from 'lucide-react';
import { Investment, InvestmentHistoryItem, Account, Transaction } from '../types';
import { generateId, formatCurrency } from '../utils';

interface InvestmentsModuleProps {
    investments: Investment[];
    setInvestments: (inv: Investment[]) => void;
    investmentTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
    accounts: Account[];
    handleSaveTransaction: (txn: Transaction, isEdit?: boolean) => void;
}

const InvestmentsModule: React.FC<InvestmentsModuleProps> = ({ 
    investments, setInvestments, investmentTypes, handleConfirmAction, accounts, handleSaveTransaction 
}) => {
    const [isAddingInv, setIsAddingInv] = useState(false);
    const [newInv, setNewInv] = useState<Omit<Investment, 'id'>>({ name: '', type: investmentTypes[0] || 'Mutual Fund', investedAmount: 0, sipAmount: 0, date: new Date().toISOString().split('T')[0] });
    
    // Quick Add Form States
    const [amountInput, setAmountInput] = useState('');
    const [sipInput, setSipInput] = useState('0');

    // Manage Modal State
    const [manageModalOpen, setManageModalOpen] = useState<string | null>(null); // holds ID
    const [activeTab, setActiveTab] = useState<'details' | 'add' | 'withdraw' | 'history'>('details');
    
    // Manage Actions State
    const [actionAmount, setActionAmount] = useState('');
    const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
    const [actionAccount, setActionAccount] = useState('');
    const [editDetails, setEditDetails] = useState<{name: string, type: string, sip: string}>({ name: '', type: '', sip: '' });

    const handleAddInv = () => {
        if(!newInv.name || !amountInput) return;
        const investedAmount = parseFloat(amountInput);
        const historyItem: InvestmentHistoryItem = {
            id: generateId(),
            date: newInv.date,
            type: 'deposit',
            amount: investedAmount,
            note: 'Initial Investment'
        };

        setInvestments([...investments, { 
            id: generateId(), 
            ...newInv, 
            investedAmount: investedAmount, 
            sipAmount: parseFloat(sipInput),
            history: [historyItem]
        }]);
        setNewInv({ name: '', type: investmentTypes[0] || 'Mutual Fund', investedAmount: 0, sipAmount: 0, date: new Date().toISOString().split('T')[0] });
        setAmountInput('');
        setSipInput('0');
        setIsAddingInv(false);
    };

    const deleteInvestment = (id: string) => {
       handleConfirmAction("Remove Investment", "Are you sure you want to delete this investment record? History will be lost.", () => setInvestments(investments.filter(i => i.id !== id)));
    };

    const openManageModal = (inv: Investment) => {
        setManageModalOpen(inv.id);
        setActiveTab('details');
        setEditDetails({ name: inv.name, type: inv.type, sip: String(inv.sipAmount || 0) });
        setActionAmount('');
        setActionAccount(accounts[0]?.id || '');
        setActionDate(new Date().toISOString().split('T')[0]);
    };

    const handleUpdateDetails = () => {
        if (!manageModalOpen || !editDetails.name) return;
        setInvestments(investments.map(i => i.id === manageModalOpen ? { ...i, name: editDetails.name, type: editDetails.type, sipAmount: parseFloat(editDetails.sip) || 0 } : i));
        alert("Details updated successfully.");
    };

    const handleAddFunds = () => {
        if (!manageModalOpen || !actionAmount) return;
        const amount = parseFloat(actionAmount);
        if (isNaN(amount) || amount <= 0) { alert("Invalid amount"); return; }

        const inv = investments.find(i => i.id === manageModalOpen);
        if (!inv) return;

        const historyItem: InvestmentHistoryItem = {
            id: generateId(),
            date: actionDate,
            type: 'deposit',
            amount: amount,
            note: 'Additional Investment',
            accountId: actionAccount || undefined
        };

        const updatedInv = { 
            ...inv, 
            investedAmount: inv.investedAmount + amount,
            history: [...(inv.history || []), historyItem] 
        };

        setInvestments(investments.map(i => i.id === manageModalOpen ? updatedInv : i));
        
        // Optional: If user selected an account, create an expense transaction
        if (actionAccount) {
             const txn: Transaction = {
                id: generateId(),
                amount: amount,
                type: 'expense',
                category: 'Investment',
                accountId: actionAccount,
                date: actionDate,
                notes: `Invested in ${inv.name}`
            };
            handleSaveTransaction(txn);
        }

        setActionAmount('');
        alert("Funds added successfully.");
        setActiveTab('history');
    };

    const handleWithdrawFunds = () => {
        if (!manageModalOpen || !actionAmount || !actionAccount) {
            alert("Please provide amount and select a destination account.");
            return;
        }
        const amount = parseFloat(actionAmount);
        const inv = investments.find(i => i.id === manageModalOpen);
        if (!inv || isNaN(amount) || amount <= 0) return;

        if (amount > inv.investedAmount) {
            alert("Withdrawal amount cannot exceed invested amount.");
            return;
        }

        const historyItem: InvestmentHistoryItem = {
            id: generateId(),
            date: actionDate,
            type: 'withdrawal',
            amount: amount,
            note: 'Withdrawal',
            accountId: actionAccount
        };

        const updatedInv = { 
            ...inv, 
            investedAmount: inv.investedAmount - amount,
            history: [...(inv.history || []), historyItem] 
        };

        setInvestments(investments.map(i => i.id === manageModalOpen ? updatedInv : i));

        // Create Income Transaction
        const txn: Transaction = {
            id: generateId(),
            amount: amount,
            type: 'income',
            category: 'Investment Return',
            accountId: actionAccount,
            date: actionDate,
            notes: `Withdrawal from ${inv.name}`
        };
        handleSaveTransaction(txn);

        setActionAmount('');
        alert("Funds withdrawn and deposited to account.");
        setActiveTab('history');
    };

    const activeInvestment = investments.find(i => i.id === manageModalOpen);

    return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Investment Ledger</h2>
            <button onClick={() => setIsAddingInv(!isAddingInv)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                <Plus size={20} className="mr-2" /> Add Investment
            </button>
        </div>

        {/* Manage Modal */}
        {manageModalOpen && activeInvestment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeInvestment.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{activeInvestment.type} • Started {activeInvestment.date}</p>
                        </div>
                        <button onClick={() => setManageModalOpen(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 p-2 rounded-full transition-colors">
                            <span className="sr-only">Close</span>
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                    
                    <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
                        {[
                            { id: 'details', label: 'Details', icon: Edit2 },
                            { id: 'add', label: 'Add Funds', icon: TrendingUp },
                            { id: 'withdraw', label: 'Withdraw', icon: TrendingDown },
                            { id: 'history', label: 'History', icon: History }
                        ].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <tab.icon size={16} className="mr-2" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {activeTab === 'details' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                                    <input value={editDetails.name} onChange={e => setEditDetails({...editDetails, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                        <select value={editDetails.type} onChange={e => setEditDetails({...editDetails, type: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                                            {investmentTypes.map(t => <option key={t} value={t} className="dark:bg-slate-800">{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly SIP (Optional)</label>
                                        <input type="number" value={editDetails.sip} onChange={e => setEditDetails({...editDetails, sip: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleUpdateDetails} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 w-full md:w-auto">Update Details</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'add' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                                    <Info size={20} className="text-blue-500 shrink-0"/>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">Adding funds increases your total invested amount. You can optionally select a source account to deduct the money from.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                                        <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Account (Optional)</label>
                                    <select value={actionAccount} onChange={e => setActionAccount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                                        <option value="">-- None (Just Track) --</option>
                                        {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddFunds} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                                    <TrendingUp size={18} className="mr-2"/> Add Funds
                                </button>
                            </div>
                        )}

                        {activeTab === 'withdraw' && (
                            <div className="space-y-4">
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex items-start gap-3 border border-amber-100 dark:border-amber-800">
                                    <Info size={20} className="text-amber-500 shrink-0"/>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">Withdrawing funds decreases your invested amount and credits the selected account.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount to Withdraw (₹)</label>
                                        <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Account (Required)</label>
                                    <select value={actionAccount} onChange={e => setActionAccount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500">
                                        <option value="">-- Select Account --</option>
                                        {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                                    </select>
                                </div>
                                <button onClick={handleWithdrawFunds} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center">
                                    <TrendingDown size={18} className="mr-2"/> Withdraw Funds
                                </button>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-2">
                                {!activeInvestment.history || activeInvestment.history.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No transaction history available.</p>
                                ) : (
                                    activeInvestment.history.slice().reverse().map((h, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center">
                                                <div className={`p-2 rounded-lg mr-3 ${h.type === 'deposit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {h.type === 'deposit' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{h.type === 'deposit' ? 'Added Funds' : 'Withdrawn'}</p>
                                                    <p className="text-xs text-slate-500">{h.date} • {h.note || 'No note'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-mono font-bold ${h.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {h.type === 'deposit' ? '+' : '-'}{formatCurrency(h.amount)}
                                                </p>
                                                {h.accountId && (
                                                    <p className="text-xs text-slate-400">
                                                        {h.type === 'deposit' ? 'From: ' : 'To: '} 
                                                        {accounts.find(a => a.id === h.accountId)?.name || 'Unknown'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {isAddingInv && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-down">
                <div>
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">Date</label>
                   <input type="date" value={newInv.date} onChange={e => setNewInv({...newInv, date: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">Asset Name</label>
                   <input value={newInv.name} onChange={e => setNewInv({...newInv, name: e.target.value})} placeholder="e.g. Bitcoin, Reliance Stock" className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">Invested Amount (₹)</label>
                   <input value={amountInput} type="number" onChange={e => setAmountInput(e.target.value)} placeholder="Amount" className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                 <div>
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">SIP Amount (Optional)</label>
                   <input value={sipInput} type="number" onChange={e => setSipInput(e.target.value)} placeholder="Monthly SIP" className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">Type</label>
                   <select value={newInv.type} onChange={e => setNewInv({...newInv, type: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
                      {investmentTypes.map(t => <option key={t} value={t} className="dark:bg-slate-800">{t}</option>)}
                  </select>
                </div>
                <button onClick={handleAddInv} className="bg-blue-600 text-white p-3 rounded-xl col-span-2 mt-2 hover:bg-blue-700 font-medium">Save Record</button>
            </div>
        )}
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Asset</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Invested Amount</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {investments.map(inv => (
                   <tr key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 text-slate-700 dark:text-slate-300 text-sm">{inv.date || 'N/A'}</td>
                      <td className="p-4 font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-500" onClick={() => openManageModal(inv)}>{inv.name}</td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{inv.type}</td>
                      <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(inv.investedAmount)}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                         <button onClick={() => openManageModal(inv)} className="text-blue-500 hover:text-blue-600 transition-colors p-1" title="Manage Investment">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => deleteInvestment(inv.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                           <Trash2 size={16} />
                         </button>
                      </td>
                   </tr>
                 ))}
                 {investments.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-slate-400">No investment records found.</td></tr>
                 )}
              </tbody>
            </table>
        </div>
      </div>
    );
};

export default InvestmentsModule;