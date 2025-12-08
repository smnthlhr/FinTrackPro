import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Goal } from '../types';
import { generateId, formatCurrency } from '../utils';
import InputModal from './InputModal';

interface GoalsModuleProps {
    goals: Goal[];
    setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
    handleConfirmAction: (title: string, message: string, action: () => void) => void;
}

const GoalsModule: React.FC<GoalsModuleProps> = ({ goals, setGoals, handleConfirmAction }) => {
    const [goalForm, setGoalForm] = useState<{ id: string | null; title: string; target: string }>({ id: null, title: '', target: '' });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [fundGoalId, setFundGoalId] = useState<string | null>(null);

    const openAdd = () => { setGoalForm({ id: null, title: '', target: '' }); setIsFormOpen(true); };
    const openEdit = (g: Goal) => { setGoalForm({ id: g.id, title: g.title, target: String(g.target) }); setIsFormOpen(true); };

    const handleSaveGoal = () => {
        if (!goalForm.title || !goalForm.target) return;
        if (goalForm.id) {
            setGoals(goals.map(g => g.id === goalForm.id ? { ...g, title: goalForm.title, target: parseFloat(goalForm.target) } : g));
        } else {
            setGoals(prev => [...prev, { 
                id: generateId(), 
                title: goalForm.title, 
                target: parseFloat(goalForm.target), 
                current: 0, 
                deadline: '2025-12-31' 
            }]);
        }
        setIsFormOpen(false);
    };

    const deleteGoal = (id: string) => {
        handleConfirmAction("Delete Goal", "Are you sure you want to delete this goal?", () => setGoals(goals.filter(g => g.id !== id)));
    };

    const handleAddFunds = (amountStr: string) => {
        const amount = parseFloat(amountStr);
        if (amount && fundGoalId) {
             setGoals(goals.map(g => g.id === fundGoalId ? { ...g, current: g.current + amount } : g));
        }
        setFundGoalId(null);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Goals</h2>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
            <Plus size={20} className="mr-2" /> New Goal
          </button>
        </div>
        
        <InputModal 
            isOpen={!!fundGoalId} 
            onClose={() => setFundGoalId(null)} 
            onConfirm={handleAddFunds} 
            title="Add Funds to Goal" 
            label="Amount to Save (₹)"
        />

        {isFormOpen && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-end animate-in fade-in-down">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal Title</label>
                    <input type="text" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} placeholder="New Car, House..." className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Amount</label>
                    <input type="number" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} placeholder="50000" className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white text-slate-900 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div className="flex space-x-2 w-full md:w-auto">
                    <button onClick={() => setIsFormOpen(false)} className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSaveGoal} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex-1">{goalForm.id ? 'Update' : 'Start'} Goal</button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-500/30 transition-all relative group">
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(goal)} className="p-1 text-blue-500 hover:text-blue-600"><Edit2 size={18} /></button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
                <div className="flex justify-between items-start mb-6 pr-16">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{goal.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">Target: {formatCurrency(goal.target)}</p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                    {progress.toFixed(0)}%
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progress}%` }}>
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20"></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-lg font-mono">{formatCurrency(goal.current)} <span className="text-xs text-slate-500 font-sans font-normal">saved</span></span>
                  <button onClick={() => setFundGoalId(goal.id)} className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={16} className="mr-1"/> Add Funds
                  </button>
                </div>
              </div>
            );
          })}
          {goals.length === 0 && <p className="text-center text-slate-400 col-span-2 py-10 italic">No goals set yet. Start saving today!</p>}
        </div>
      </div>
    );
};

export default GoalsModule;