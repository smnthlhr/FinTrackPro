import React, { useState } from 'react';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (val: string) => void;
    title: string;
    label: string;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onConfirm, title, label }) => {
    const [val, setVal] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">{label}</label>
                    <input 
                        type="number" 
                        value={val} 
                        onChange={e => setVal(e.target.value)}
                        autoFocus
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => { setVal(''); onClose(); }} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-medium">Cancel</button>
                    <button onClick={() => { onConfirm(val); setVal(''); onClose(); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/30">Save</button>
                </div>
            </div>
        </div>
    );
};

export default InputModal;