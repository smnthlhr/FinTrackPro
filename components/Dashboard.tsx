import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Shield, ArrowRightLeft, Activity, ArrowRight
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency } from '../utils';
import FinancialCalendar from './FinancialCalendar';

interface DashboardProps {
    transactions: Transaction[];
    accounts: Account[];
    monthlyMetrics: { income: number; expense: number; savings: number; totalSIP: number };
    totalNetWorth: number;
    totalWalletBalance: number;
    totalInvestmentValue: number;
    totalDebtValue: number;
    setView: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, accounts, monthlyMetrics, totalNetWorth, 
    totalWalletBalance, totalInvestmentValue, totalDebtValue, setView 
}) => {
    const [chartType, setChartType] = useState<'expense' | 'income'>('expense'); 

    const chartData = transactions
      .filter(t => t.type === chartType)
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) existing.value += Number(curr.amount);
        else acc.push({ name: curr.category, value: Number(curr.amount) });
        return acc;
      }, [] as { name: string; value: number }[]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700/50">
           <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 mb-2 font-medium uppercase tracking-wide text-xs">Total Net Worth</p>
                        <h1 className="text-5xl md:text-6xl font-bold mb-8 font-mono tracking-tighter">{formatCurrency(totalNetWorth)}</h1>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                        <Shield className="text-blue-300" />
                    </div>
                </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/10 pt-6">
                  <div>
                    <div className="flex items-center space-x-2 text-slate-400 mb-1">
                        <Wallet size={14} />
                        <span className="text-xs font-semibold uppercase">Liquid Assets</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-400 font-mono">{formatCurrency(totalWalletBalance)}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-slate-400 mb-1">
                        <TrendingUp size={14} />
                        <span className="text-xs font-semibold uppercase">Investments</span>
                    </div>
                    <p className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(totalInvestmentValue)}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-slate-400 mb-1">
                        <Wallet size={14} />
                        <span className="text-xs font-semibold uppercase">Liabilities</span>
                    </div>
                    <p className="text-xl font-bold text-red-400 font-mono">-{formatCurrency(totalDebtValue)}</p>
                  </div>
               </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Income (This Month)</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlyMetrics.income)}</p>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                <ArrowRightLeft size={20} className="rotate-45" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Expense (This Month)</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlyMetrics.expense)}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
                <ArrowRightLeft size={20} className="-rotate-45" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">SIP Commitment</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlyMetrics.totalSIP)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                <Activity size={20} />
            </div>
          </div>
        </div>

        <FinancialCalendar transactions={transactions} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Spending Analytics</h3>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button onClick={() => setChartType('expense')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500' : 'text-slate-500'}`}>Expenses</button>
                <button onClick={() => setChartType('income')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-500'}`}>Income</button>
              </div>
            </div>
            
            <div className="h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80} 
                      outerRadius={110} 
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke={'#1e293b'} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', padding: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PieChart size={48} className="mb-2 opacity-20" />
                  <p>No data available for {chartType}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {transactions.slice(0, 6).map(txn => (
                <div key={txn.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-transparent">
                  <div className="flex items-center overflow-hidden">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        txn.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {txn.type === 'income' ? <TrendingUp size={18} /> : 
                       txn.type === 'expense' ? <TrendingDown size={18} /> :
                       <ArrowRightLeft size={18} />}
                    </div>
                    <div className="ml-3 truncate">
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{txn.category}</p>
                      <p className="text-xs text-slate-500">{txn.date}</p>
                    </div>
                  </div>
                  <span className={`font-bold ml-2 text-sm ${
                      txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                      txn.type === 'expense' ? 'text-red-500 dark:text-red-400' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                    {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-slate-400 mt-10">No recent activity.</p>}
            </div>
            <button onClick={() => setView('transactions')} className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                View Full History
            </button>
          </div>
        </div>
      </div>
    );
};

export default Dashboard;