import React, { useState } from 'react';
import { Plus, User, Phone, Calendar, Percent, CheckCircle, ArrowDownLeft, Wallet, Trash2 } from 'lucide-react';
import { Lending, Account, Transaction } from '../types';
import { generateId, formatCurrency } from '../utils';

interface LendingsModuleProps {
    lendings: Lending[];
    setLendings: (lendings: Lending[]) => void;
    accounts: Account[];
    handleSaveTransaction: (txn: Transaction, isEdit?: boolean) => void;
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
}

const LendingsModule: React.FC<LendingsModuleProps> = ({ 
    lendings, setLendings, accounts, handleSaveTransaction, handleConfirmAction 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [repayModalOpen, setRepayModalOpen] = useState<string | null>(null); // holds lending ID

    // New Lending Form State
    const [newLending, setNewLending] = useState({
        borrower: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        returnDate: '',
        interestRate: '',
        contactDetails: '',
        sourceAccountId: accounts[0]?.id || ''
    });

    // Repayment Form State
    const [repayment, setRepayment] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        accountId: accounts[0]?.id || ''
    });

    const handleCreateLending = () => {
        if (!newLending.borrower || !newLending.amount || !newLending.sourceAccountId) {
            alert("Please fill in borrower, amount, and source account.");
            return;
        }

        const amount = parseFloat(newLending.amount);
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount.");
            return;
        }

        const lendingId = generateId();
        const newRecord: Lending = {
            id: lendingId,
            borrower: newLending.borrower,
            totalAmount: amount,
            date: newLending.date,
            returnDate: newLending.returnDate,
            interestRate: parseFloat(newLending.interestRate) || 0,
            contactDetails: newLending.contactDetails,
            payments: [],
            status: 'active'
        };

        // 1. Add Lending Record
        setLendings([...lendings, newRecord]);

        // 2. Create Deduction Transaction
        const txn: Transaction = {
            id: generateId(),
            amount: amount,
            type: 'expense',
            category: 'Lending', // System category
            accountId: newLending.sourceAccountId,
            date: newLending.date,
            notes: `Lent to ${newLending.borrower}`
        };
        handleSaveTransaction(txn);

        // Reset
        setIsAdding(false);
        setNewLending({
            borrower: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            returnDate: '',
            interestRate: '',
            contactDetails: '',
            sourceAccountId: accounts[0]?.id || ''
        });
    };

    const handleAddRepayment = () => {
        if (!repayModalOpen || !repayment.amount || !repayment.accountId) return;
        
        const amount = parseFloat(repayment.amount);
        const lending = lendings.find(l => l.id === repayModalOpen);
        
        if (!lending || isNaN(amount) || amount <= 0) return;

        // 1. Update Lending Record
        const updatedLending = { ...lending };
        updatedLending.payments.push({
            id: generateId(),
            date: repayment.date,
            amount: amount,
            accountId: repayment.accountId
        });

        // Check if settled (simple logic: if repaid >= total)
        const totalRepaid = updatedLending.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalRepaid >= updatedLending.totalAmount) {
            updatedLending.status = 'settled';
        }

        setLendings(lendings.map(l => l.id === repayModalOpen ? updatedLending : l));

        // 2. Create Income Transaction
        const txn: Transaction = {
            id: generateId(),
            amount: amount,
            type: 'income',
            category: 'Lending Repayment',
            accountId: repayment.accountId,
            date: repayment.date,
            notes: `Repayment from ${lending.borrower}`
        };
        handleSaveTransaction(txn);

        setRepayModalOpen(null);
        setRepayment({ amount: '', date: new Date().toISOString().split('T')[0], accountId: accounts[0]?.id || '' });
    };

    const deleteLending = (id: string) => {
        handleConfirmAction("Delete Lending Record", "Warning: This will only remove the record from this list. It will NOT revert the transactions (money deducted/added) from your accounts. You must manually delete those transactions if needed.", () => {
            setLendings(lendings.filter(l => l.id !== id));
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lending Manager</h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={20} className="mr-2" /> Lend Money
                </button>
            </div>

            {/* Repayment Modal */}
            {repayModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Receive Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={repayment.amount} 
                                    onChange={e => setRepayment({...repayment, amount: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={repayment.date} 
                                    onChange={e => setRepayment({...repayment, date: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Deposit To</label>
                                <select 
                                    value={repayment.accountId} 
                                    onChange={e => setRepayment({...repayment, accountId: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                                >
                                    {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setRepayModalOpen(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors hover:bg-slate-200">Cancel</button>
                            <button onClick={handleAddRepayment} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">Confirm</button>
                        </div>
                    </div>
                 </div>
            )}

            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-down">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">New Lending Record</h3>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Borrower Name (Person/Org)</label>
                        <input value={newLending.borrower} onChange={e => setNewLending({...newLending, borrower: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe"/>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount to Lend (₹)</label>
                        <input type="number" value={newLending.amount} onChange={e => setNewLending({...newLending, amount: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00"/>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deduct From Account</label>
                        <select value={newLending.sourceAccountId} onChange={e => setNewLending({...newLending, sourceAccountId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                            {accounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Lending Date</label>
                        <input type="date" value={newLending.date} onChange={e => setNewLending({...newLending, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Return Date</label>
                         <input type="date" value={newLending.returnDate} onChange={e => setNewLending({...newLending, returnDate: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Interest Rate (% p.a)</label>
                        <input type="number" value={newLending.interestRate} onChange={e => setNewLending({...newLending, interestRate: e.target.value})} placeholder="Optional" className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Details</label>
                        <input value={newLending.contactDetails} onChange={e => setNewLending({...newLending, contactDetails: e.target.value})} placeholder="Phone, Email, Address..." className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"/>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex space-x-3 mt-4">
                        <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                        <button onClick={handleCreateLending} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all font-medium flex-1">Confirm Lending</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {lendings.map(lending => {
                    const totalRepaid = lending.payments.reduce((sum, p) => sum + p.amount, 0);
                    const remaining = lending.totalAmount - totalRepaid;
                    const isSettled = lending.status === 'settled' || remaining <= 0;

                    return (
                        <div key={lending.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-l-4 transition-all ${isSettled ? 'border-l-emerald-500 border-slate-200 dark:border-slate-700' : 'border-l-blue-500 border-slate-200 dark:border-slate-700 hover:shadow-md'}`}>
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{lending.borrower}</h3>
                                        {isSettled ? (
                                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded flex items-center"><CheckCircle size={12} className="mr-1"/> Settled</span>
                                        ) : (
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded">Active</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 space-y-1 mb-4">
                                        {lending.contactDetails && <div className="flex items-center"><Phone size={14} className="mr-2"/> {lending.contactDetails}</div>}
                                        <div className="flex items-center"><Calendar size={14} className="mr-2"/> Lent: {lending.date} {lending.returnDate ? `• Due: ${lending.returnDate}` : ''}</div>
                                        {lending.interestRate > 0 && <div className="flex items-center"><Percent size={14} className="mr-2"/> Interest: {lending.interestRate}%</div>}
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full max-w-md bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                                        <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min((totalRepaid/lending.totalAmount)*100, 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500">Repaid: {formatCurrency(totalRepaid)} of {formatCurrency(lending.totalAmount)}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Remaining</p>
                                    <p className={`text-2xl font-bold font-mono mb-4 ${isSettled ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {formatCurrency(Math.max(0, remaining))}
                                    </p>
                                    
                                    <div className="flex flex-col gap-2">
                                        {!isSettled && (
                                            <button 
                                                onClick={() => setRepayModalOpen(lending.id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm"
                                            >
                                                <ArrowDownLeft size={16} className="mr-2"/> Receive Payment
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteLending(lending.id)}
                                            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                                        >
                                            <Trash2 size={16} className="mr-2"/> Remove Record
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History */}
                            {lending.payments.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Payment History</h4>
                                    <div className="space-y-2">
                                        {lending.payments.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                                <span className="text-slate-600 dark:text-slate-300">{p.date}</span>
                                                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                                    +{formatCurrency(p.amount)} 
                                                    <span className="ml-2 text-xs font-sans font-normal text-slate-400 hidden sm:inline">to {accounts.find(a=>a.id===p.accountId)?.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {lendings.length === 0 && <p className="text-center text-slate-400 py-10 italic">No lending records. Use "Lend Money" to create one.</p>}
            </div>
        </div>
    );
};

export default LendingsModule;