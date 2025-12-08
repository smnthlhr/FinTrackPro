import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Investment } from '../types';
import { generateId, formatCurrency } from '../utils';

interface InvestmentsModuleProps {
    investments: Investment[];
    setInvestments: (inv: Investment[]) => void;
    investmentTypes: string[];
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
}

const InvestmentsModule: React.FC<InvestmentsModuleProps> = ({ investments, setInvestments, investmentTypes, handleConfirmAction }) => {
    const [isAddingInv, setIsAddingInv] = useState(false);
    const [newInv, setNewInv] = useState<Omit<Investment, 'id'>>({ name: '', type: investmentTypes[0] || 'Mutual Fund', investedAmount: 0, sipAmount: 0, date: new Date().toISOString().split('T')[0] });
    
    // Local state for string input to handle empty field gracefully
    const [amountInput, setAmountInput] = useState('');
    const [sipInput, setSipInput] = useState('0');

    const handleAddInv = () => {
        if(!newInv.name || !amountInput) return;
        setInvestments([...investments, { id: generateId(), ...newInv, investedAmount: parseFloat(amountInput), sipAmount: parseFloat(sipInput) }]);
        setNewInv({ name: '', type: investmentTypes[0] || 'Mutual Fund', investedAmount: 0, sipAmount: 0, date: new Date().toISOString().split('T')[0] });
        setAmountInput('');
        setSipInput('0');
        setIsAddingInv(false);
    };

    const deleteInvestment = (id: string) => {
       handleConfirmAction("Remove Investment", "Are you sure you want to delete this investment record?", () => setInvestments(investments.filter(i => i.id !== id)));
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Investment Ledger</h2>
            <button onClick={() => setIsAddingInv(!isAddingInv)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                <Plus size={20} className="mr-2" /> Add Investment
            </button>
        </div>

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
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{inv.name}</td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{inv.type}</td>
                      <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(inv.investedAmount)}</td>
                      <td className="p-4 text-right">
                         <button onClick={() => deleteInvestment(inv.id)} className="text-slate-400 hover:text-red-500 transition-colors">
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