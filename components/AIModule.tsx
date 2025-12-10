import React, { useState } from 'react';
import { Brain, MessageSquare, Mic, Sparkles, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { 
    Transaction, Account, Investment, Debt, Goal, AppMetadata, Lending 
} from '../types';
import { formatDate, generateAIContext } from '../utils';
import LiveVoiceMode from './LiveVoiceMode';

// --- Simple Markdown Renderer Component ---
const MarkdownRenderer = ({ content }: { content: string }) => {
    // Helper to parse bold text (**text**) inside a string
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const lines = content.split('\n');

    return (
        <div className="space-y-1.5 text-sm">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                // List Items (* or -)
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    return (
                        <div key={i} className="flex items-start ml-2 space-x-2">
                             <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                             <span className="text-slate-700 dark:text-slate-200">{renderInline(trimmed.substring(2))}</span>
                        </div>
                    );
                }

                // Headers (### or ##)
                if (trimmed.startsWith('### ')) return <h4 key={i} className="font-bold text-base mt-3 mb-1 text-slate-800 dark:text-slate-100">{renderInline(trimmed.substring(4))}</h4>;
                if (trimmed.startsWith('## ')) return <h3 key={i} className="font-bold text-lg mt-4 mb-2 text-slate-900 dark:text-white">{renderInline(trimmed.substring(3))}</h3>;
                
                // Regular Paragraph
                return <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-200">{renderInline(line)}</p>;
            })}
        </div>
    );
};

interface AIModuleProps {
    setView: (view: string) => void;
    transactions: Transaction[];
    accounts: Account[];
    investments: Investment[];
    debts: Debt[];
    goals: Goal[];
    lendings: Lending[];
    totalNetWorth: number;
    totalDebtValue: number;
    monthlyMetrics: any;
    appMetadata: AppMetadata;
    incomeCategories: string[];
    expenseCategories: string[];
    accountTypes: string[];
    investmentTypes: string[];
    debtTypes: string[];
    aiLanguage: string;
    aiVoice: string;
}

const AIModule: React.FC<AIModuleProps> = ({ 
    setView, transactions, accounts, investments, debts, goals, lendings,
    totalNetWorth, totalDebtValue, monthlyMetrics, appMetadata, 
    incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes,
    aiLanguage, aiVoice
}) => {
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // IMPORTANT: API key must be from process.env.API_KEY
    const apiKey = process.env.API_KEY;

    // Use shared context generator
    const contextData = generateAIContext(
        transactions, accounts, investments, debts, goals, lendings,
        appMetadata,
        incomeCategories, expenseCategories, accountTypes, investmentTypes, debtTypes,
        totalNetWorth, totalDebtValue, monthlyMetrics
    );
    
    // System instructions tailored for mode
    const textSystemPrompt = `You are the AI Financial Advisor for the FinTrackPro app. You have READ-ONLY access to the user's application metadata and financial records. Here is the complete application state in JSON format: ${JSON.stringify(contextData)}. 
    
    RULES:
    1. Answer questions about the user's financial health, app usage history, or data customization.
    2. Format currency in INR (₹).
    3. LANGUAGE: Respond ONLY in ${aiLanguage}.
    4. FORMATTING: Use Markdown for structure. Use **bold** for key figures and headings. Use bullet points (* item) for lists. Do NOT use markdown code blocks or JSON output unless explicitly asked.
    5. DENY DATA ENTRY: You CANNOT add, edit, or delete any data (transactions, accounts, etc.). If the user asks to add a transaction or modify data, politely decline and instruct them to use the app's manual buttons.`;

    const voiceSystemPrompt = `You are FinTrackPro's Voice Assistant. You have access to the user's finances: ${JSON.stringify(contextData)}. 
    
    RULES:
    1. Speak naturally and keep responses concise. Do not read out long lists of data.
    2. LANGUAGE: Speak ONLY in ${aiLanguage}. Even if the user speaks another language, reply strictly in ${aiLanguage}.
    3. DENY DATA ENTRY: You CANNOT add or modify data. If asked to add/edit data, refuse politely and direct the user to the manual buttons.`;

    const handleSend = async (textInput?: string) => {
      const msgToSend = textInput || input;
      if (!msgToSend.trim() || !apiKey) return;
      
      const userMsg = { role: 'user' as const, content: msgToSend };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const ai = new GoogleGenAI({ apiKey });
        // Use gemini-2.5-flash for basic text tasks
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
                role: 'user',
                parts: [{ text: textSystemPrompt + "\n\nUser Question: " + msgToSend }]
            }
          ]
        });
        
        const aiText = response.text;
        if (!aiText) throw new Error("No response generated by the model.");

        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      } catch (err: any) { 
          setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message || 'Unknown error occurred'}` }]); 
      }
      setLoading(false);
    };

    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to clear the conversation history?")) {
            setMessages([]);
            setLoading(false);
        }
    };

    const faqs = [
        "What is my current Net Worth?",
        "What do I spend the most on?",
        "Calculate my average daily spending.",
        "How much have I saved this month?",
        "Do I have any debt repayment due?",
        "Analyze my investment portfolio.",
        "Suggest ways to cut costs.",
        "What is my total liquidity?"
    ];

    if (!apiKey) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-pulse">
            <Brain size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Financial Advisor Unavailable</h2>
          <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
             The API Key is missing from the environment configuration. Please ensure \`process.env.API_KEY\` is set.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center backdrop-blur-sm justify-between">
          <div className="flex items-center space-x-4">
             <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                <button 
                  onClick={() => setMode('text')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'text' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <MessageSquare size={16} className="mr-2"/> Text Chat
                </button>
                <button 
                  onClick={() => setMode('voice')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'voice' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <Mic size={16} className="mr-2"/> Voice Mode
                </button>
             </div>
          </div>
          <div className="flex items-center space-x-3">
             {mode === 'text' && messages.length > 0 && (
                <button 
                    onClick={handleClearChat}
                    className="flex items-center px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm cursor-pointer z-10"
                    title="Clear Conversation"
                >
                    <Trash2 size={14} className="mr-1.5"/> Clear
                </button>
             )}
             <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hidden sm:block">
                Registered: {formatDate(appMetadata.createdAt)}
             </div>
          </div>
        </div>
        
        {mode === 'voice' ? (
            <LiveVoiceMode apiKey={apiKey} systemInstruction={voiceSystemPrompt} voiceName={aiVoice} />
        ) : (
            <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                            <Sparkles size={32} className="text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">How can I help you today?</h3>
                        <p className="max-w-xs mb-8 text-sm">I have analyzed your full financial profile. Ask me anything or choose a topic below.</p>
                        
                        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                            {faqs.map((faq, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(faq)} 
                                    className="text-xs bg-white dark:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm flex items-center"
                                >
                                    {faq}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-600'}`}>
                        {m.role === 'ai' ? <MarkdownRenderer content={m.content} /> : m.content}
                    </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex space-x-1 border border-slate-100 dark:border-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    </div>
                )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex space-x-2">
                    <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your data, settings, or history..."
                    className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button onClick={() => handleSend()} className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium">Send</button>
                </div>
                </div>
            </>
        )}
      </div>
    );
};

export default AIModule;