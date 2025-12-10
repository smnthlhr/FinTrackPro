import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Shield, ArrowRightLeft, Activity, ArrowRight, Gauge
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
      }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value); // Sort largely to help layout

    // Vibrant and distinct colors
    const COLORS = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#F97316', // Orange
        '#6366F1', // Indigo
        '#84CC16', // Lime
    ];

    // Custom Label Renderer to ensure visibility and prevent overlap
    const renderCustomLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
        const RADIAN = Math.PI / 180;
        // Position label outside
        const radius = outerRadius + 20; 
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const textAnchor = x > cx ? 'start' : 'end';

        // Hide label if slice is too small (< 3%) to prevent clutter
        if (percent < 0.03) return null;

        return (
            <g>
                {/* Connecting Line */}
                <path d={`M${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${cy + outerRadius * Math.sin(-midAngle * RADIAN)}L${x},${y}`} stroke="#94a3b8" fill="none" className="stroke-slate-300 dark:stroke-slate-600"/>
                {/* Text */}
                <text 
                    x={x + (x > cx ? 5 : -5)} 
                    y={y} 
                    textAnchor={textAnchor} 
                    dominantBaseline="central" 
                    className="fill-slate-700 dark:fill-slate-200 text-[11px] font-bold"
                >
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                </text>
            </g>
        );
    };

    // Financial Health Score Calculation
    const calculateHealthScore = () => {
        let score = 0;
        
        const totalAssets = totalWalletBalance + totalInvestmentValue;

        // 0. Base Case: If no data exists, score should be 0, not 30 (from debt logic).
        if (totalAssets === 0 && monthlyMetrics.income === 0 && totalDebtValue === 0) {
            return 0;
        }

        // 1. Savings Rate (Max 40 points)
        // Target: 20% savings rate of income
        // Logic: (Savings / Income) * 200. E.g. 0.20 * 200 = 40.
        if (monthlyMetrics.income > 0 && monthlyMetrics.savings > 0) {
            const savingsRate = monthlyMetrics.savings / monthlyMetrics.income;
            score += Math.min(savingsRate * 200, 40);
        }

        // 2. Liquidity (Max 30 points)
        // Target: 3 months of expenses in Liquid Assets (Wallet Balance)
        // Logic: (Balance / Expense) * 10. E.g. 3.0 * 10 = 30.
        if (monthlyMetrics.expense > 0) {
            const liquidityRatio = totalWalletBalance / monthlyMetrics.expense;
            score += Math.min(liquidityRatio * 10, 30);
        } else if (totalWalletBalance > 0) {
            // If no expenses but has cash, full liquidity points
            score += 30;
        }

        // 3. Solvency / Debt Ratio (Max 30 points)
        // Target: 0 Debt is best.
        // Logic: Debt-to-Asset Ratio.
        // If Debt Free: 30 points.
        // If Debt >= Assets: 0 points.
        if (totalDebtValue === 0) {
            score += 30;
        } else {
            if (totalAssets > 0) {
                const debtRatio = totalDebtValue / totalAssets;
                // Score reduces as debt ratio increases
                // Ratio 0.5 (Debt is half of assets) -> 30 * (1 - 0.5) = 15 pts
                // Ratio 1.0 (Debt equals assets) -> 0 pts
                score += Math.max(0, 30 * (1 - debtRatio));
            } else {
                // Debt exists, no assets => 0 points
                score += 0;
            }
        }

        return Math.min(Math.round(score), 100);
    };

    const healthScore = calculateHealthScore();
    const getScoreColor = (s: number) => {
        if (s === 0) return 'text-slate-400';
        return s >= 80 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500';
    };
    const getScoreLabel = (s: number) => {
        if (s === 0) return 'No Data';
        return s >= 80 ? 'Excellent' : s >= 50 ? 'Good' : 'Needs Work';
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Net Worth Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700/50">
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

            {/* Health Score Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Gauge size={100} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs mb-4 tracking-wider">Financial Health Score</h3>
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                     <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-700"/>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${healthScore}, 100`} className={`${getScoreColor(healthScore)} transition-all duration-1000 ease-out`} />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>{healthScore}</span>
                         <span className="text-[10px] text-slate-400 uppercase">/ 100</span>
                     </div>
                </div>
                <p className={`text-lg font-bold ${getScoreColor(healthScore)}`}>{getScoreLabel(healthScore)}</p>
                <p className="text-xs text-slate-400 text-center mt-2 px-4">Based on savings, liquidity, and debt ratio.</p>
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
                      innerRadius={70} // Slightly reduced inner radius
                      outerRadius={95} // Reduced outer radius to give more room for labels
                      paddingAngle={2}
                      dataKey="value"
                      label={renderCustomLabel}
                      labelLine={false} // We draw our own custom lines/labels or rely on custom component
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            className="stroke-white dark:stroke-slate-800" 
                            strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value, entry: any) => <span className="text-slate-700 dark:text-slate-300 font-medium ml-1">{value}</span>}
                    />
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