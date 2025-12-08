import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Radio, Activity, XCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToBytes, decodeAudioData, createPcmBlob } from '../utils';

interface LiveVoiceModeProps {
  apiKey: string;
  systemInstruction: string;
  isCompact?: boolean; // New prop to adjust layout for floating mode
  voiceName?: string; // New prop for selecting voice
}

const LiveVoiceMode: React.FC<LiveVoiceModeProps> = ({ apiKey, systemInstruction, isCompact = false, voiceName = 'Zephyr' }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for audio processing to avoid re-renders and stale closures
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null); 
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const visualizeVolume = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    setVolumeLevel(average); // 0 to 255 roughly
    
    animationRef.current = requestAnimationFrame(visualizeVolume);
  };

  const toggleMute = () => {
    if (streamRef.current) {
        const newMutedState = !isMuted;
        streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !newMutedState;
        });
        setIsMuted(newMutedState);
    }
  };

  const startSession = async () => {
    if (!apiKey) {
      alert("API Key is missing.");
      return;
    }

    try {
      setStatus('connecting');
      setIsMuted(false);
      
      // 1. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      // 2. Setup Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to Gemini Live
      const ai = new GoogleGenAI({ apiKey });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setStatus('connected');
            setIsActive(true);

            // Start Audio Input Streaming
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Analyser for visualizer
            const analyser = inputCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            visualizeVolume(); // Start viz loop

            // Processor for sending data
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // CRITICAL: Send input only when session is resolved
              sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              
              // Sync start time
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToBytes(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
            
            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                console.log("Model interrupted");
                audioSourcesRef.current.forEach(s => s.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            stopSession();
          },
          onerror: (err) => {
            console.error("Session error", err);
            setStatus('error');
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      setStatus('error');
    }
  };

  const stopSession = () => {
    setStatus('disconnected');
    setIsActive(false);
    setIsMuted(false);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    audioSourcesRef.current.forEach(s => {
        try { s.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (sessionRef.current) {
        sessionRef.current.then((s: any) => {
             try { s.close(); } catch(e){} 
        });
        sessionRef.current = null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500 ${isCompact ? 'p-4' : 'p-8'}`}>
       <div className={`relative ${isCompact ? 'mb-4' : 'mb-8'}`}>
          {/* Visualizer Circle */}
          <div 
             className={`rounded-full flex items-center justify-center transition-all duration-100 ease-out ${isActive ? (isMuted ? 'bg-slate-300 dark:bg-slate-600' : 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.5)]') : 'bg-slate-200 dark:bg-slate-700'}`}
             style={{ 
                 width: isCompact ? '80px' : '120px',
                 height: isCompact ? '80px' : '120px',
                 transform: isActive && !isMuted ? `scale(${1 + (volumeLevel / 100)})` : 'scale(1)' 
             }}
          >
             {isActive ? (
                isMuted ? <MicOff size={isCompact ? 32 : 48} className="text-slate-500 dark:text-slate-400" /> : <Mic size={isCompact ? 32 : 48} className="text-white" />
             ) : (
                <MicOff size={isCompact ? 32 : 48} className="text-slate-400" />
             )}
          </div>
          {/* Ripple Effect */}
          {isActive && !isMuted && (
             <>
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-50 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border border-blue-400 opacity-30 animate-[ping_1.5s_ease-in-out_infinite]"></div>
             </>
          )}
       </div>

       <h2 className={`${isCompact ? 'text-xl' : 'text-3xl'} font-bold text-slate-900 dark:text-white mb-2`}>
         {status === 'connected' ? (isMuted ? 'Mic Muted' : 'Listening...') : status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Connection Error' : 'Voice Assistant'}
       </h2>
       
       {!isCompact && (
        <p className="text-slate-500 mb-8 max-w-md">
            {status === 'connected' 
            ? (isMuted ? "Tap un-mute to resume conversation." : "Go ahead, ask me about your finances, transactions, or net worth.")
            : "Start a real-time voice conversation with your AI financial advisor."}
        </p>
       )}
       
       {/* Compact Mode Hint Text */}
       {isCompact && status !== 'connected' && (
           <p className="text-xs text-slate-400 mb-6 px-4">Tap below to speak in English, Hindi, or Bengali.</p>
       )}

       {status === 'error' && (
         <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-sm">
            <XCircle size={16} className="mr-2"/>
            <span>Connection Failed</span>
         </div>
       )}

       {isActive ? (
           <div className="flex items-center gap-4">
                <button
                    onClick={toggleMute}
                    className={`rounded-full p-4 md:p-4 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${
                        isMuted 
                        ? 'bg-slate-700 text-white hover:bg-slate-800' 
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                    }`}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                    {isMuted ? <MicOff size={isCompact ? 20 : 24} /> : <Mic size={isCompact ? 20 : 24} />}
                </button>

                <button
                    onClick={stopSession}
                    className={`rounded-full font-bold shadow-xl transition-all transform hover:scale-105 flex items-center justify-center ${
                        isCompact ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-lg'
                    } bg-red-500 text-white hover:bg-red-600 shadow-red-500/30`}
                >
                    <Radio size={isCompact ? 18 : 24} className="mr-2 animate-pulse"/> {isCompact ? 'End' : 'End Session'}
                </button>
           </div>
       ) : (
        <button
            onClick={startSession}
            className={`rounded-full font-bold shadow-xl transition-all transform hover:scale-105 flex items-center justify-center ${
                isCompact ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-lg'
            } bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30`}
        >
            <Mic size={isCompact ? 18 : 24} className="mr-2"/> {isCompact ? 'Speak' : 'Start Voice Chat'}
        </button>
       )}
       
       <div className={`mt-auto flex items-center text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 ${isCompact ? 'mt-6' : 'mt-8'}`}>
           <Volume2 size={12} className="mr-2" />
           <span>Low Latency • Multi-lingual</span>
       </div>
    </div>
  );
};

export default LiveVoiceMode;