import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Edit2, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react';
import { Transaction, Budget } from '../types';
import { formatCurrency } from '../utils';

interface BudgetModuleProps {
    transactions: Transaction[];
    expenseCategories: string[];
    budgets: Budget[];
    setBudgets: (budgets: Budget[]) => void;
}

const BudgetModule: React.FC<BudgetModuleProps> = ({ transactions, expenseCategories, budgets, setBudgets }) => {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState('');

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate spending per category for CURRENT month
    const spendingData: Record<string, number> = useMemo(() => {
        const data: Record<string, number> = {};
        transactions.forEach(t => {
            const d = new Date(t.date);
            if (t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                data[t.category] = (data[t.category] || 0) + Number(t.amount);
            }
        });
        return data;
    }, [transactions, currentMonth, currentYear]);

    const handleSaveLimit = (category: string) => {
        const limit = parseFloat(editLimit);
        if (isNaN(limit) || limit < 0) return;

        const existing = budgets.find(b => b.category === category);
        let newBudgets = [...budgets];

        if (limit === 0) {
            // Remove budget if set to 0
            newBudgets = newBudgets.filter(b => b.category !== category);
        } else if (existing) {
            newBudgets = newBudgets.map(b => b.category === category ? { ...b, limit } : b);
        } else {
            newBudgets.push({ category, limit, alertThreshold: 80 });
        }

        setBudgets(newBudgets);
        setEditingCategory(null);
        setEditLimit('');
    };

    const startEditing = (category: string, currentLimit: number) => {
        setEditingCategory(category);
        setEditLimit(String(currentLimit));
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = Object.values(spendingData).reduce((sum: number, v: number) => sum + v, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Monthly Budgets</h2>
                    <p className="text-slate-500 text-sm">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Budget</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Spent</p>
                        <p className={`text-lg font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-blue-600'}`}>
                            {formatCurrency(totalSpent)}
                        </p>
                    </div>
                </div>
            </div>

            {expenseCategories.length === 0 && (
                 <div className="text-center py-10 text-slate-400 italic">No expense categories defined in settings.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenseCategories.map(category => {
                    const spent = spendingData[category] || 0;
                    const budgetObj = budgets.find(b => b.category === category);
                    const limit = budgetObj?.limit || 0;
                    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                    const isOverBudget = limit > 0 && spent > limit;
                    const isWarning = limit > 0 && percentage >= (budgetObj?.alertThreshold || 80) && !isOverBudget;

                    return (
                        <div key={category} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border transition-all ${isOverBudget ? 'border-red-200 dark:border-red-900/50 bg-red-50/10' : 'border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{category}</h3>
                                    {limit > 0 ? (
                                        <p className="text-xs text-slate-500 mt-0.5">Limit: {formatCurrency(limit)}</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-0.5 italic">No budget set</p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => startEditing(category, limit)} 
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            {editingCategory === category ? (
                                <div className="flex gap-2 items-center mb-2 animate-in fade-in zoom-in-95">
                                    <input 
                                        type="number" 
                                        value={editLimit} 
                                        onChange={e => setEditLimit(e.target.value)}
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Set Limit"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveLimit(category)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Save</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {formatCurrency(spent)}
                                        </span>
                                        {limit > 0 && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${isOverBudget ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {percentage.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>

                                    {limit > 0 ? (
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'}`} 
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-xs text-slate-400 mt-3">
                                            <Info size={12} className="mr-1" />
                                            <span>Set a limit to track progress</span>
                                        </div>
                                    )}

                                    {limit > 0 && (
                                        <p className="text-xs text-slate-400 mt-2 text-right">
                                            {isOverBudget 
                                                ? `${formatCurrency(spent - limit)} over budget` 
                                                : `${formatCurrency(limit - spent)} remaining`
                                            }
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetModule;