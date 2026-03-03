import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Volume2, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Recipe } from '../types';
import { cn } from '../utils';

interface Props {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingMode: React.FC<Props> = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishAudioRef = useRef<HTMLAudioElement | null>(null);

  const step = recipe.instructions[currentStep];

  // Initialize audio objects
  useEffect(() => {
    // Using a more reliable relaxing track
    const music = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3');
    music.loop = true;
    music.volume = 0.15;
    audioRef.current = music;

    const ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    ding.volume = 0.4;
    finishAudioRef.current = ding;

    return () => {
      music.pause();
      music.src = '';
      ding.pause();
      ding.src = '';
    };
  }, []);

  // Handle background music play/pause
  useEffect(() => {
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      audioRef.current?.play().catch(e => console.log("Background music play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isTimerActive, timeLeft]);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      finishAudioRef.current?.play().catch(e => console.log("Finish sound play failed:", e));
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsTimerActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Speech Synthesis Handler
  const speakStep = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.text);
      
      // Try to find an Indian English voice for a more natural accent
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang === 'en-IN' || v.lang.includes('en-IN'));
      
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white dark:bg-stone-950 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950">
        <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-all">
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex flex-col items-center text-center px-2">
          <h2 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-600 dark:text-brand-400">Cooking Mode</h2>
          <p className="text-xs md:text-sm font-serif font-bold text-stone-900 dark:text-white truncate max-w-[150px] md:max-w-[300px]">{recipe.title}</p>
        </div>
        <div className="w-10 md:w-12" />
      </div>

      {/* Progress Bar */}
      <div className="flex w-full h-1 bg-stone-100 dark:bg-stone-900">
        {recipe.instructions?.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 transition-all duration-500",
              i <= currentStep ? "bg-brand-500" : "bg-transparent"
            )} 
          />
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center px-6 md:px-8 py-12 md:py-20 text-center max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              className="w-full space-y-8 md:space-y-12"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold text-xl md:text-3xl shadow-inner">
                {currentStep + 1}
              </div>
              
              <h3 className="text-3xl md:text-5xl lg:text-7xl font-serif font-bold leading-[1.1] text-stone-900 dark:text-white px-2 tracking-tight">
                {step.text}
              </h3>

              {step.timer && (
                <div className="pt-6 md:pt-10 flex flex-col items-center gap-8">
                  {timeLeft === null ? (
                    <button 
                      onClick={() => startTimer(step.timer!)}
                      className="flex items-center gap-4 px-10 md:px-14 py-5 md:py-7 bg-brand-600 dark:bg-brand-500 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-brand-600/30 dark:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Timer size={28} />
                      <span>Start {step.timer / 60}m Timer</span>
                    </button>
                  ) : (
                    <div className="w-full max-w-md p-8 md:p-12 rounded-[3rem] bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 shadow-2xl space-y-8">
                      <div className={cn(
                        "text-7xl md:text-9xl font-mono font-bold tracking-tighter tabular-nums",
                        timeLeft === 0 ? "text-red-500 animate-pulse" : "text-brand-700 dark:text-brand-400"
                      )}>
                        {formatTime(timeLeft)}
                      </div>
                      <div className="flex justify-center gap-6">
                        <button 
                          onClick={() => setIsTimerActive(!isTimerActive)}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-stone-100 dark:border-stone-700"
                        >
                          {isTimerActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                        </button>
                        <button 
                          onClick={() => setTimeLeft(step.timer!)}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-stone-100 dark:border-stone-700"
                        >
                          <RotateCcw size={32} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="px-6 md:px-8 py-6 md:py-10 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-center">
            <button 
              onClick={speakStep}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-500 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 group relative"
            >
              <div className="absolute inset-0 rounded-full bg-brand-500 animate-ping opacity-20 group-hover:opacity-40" />
              <Volume2 size={32} className="relative z-10" />
            </button>
          </div>

          <div className="flex gap-4 md:gap-6">
            <button
              disabled={currentStep === 0}
              onClick={() => { setCurrentStep(prev => prev - 1); setTimeLeft(null); setIsTimerActive(false); }}
              className="flex-1 py-5 md:py-7 rounded-2xl md:rounded-[2rem] bg-stone-100 dark:bg-stone-900 font-bold text-stone-800 dark:text-stone-300 disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => {
                if (currentStep === recipe.instructions.length - 1) {
                  onClose();
                } else {
                  setCurrentStep(prev => prev + 1);
                  setTimeLeft(null);
                  setIsTimerActive(false);
                }
              }}
              className="flex-[2] py-5 md:py-7 rounded-2xl md:rounded-[2rem] bg-brand-600 dark:bg-brand-500 text-white font-bold shadow-2xl shadow-brand-600/30 dark:shadow-brand-500/30 flex items-center justify-center gap-2 hover:bg-brand-700 dark:hover:bg-brand-600 transition-all"
            >
              {currentStep === recipe.instructions.length - 1 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                  <span>Finish Cooking</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
