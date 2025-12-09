import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldAlert, KeyRound, Unlock } from 'lucide-react';
import { SecurityQA } from '../types';

interface LockScreenProps {
  onUnlock: (pin: string) => boolean;
  securityQA?: SecurityQA[];
  onRecoveryUnlock?: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, securityQA = [], onRecoveryUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Recovery Mode State
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryAnswers, setRecoveryAnswers] = useState<string[]>(['', '', '']);
  const [recoveryError, setRecoveryError] = useState('');

  useEffect(() => {
    if (pin.length === 4) {
      // Small delay to let the user see the 4th dot
      const timer = setTimeout(() => {
          const success = onUnlock(pin);
          if (!success) {
            setError(true);
            setShake(true);
            setPin('');
            setTimeout(() => setShake(false), 500);
          }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pin, onUnlock]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleRecoverySubmit = () => {
      if (!securityQA || securityQA.length === 0) {
          setRecoveryError("No security questions set.");
          return;
      }

      let correctCount = 0;
      securityQA.forEach((qa, index) => {
          if (qa.answer.trim().toLowerCase() === recoveryAnswers[index]?.trim().toLowerCase()) {
              correctCount++;
          }
      });

      if (correctCount >= 2) {
          if (onRecoveryUnlock) onRecoveryUnlock();
      } else {
          setRecoveryError(`Only ${correctCount} correct. You need at least 2.`);
      }
  };

  if (isRecoveryMode) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4 text-purple-500">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Account Recovery</h2>
                    <p className="text-slate-400 text-sm text-center mt-2">Answer at least 2 security questions correctly to unlock.</p>
                </div>

                <div className="space-y-4 mb-6">
                    {securityQA.map((qa, idx) => (
                        <div key={idx}>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{qa.question}</label>
                            <input 
                                type="text" 
                                value={recoveryAnswers[idx]}
                                onChange={(e) => {
                                    const newAnswers = [...recoveryAnswers];
                                    newAnswers[idx] = e.target.value;
                                    setRecoveryAnswers(newAnswers);
                                    setRecoveryError('');
                                }}
                                placeholder="Your answer..."
                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-purple-500 outline-none transition-colors"
                            />
                        </div>
                    ))}
                </div>

                {recoveryError && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-xl text-sm text-center mb-4">
                        {recoveryError}
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsRecoveryMode(false)}
                        className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleRecoverySubmit}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30"
                    >
                        Unlock App
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4">
       <div className={`w-full max-w-sm bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 text-blue-500">
             {error ? <ShieldAlert size={40} className="text-red-500" /> : <Lock size={40} />}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
          <p className="text-slate-400 mb-8 text-sm">Enter your 4-digit PIN to access FinTrackPro</p>

          {/* PIN Dots */}
          <div className="flex space-x-6 mb-10">
            {[0, 1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        i < pin.length 
                        ? (error ? 'bg-red-500 scale-125' : 'bg-blue-500 scale-125') 
                        : 'bg-slate-600'
                    }`}
                />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                    key={num}
                    onClick={() => handleNumClick(num.toString())}
                    className="h-16 w-16 rounded-full bg-slate-700 text-white text-2xl font-bold hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center mx-auto"
                >
                    {num}
                </button>
             ))}
             <div className="h-16 w-16 flex items-center justify-center">
                 {/* Empty or Forgot Password Button Placeholder */}
             </div>
             <button
                onClick={() => handleNumClick('0')}
                className="h-16 w-16 rounded-full bg-slate-700 text-white text-2xl font-bold hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center mx-auto"
             >
                0
             </button>
             <button
                onClick={handleDelete}
                className="h-16 w-16 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 active:scale-95 transition-all flex items-center justify-center mx-auto"
             >
                <Delete size={28} />
             </button>
          </div>
          
          <div className="mt-8 h-6">
             {error ? (
                <button 
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-red-400 text-sm font-medium hover:text-red-300 underline underline-offset-4 animate-pulse"
                >
                    Incorrect PIN. Forgot PIN?
                </button>
             ) : (
                <button 
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors"
                >
                    Forgot PIN?
                </button>
             )}
          </div>
       </div>
    </div>
  );
};

export default LockScreen;