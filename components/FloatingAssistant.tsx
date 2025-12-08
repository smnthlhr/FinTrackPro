import React, { useState } from 'react';
import { Mic, X, MessageSquare, ChevronDown } from 'lucide-react';
import LiveVoiceMode from './LiveVoiceMode';

interface FloatingAssistantProps {
    apiKey: string | undefined;
    systemInstruction: string;
    voiceName?: string;
}

const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ apiKey, systemInstruction, voiceName }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!apiKey) return null; // Don't show if no API key

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Popover Card */}
            {isOpen && (
                <div className="mb-4 w-[340px] h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="flex items-center space-x-2">
                             <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                 <MessageSquare size={16} className="text-blue-600 dark:text-blue-400"/>
                             </div>
                             <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">FinTrack Assistant</span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 relative">
                         <LiveVoiceMode 
                            apiKey={apiKey} 
                            systemInstruction={systemInstruction} 
                            isCompact={true}
                            voiceName={voiceName}
                        />
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                    isOpen 
                    ? 'bg-slate-700 text-white rotate-90' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/40'
                }`}
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <X size={28} /> : <Mic size={28} />}
            </button>
        </div>
    );
};

export default FloatingAssistant;