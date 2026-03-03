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
  const finishAudioRef = useRef<HTMLAudioElement | null>(null);
  const vibrateIntervalRef = useRef<any>(null);

  const step = recipe.instructions[currentStep];

  // Initialize audio objects
  useEffect(() => {
    const ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    ding.volume = 0.5;
    ding.loop = true; // Make it loop
    finishAudioRef.current = ding;

    return () => {
      ding.pause();
      ding.src = '';
      stopFinishSound();
    };
  }, []);

  const stopFinishSound = () => {
    if (finishAudioRef.current) {
      finishAudioRef.current.pause();
      finishAudioRef.current.currentTime = 0;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    if (navigator.vibrate) navigator.vibrate(0); // Stop any ongoing vibration
  };

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      finishAudioRef.current?.play().catch(e => console.log("Finish sound play failed:", e));
      if (navigator.vibrate && !vibrateIntervalRef.current) {
        // Continuous vibration pattern while sound loops
        vibrateIntervalRef.current = setInterval(() => {
          navigator.vibrate([300, 100, 300]);
        }, 1000);
      }
    }
    return () => {
      clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  const startTimer = (seconds: number) => {
    stopFinishSound();
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
      className="fixed inset-0 z-[100] bg-white dark:bg-stone-950 flex flex-col overflow-hidden"
    >
      {/* Header - Seamless */}
      <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
        <button 
          onClick={() => { stopFinishSound(); onClose(); }} 
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-all"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex flex-col items-center text-center px-2">
          <h2 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-600 dark:text-brand-400">Cooking Mode</h2>
          <p className="text-xs md:text-sm font-serif font-bold text-stone-900 dark:text-white truncate max-w-[150px] md:max-w-[300px]">{recipe.title}</p>
        </div>
        <div className="w-10 md:w-12" />
      </div>

      {/* Progress Bar */}
      <div className="flex w-full h-1 bg-stone-100 dark:bg-stone-900/50">
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

      {/* Main Content Area - Seamless and Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center max-w-6xl mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -5 }}
            className="w-full flex flex-col items-center gap-6 md:gap-10"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold text-lg md:text-2xl shrink-0">
              {currentStep + 1}
            </div>
            
            <h3 className={cn(
              "font-serif font-bold leading-tight text-stone-900 dark:text-white px-2 text-balance transition-all duration-300",
              step.text.length > 100 ? "text-xl md:text-3xl lg:text-4xl" : "text-2xl md:text-5xl lg:text-6xl"
            )}>
              {step.text}
            </h3>

            {step.timer && (
              <div className="w-full flex flex-col items-center gap-6">
                {timeLeft === null ? (
                  <button 
                    onClick={() => startTimer(step.timer!)}
                    className="flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 bg-brand-600 dark:bg-brand-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 dark:shadow-brand-500/20 hover:scale-105 transition-all"
                  >
                    <Timer size={24} />
                    <span>Start {step.timer / 60}m Timer</span>
                  </button>
                ) : (
                  <div className="w-full max-w-md p-6 md:p-8 rounded-[2.5rem] bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/50 shadow-xl space-y-4">
                    <div className={cn(
                      "text-6xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums",
                      timeLeft === 0 ? "text-red-500 animate-pulse" : "text-brand-700 dark:text-brand-400"
                    )}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setIsTimerActive(!isTimerActive)}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                      >
                        {isTimerActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                      </button>
                      <button 
                        onClick={() => { stopFinishSound(); setTimeLeft(step.timer!); }}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                      >
                        <RotateCcw size={28} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls - Seamless */}
      <div className="px-6 md:px-8 py-6 md:py-10 bg-transparent">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-center">
            <button 
              onClick={speakStep}
              className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-brand-500 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 group"
            >
              <Volume2 size={28} className="group-hover:animate-pulse" />
            </button>
          </div>

          <div className="flex gap-3 md:gap-6">
            <button
              disabled={currentStep === 0}
              onClick={() => { 
                stopFinishSound();
                setCurrentStep(prev => prev - 1); 
                setTimeLeft(null); 
                setIsTimerActive(false); 
              }}
              className="flex-1 py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-stone-100 dark:bg-stone-900 font-bold text-stone-800 dark:text-stone-300 disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => {
                stopFinishSound();
                if (currentStep === recipe.instructions.length - 1) {
                  onClose();
                } else {
                  setCurrentStep(prev => prev + 1);
                  setTimeLeft(null);
                  setIsTimerActive(false);
                }
              }}
              className="flex-[2] py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-brand-600 dark:bg-brand-500 text-white font-bold shadow-xl shadow-brand-600/30 dark:shadow-brand-500/30 flex items-center justify-center gap-2 hover:bg-brand-700 dark:hover:bg-brand-600 transition-all"
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
