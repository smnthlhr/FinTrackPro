import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Transaction } from '../types';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils';

interface FinancialCalendarProps {
    transactions: Transaction[];
}

const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ transactions }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const getDailyData = (day: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxns = transactions.filter(t => t.date === dateStr);
      const income = dayTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = dayTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      return { income, expense, hasData: dayTxns.length > 0 };
    };

    const changeMonth = (val: number) => {
      let newMonth = currentMonth + val;
      let newYear = currentYear;
      if (newMonth < 0) { newMonth = 11; newYear -= 1; }
      if (newMonth > 11) { newMonth = 0; newYear += 1; }
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    };

    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
            <CalendarIcon className="mr-2 text-blue-500" size={20} /> Financial Calendar
          </h3>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
             <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition-all shadow-sm">{"<"}</button>
             <span className="font-semibold text-slate-900 dark:text-white w-32 text-center text-sm">{monthNames[currentMonth]} {currentYear}</span>
             <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition-all shadow-sm">{">"}</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
           {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <div key={i} className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {blanks.map(x => <div key={`blank-${x}`} className="h-16 md:h-20"></div>)}
          {days.map(day => {
             const { income, expense, hasData } = getDailyData(day);
             return (
               <div key={day} className={`h-16 md:h-20 border border-slate-100 dark:border-slate-700 rounded-xl p-2 flex flex-col justify-between items-start transition-all hover:scale-105 ${hasData ? 'bg-slate-50 dark:bg-slate-700/50 shadow-sm' : 'bg-transparent'}`}>
                 <span className={`text-xs font-bold ${hasData ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>{day}</span>
                 <div className="w-full flex flex-col items-end text-[9px] md:text-[10px] font-bold leading-tight font-mono">
                   {income > 0 && <span className="text-emerald-500">+{income}</span>}
                   {expense > 0 && <span className="text-red-500">-{expense}</span>}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    );
};

export default FinancialCalendar;