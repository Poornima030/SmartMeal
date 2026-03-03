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

  const step = recipe.instructions[currentStep];

  useEffect(() => {
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.2;
      }
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
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
      <div className="px-8 py-8 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white/50 dark:bg-stone-950/50 backdrop-blur-md">
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-all">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Cooking Mode</h2>
          <p className="text-sm font-serif font-bold text-stone-900 dark:text-white truncate max-w-[200px]">{recipe.title}</p>
        </div>
        <div className="w-12" />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold text-xl mb-4">
              {currentStep + 1}
            </div>
            <h3 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-stone-900 dark:text-white">
              {step.text}
            </h3>

            {step.timer && (
              <div className="pt-8 flex justify-center w-full">
                {timeLeft === null ? (
                  <button 
                    onClick={() => startTimer(step.timer!)}
                    className="flex items-center gap-3 px-10 py-5 bg-brand-600 dark:bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-brand-600/20 dark:shadow-brand-500/20 hover:scale-105 transition-all"
                  >
                    <Timer size={24} />
                    <span>Start {step.timer / 60}m Timer</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className={cn(
                      "text-7xl font-mono font-bold",
                      timeLeft === 0 ? "text-red-500 animate-bounce" : "text-brand-700 dark:text-brand-400"
                    )}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setIsTimerActive(!isTimerActive)}
                        className="p-4 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600"
                      >
                        {isTimerActive ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button 
                        onClick={() => setTimeLeft(step.timer!)}
                        className="p-4 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600"
                      >
                        <RotateCcw size={24} />
                      </button>
                    </div>
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
                      className="text-xs font-bold text-brand-600 uppercase tracking-widest hover:underline"
                    >
                      Skip to next step
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-8 py-12 space-y-8">
        <div className="flex justify-center gap-6">
          <button 
            onClick={speakStep}
            className="w-20 h-20 rounded-full bg-brand-500 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95"
          >
            <Volume2 size={32} />
          </button>
        </div>

        <div className="flex gap-4 max-w-xl mx-auto w-full">
          <button
            disabled={currentStep === 0}
            onClick={() => { setCurrentStep(prev => prev - 1); setTimeLeft(null); setIsTimerActive(false); }}
            className="flex-1 py-5 rounded-3xl bg-stone-200 dark:bg-stone-900 font-bold text-stone-800 dark:text-stone-300 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            <ChevronLeft size={24} />
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
            className="flex-[2] py-5 rounded-3xl bg-brand-600 dark:bg-brand-500 text-white font-bold shadow-xl shadow-brand-600/30 dark:shadow-brand-500/30 flex items-center justify-center gap-2 hover:bg-brand-700 dark:hover:bg-brand-600 transition-all"
          >
            {currentStep === recipe.instructions.length - 1 ? (
              <>
                <CheckCircle2 size={24} />
                <span>Finish Cooking</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight size={24} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
