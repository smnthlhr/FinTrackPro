import React, { useState } from 'react';
import { 
  List, XCircle, Sun, Moon, Save, FileJson, FileSpreadsheet, Upload, AlertTriangle, Trash2, Download, Mic, Languages, Lock, ShieldCheck, Unlock, Key, Globe
} from 'lucide-react';
import { SECURITY_QUESTIONS } from '../constants';
import { SecurityQA, Transaction } from '../types';
import { CURRENCY_OPTIONS } from '../utils';

interface SettingsModuleProps {
    theme: string;
    setTheme: (theme: 'light' | 'dark') => void;
    exportData: () => void;
    importData: (event: React.ChangeEvent<HTMLInputElement>) => void;
    exportToExcel: () => void;
    resetData: () => void;
    incomeCategories: string[];
    setIncomeCategories: (cats: string[]) => void;
    expenseCategories: string[];
    setExpenseCategories: (cats: string[]) => void;
    debtTypes: string[];
    setDebtTypes: (types: string[]) => void;
    investmentTypes: string[];
    setInvestmentTypes: (types: string[]) => void;
    accountTypes: string[];
    setAccountTypes: (types: string[]) => void;
    
    // AI Settings
    aiLanguage: string;
    setAiLanguage: (lang: string) => void;
    aiVoice: string;
    setAiVoice: (voice: string) => void;

    // Currency Settings
    currency: string;
    setCurrency: (curr: string) => void;
    currencyRate: number;
    setCurrencyRate: (rate: number) => void;

