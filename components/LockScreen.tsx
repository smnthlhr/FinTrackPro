import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (pin: string) => boolean;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

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
             <div className="h-16 w-16"></div>
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
          
          {error && <p className="text-red-500 mt-6 font-medium animate-pulse">Incorrect PIN</p>}
       </div>
    </div>
  );
};

export default LockScreen;