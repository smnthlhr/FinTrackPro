import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Debt } from '../types';
import { generateId, formatCurrency } from '../utils';

interface DebtsModuleProps {
    debts: Debt[];
    setDebts: (debts: Debt[]) => void;
    debtTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
}

const DebtsModule: React.FC<DebtsModuleProps> = ({ debts, setDebts, debtTypes, handleConfirmAction }) => {
      const [formData, setFormData] = useState<{ id: string | null; title: string; amount: string; type: string; dueDate: string; }>({ id: null, title: '', amount: '', type: debtTypes[0] || 'EMI', dueDate: '' });
      const [isFormOpen, setIsFormOpen] = useState(false);

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

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Debts & Liabilities</h2>
            <button onClick={openAddForm} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all">
              <Plus size={20} className="mr-2" /> Add Debt
            </button>
          </div>

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
               <div key={d.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-l-4 border-red-500 dark:border-slate-700 flex justify-between items-center group relative hover:shadow-md transition-all">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{d.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{d.type} • Due: {d.dueDate || 'No Date'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-500 font-mono">{formatCurrency(d.amount)}</p>
                    <div className="flex justify-end space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(d)} className="text-blue-500 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                        <button onClick={() => deleteDebt(d.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
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