    // Security Settings
    appPin: string | null;
    setAppPin: (pin: string | null) => void;
    setSecurityQA: (qa: SecurityQA[]) => void;
    handleSaveTransaction?: (txn: Transaction) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
    theme, setTheme, exportData, importData, exportToExcel, resetData,
    incomeCategories, setIncomeCategories, 
    expenseCategories, setExpenseCategories, 
    debtTypes, setDebtTypes, 
    investmentTypes, setInvestmentTypes, 
    accountTypes, setAccountTypes,
    aiLanguage, setAiLanguage,
    aiVoice, setAiVoice,
    currency, setCurrency,
    currencyRate, setCurrencyRate,
    appPin, setAppPin, setSecurityQA,
    handleSaveTransaction
}) => {
    const [newOption, setNewOption] = useState('');
    const [activeList, setActiveList] = useState<'expense' | 'income' | 'debt' | 'investment' | 'account'>('expense'); 
    
    // Reset Flow State
    const [resetStep, setResetStep] = useState<'idle' | 'backup-prompt' | 'final-confirm'>('idle');

    // Security State
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isRemoveVerifyOpen, setIsRemoveVerifyOpen] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [verifyPin, setVerifyPin] = useState('');
    const [qaList, setQaList] = useState<SecurityQA[]>([
        { question: SECURITY_QUESTIONS[0], answer: '' },
        { question: SECURITY_QUESTIONS[1], answer: '' },
        { question: SECURITY_QUESTIONS[2], answer: '' }
    ]);

    const getActiveListData = () => {
        switch(activeList) {
            case 'expense': return { list: expenseCategories, setter: setExpenseCategories, label: 'Expense Category' };
            case 'income': return { list: incomeCategories, setter: setIncomeCategories, label: 'Income Category' };
            case 'debt': return { list: debtTypes, setter: setDebtTypes, label: 'Debt Type' };
            case 'investment': return { list: investmentTypes, setter: setInvestmentTypes, label: 'Investment Asset Type' };
            case 'account': return { list: accountTypes, setter: setAccountTypes, label: 'Account Type' };
            default: return { list: [], setter: () => {}, label: '' };
        }
    };

    const { list, setter, label } = getActiveListData();

    const addOption = () => {
        if (!newOption.trim()) return;
        setter([...list, newOption]);
        setNewOption('');
    };

    const removeOption = (option: string) => {
        setter(list.filter(item => item !== option));
    };

    const handleResetClick = () => {
        setResetStep('backup-prompt');
    };

    const handleDownloadBackupAndProceed = () => {
        exportData();
        setResetStep('final-confirm');
    };

    const handleSkipBackup = () => {
        setResetStep('final-confirm');
    };

    const handleFinalReset = () => {
        resetData();
        setResetStep('idle');
        alert("App has been reset successfully.");
    };

    const handleSaveSecurity = () => {
        // Validate PIN
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            alert("Please enter a valid 4-digit PIN.");
            return;
        }

        // Validate Questions
        const emptyAnswers = qaList.some(qa => !qa.answer.trim());
        if (emptyAnswers) {
            alert("Please answer all 3 security questions.");
            return;
        }

        setAppPin(newPin);
        setSecurityQA(qaList);
        setIsSetupOpen(false);
        setNewPin('');
        alert("Security setup complete! You can now lock the app from the sidebar.");
    };

    const initiateRemovePin = () => {
        setIsRemoveVerifyOpen(true);
        setVerifyPin('');
    };

    const cancelRemovePin = () => {
        setIsRemoveVerifyOpen(false);
        setVerifyPin('');
    };

    const confirmRemovePin = () => {
        if (verifyPin === appPin) {
            setAppPin(null);
            setSecurityQA([]);
            setIsRemoveVerifyOpen(false);
            setVerifyPin('');
            alert("App security has been disabled.");
        } else {
            alert("Incorrect PIN. Cannot remove security.");
            setVerifyPin('');
        }
    };

    const updateQa = (index: number, field: 'question' | 'answer', value: string) => {
        const newList = [...qaList];
        newList[index] = { ...newList[index], [field]: value };
        setQaList(newList);
    };

    return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
      
      {/* Reset Modal Overlay */}
      {resetStep !== 'idle' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 animate-in zoom-in-95 duration-200">
                  {resetStep === 'backup-prompt' && (
                      <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                              <Download size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Backup Your Data?</h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-6">Before you reset everything to 0, we strongly recommend downloading a backup file.</p>
                          <div className="space-y-3">
                              <button onClick={handleDownloadBackupAndProceed} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center">
                                  <FileJson size={18} className="mr-2"/> Download Backup & Continue
                              </button>
                              <button onClick={handleSkipBackup} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                  Skip Backup
                              </button>
                              <button onClick={() => setResetStep('idle')} className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">Cancel</button>
                          </div>
                      </div>
                  )}

                  {resetStep === 'final-confirm' && (
                      <div className="text-center">
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                              <AlertTriangle size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reset All Data?</h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-6">This action is <span className="font-bold text-red-500">irreversible</span>. All transactions, accounts, and settings will be permanently deleted and set to 0.</p>
                          <div className="space-y-3">
                              <button onClick={handleFinalReset} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                                  Yes, Reset Everything
                              </button>
                              <button onClick={() => setResetStep('idle')} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                  Cancel
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-10">
        
        {/* Currency Settings */}
        <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Globe size={18} className="mr-2 text-blue-500"/> Currency & Conversion
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Currency</label>
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {CURRENCY_OPTIONS.map(opt => (
                            <option key={opt.code} value={opt.code}>{opt.name} ({opt.symbol})</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">All amounts will be displayed with this currency symbol.</p>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Conversion Rate</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={currencyRate}
                            onChange={(e) => setCurrencyRate(parseFloat(e.target.value))}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                            placeholder="1.0"
                            step="0.000001"
                        />
                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-sm">
                            Rate
                        </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">Conversion Preview:</span>
                            </div>
                            <div className="flex items-center space-x-2 font-mono text-sm">
                                <span>1.00 (Base)</span>
                                <span>×</span>
                                <span>{currencyRate}</span>
                                <span>=</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(1 * currencyRate)}
                                </span>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400 italic leading-relaxed">
                                Note: Your stored data remains in the original currency. This rate is only used to calculate the displayed value.
                                <br/>Example: If data is INR and you select USD, rate should be ~0.012.
                            </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Security Settings */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <ShieldCheck size={18} className="mr-2 text-emerald-500"/> App Security
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                {isRemoveVerifyOpen ? (
                     <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center text-red-600 font-bold mb-2">
                            <AlertTriangle size={20} className="mr-2" />
                            Disable Security
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Please enter your current PIN to confirm removal.</p>
                        
                        <input 
                            type="password" 
                            value={verifyPin}
                            onChange={(e) => setVerifyPin(e.target.value.slice(0, 4))}
                            maxLength={4}
                            placeholder="Enter Current PIN"
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none tracking-widest text-center text-xl font-bold"
                            autoFocus
                        />
                        
                        <div className="flex gap-3">
                             <button onClick={cancelRemovePin} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                             <button onClick={confirmRemovePin} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-500/30 transition-colors">Confirm Removal</button>
                        </div>
                    </div>
                ) : appPin && !isSetupOpen ? (
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                                <Lock size={16} className="mr-2" /> App Protected
                            </div>
                            <p className="text-sm text-slate-500">PIN and security questions are set.</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setIsSetupOpen(true)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center">
                                <Key size={16} className="mr-2"/> Change PIN
                             </button>
                            <button onClick={initiateRemovePin} className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center">
                                <Unlock size={16} className="mr-2"/> Remove PIN
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                         <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{appPin ? 'Enter New PIN' : 'Set App PIN'} (4 Digits)</label>
                                <input 
                                    type="password" 
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
                                    maxLength={4}
                                    placeholder="Enter 4 digits"
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-center text-xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Security Questions (Required for Recovery)</h4>
                            <div className="space-y-4">
                                {[0, 1, 2].map(idx => (
                                    <div key={idx} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Question {idx + 1}</label>
                                        <select 
                                            value={qaList[idx].question}
                                            onChange={(e) => updateQa(idx, 'question', e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white mb-3 text-sm outline-none"
                                        >
                                            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                        </select>
                                        <input 
                                            type="text"
                                            value={qaList[idx].answer}
                                            onChange={(e) => updateQa(idx, 'answer', e.target.value)}
                                            placeholder="Your answer"
                                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                             {appPin && <button onClick={() => setIsSetupOpen(false)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium">Cancel</button>}
                             <button onClick={handleSaveSecurity} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-500/20">
                                {appPin ? 'Update Security Settings' : 'Enable Security'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* AI Configuration */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Mic size={18} className="mr-2 text-purple-500"/> AI Assistant Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                        <Languages size={16} className="mr-2"/> Response Language
                    </label>
                    <select 
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">The AI will strictly respond in this language only.</p>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                        <Mic size={16} className="mr-2"/> Voice Persona
                    </label>
                    <select 
                        value={aiVoice}
                        onChange={(e) => setAiVoice(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        <option value="Puck">Puck (Male)</option>
                        <option value="Charon">Charon (Male)</option>
                        <option value="Kore">Kore (Female)</option>
                        <option value="Fenrir">Fenrir (Male)</option>
                        <option value="Zephyr">Zephyr (Female)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">Select the voice tone for the floating assistant.</p>
                </div>
            </div>
        </div>

        {/* Dropdown Manager */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center"><List size={18} className="mr-2 text-blue-500"/> Manage Dropdown Options</h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'expense', label: 'Expenses' },
                    { id: 'income', label: 'Income' },
                    { id: 'debt', label: 'Debt Types' },
                    { id: 'investment', label: 'Inv. Types' },
                    { id: 'account', label: 'Acc. Types' }
                ].map(type => (
                    <button 
                        key={type.id}
                        onClick={() => setActiveList(type.id as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeList === type.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add New {label}</label>
                <div className="flex gap-3 max-w-md mb-6">
                    <input 
                        value={newOption} 
                        onChange={e => setNewOption(e.target.value)} 
                        placeholder={`e.g. New ${label}...`} 
                        className="flex-1 p-2.5 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <button onClick={addOption} className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 font-medium shadow-md">Add</button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {list.map(item => (
                        <span key={item} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-sm flex items-center border border-slate-200 dark:border-slate-600 shadow-sm">
                            <span className="text-slate-700 dark:text-slate-200 mr-2 font-medium">{item}</span>
                            <button onClick={() => removeOption(item)} className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={14} /></button>
                        </span>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-8">
            <div>
                 <h3 className="font-bold text-slate-900 dark:text-white">Appearance</h3>
                 <p className="text-sm text-slate-500">Toggle between Light and Dark themes</p>
            </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center space-x-3 px-5 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-500" />}
            <span className="text-slate-900 dark:text-white font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center"><Save size={18} className="mr-2 text-emerald-500"/> Data Backup & Export</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <button onClick={exportData} className="flex-1 flex items-center justify-center px-4 py-3 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium transition-colors">
                <FileJson size={18} className="mr-2" /> Export to JSON
                </button>
                <button onClick={exportToExcel} className="flex-1 flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors shadow-lg shadow-emerald-500/20">
                <FileSpreadsheet size={18} className="mr-2" /> Export to Excel (.xls)
                </button>
            </div>
            
            <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer font-medium transition-colors">
                <Upload size={18} className="mr-2" /> Restore from JSON Backup
                <input type="file" onChange={importData} className="hidden" accept=".json" />
                </label>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 p-3 rounded-lg text-center bg-slate-50 dark:bg-slate-900/50">
            🔒 Data is stored locally on your device. Clearing cache will remove it.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-red-100 dark:border-red-900/30 pt-8">
            <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center"><AlertTriangle size={18} className="mr-2"/> Danger Zone</h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Reset Application</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Permanently delete all data and start fresh.</p>
                </div>
                <button onClick={handleResetClick} className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors flex items-center">
                    <Trash2 size={16} className="mr-2" /> Reset All Data
                </button>
            </div>
        </div>

      </div>
    </div>
    );
};

export default SettingsModule;