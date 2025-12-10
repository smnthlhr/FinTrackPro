import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Debt, Account, Transaction } from '../types';
import { generateId, formatCurrency } from '../utils';

interface DebtsModuleProps {
    debts: Debt[];
    setDebts: (debts: Debt[]) => void;
    debtTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
    handleSaveTransaction: (txn: Transaction, isEdit?: boolean) => void;
    accounts: Account[];
}

const DebtsModule: React.FC<DebtsModuleProps> = ({ debts, setDebts, debtTypes, handleConfirmAction, handleSaveTransaction, accounts }) => {
      const [formData, setFormData] = useState<{ id: string | null; title: string; amount: string; type: string; dueDate: string; }>({ id: null, title: '', amount: '', type: debtTypes[0] || 'EMI', dueDate: '' });
      const [isFormOpen, setIsFormOpen] = useState(false);

      // Pay Off Modal State
      const [payModalOpen, setPayModalOpen] = useState<string | null>(null);
      const [payAmount, setPayAmount] = useState('');
      const [payFromAcc, setPayFromAcc] = useState(accounts[0]?.id || '');

      const openAddForm = () => { setFormData({ id: null, title: '', amount: '', type: debtTypes[0] || 'EMI', dueDate: '' }); setIsFormOpen(true); };
      const openEditForm = (debt: Debt) => { setFormData({ ...debt, amount: String(debt.amount), id: debt.id }); setIsFormOpen(true); };

      const handleSaveDebt = () => {
          if(!formData.title || !formData.amount) return;
          const debtData: Debt = {
              id: formData.id || generateId(),
              title: formData.title,
              amount: parseFloat(formData.amount),
              type: formData.type,
              dueDate: formData.dueDate
          };

          if (formData.id) { 
              setDebts(debts.map(d => d.id === formData.id ? debtData : d)); 
          } else { 
              setDebts([...debts, debtData]); 
          }
          setIsFormOpen(false);
      };

      const deleteDebt = (id: string) => {
        handleConfirmAction("Clear Debt", "Are you sure you want to remove this debt?", () => setDebts(debts.filter(d => d.id !== id)));
      };

      const handlePayDebt = () => {
          if(!payAmount || !payFromAcc || !payModalOpen) return;
          
          const debt = debts.find(d => d.id === payModalOpen);
          if(!debt) return;

          // Logic to create transfer transaction (Repayment)
          // Transfer FROM Asset Account TO Debt Account
          const txn: Transaction = {
              id: generateId(),
              amount: payAmount,
              type: 'transfer',
              category: 'Debt Repayment',
              accountId: payFromAcc, // From Asset
              toAccountId: payModalOpen, // To Debt
              date: new Date().toISOString().split('T')[0],
              notes: `Manual repayment for ${debt.title}`
          };

          handleSaveTransaction(txn);
          setPayModalOpen(null);
          setPayAmount('');
      };

      // Filter accounts for "Pay From"
      const assetAccounts = accounts.filter(a => !a.isCredit);
      const creditAccounts = accounts.filter(a => a.isCredit); // Allow balance transfer scenario

      return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Debts & Liabilities</h2>
            <button onClick={openAddForm} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all">
              <Plus size={20} className="mr-2" /> Add Debt
            </button>
          </div>

          {/* Pay Off Modal */}
          {payModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Make Payment</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount to Pay (₹)</label>
                              <input 
                                  type="number" 
                                  value={payAmount} 
                                  onChange={e => setPayAmount(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                  placeholder="0.00"
                                  autoFocus
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Pay From Account</label>
                              <select 
                                  value={payFromAcc} 
                                  onChange={e => setPayFromAcc(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                              >
                                  <optgroup label="Bank & Cash">
                                      {assetAccounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} ({formatCurrency(a.balance)})</option>)}
                                  </optgroup>
                                  {creditAccounts.length > 0 && (
                                      <optgroup label="Credit Cards (Balance Transfer)">
                                          {creditAccounts.map(a => <option key={a.id} value={a.id} className="dark:bg-slate-800">{a.name} (Avail: {formatCurrency(a.balance)})</option>)}
                                      </optgroup>
                                  )}
                              </select>
                          </div>
                      </div>
                      <div className="flex space-x-3 mt-6">
                          <button onClick={() => setPayModalOpen(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors hover:bg-slate-200">Cancel</button>
                          <button onClick={handlePayDebt} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">Confirm</button>
                      </div>
                  </div>
              </div>
          )}

          {isFormOpen && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-down">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-slate-500 mb-1 font-semibold">Title</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Debt Title" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-slate-500 mb-1 font-semibold">Total Amount</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Amount Owed" />
                </div>
                <div>
                   <label className="block text-sm text-slate-500 mb-1 font-semibold">Type</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
                      {debtTypes.map(t => <option key={t} value={t} className="dark:bg-slate-800">{t}</option>)}
                   </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1 font-semibold">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2 flex space-x-3 mt-2">
                    <button onClick={() => setIsFormOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 dark:bg-slate-700 dark:text-white">Cancel</button>
                    <button onClick={handleSaveDebt} className="flex-1 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">{formData.id ? 'Update' : 'Save'} Record</button>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {debts.map(d => (
               <div key={d.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-l-4 border-red-500 dark:border-slate-700 flex flex-col justify-between group relative hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{d.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{d.type} • Due: {d.dueDate || 'No Date'}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-bold text-red-500 font-mono">{formatCurrency(d.amount)}</p>
                      </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                     <button 
                        onClick={() => setPayModalOpen(d.id)}
                        className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                     >
                        <CheckCircle size={14} className="mr-1"/> Pay Off
                     </button>
                     <div className="flex space-x-2">
                        <button onClick={() => openEditForm(d)} className="text-blue-500 hover:text-blue-600 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Edit2 size={16}/></button>
                        <button onClick={() => deleteDebt(d.id)} className="text-red-400 hover:text-red-500 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
               </div>
             ))}
             {debts.length === 0 && <p className="text-center text-slate-400 col-span-2 py-10 italic">You are debt free! 🎉</p>}
          </div>
        </div>
      );
};

export default DebtsModule;