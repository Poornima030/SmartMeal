import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  Camera, 
  Plus, 
  X, 
  Loader2, 
  Flame, 
  Clock, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  Moon,
  Sun,
  Utensils,
  ShoppingBasket,
  Mic,
  Volume2,
  Share2,
  Heart,
  Timer,
  Calendar,
  Sparkles,
  History,
  TrendingUp,
  Filter,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn, TRENDING_RECIPES, DIETARY_OPTIONS, CUISINE_OPTIONS, INGREDIENT_CATEGORIES } from './utils';
import { Recipe, DietaryPreference, Cuisine, Ingredient } from './types';
import { RecipeCard } from './components/RecipeCard';
import { CookingMode } from './components/CookingMode';
import { NutritionDashboard } from './components/NutritionDashboard';
// Initialize Gemini
const getApiKey = () => {
  const metaEnv = (import.meta as any).env || {};
  const processEnv = (typeof process !== 'undefined' ? process.env : {}) as any;
  
  return metaEnv.VITE_GEMINI_API_KEY || 
         metaEnv.VITE_SMARTMEAL_API_KEY || 
         processEnv.VITE_GEMINI_API_KEY ||
         processEnv.GEMINI_API_KEY ||
         processEnv.VITE_SMARTMEAL_API_KEY ||
         processEnv.SMARTMEAL_API_KEY ||
         '';
};

// Initialize Gemini lazily
let aiInstance: any = null;
const getAi = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not found. Please set GEMINI_API_KEY in your environment variables.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};
const MODEL_NAME = "gemini-3-flash-preview";

export default function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('None');
  const [cuisine, setCuisine] = useState<Cuisine>('Any');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);
  const [recentIngredients, setRecentIngredients] = useState<string[][]>([]);
  const [activeTab, setActiveTab] = useState<'cook' | 'saved'>('cook');
  const [showFilters, setShowFilters] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [cookingTime, setCookingTime] = useState<string>('Any');

  const [trendingRecipes, setTrendingRecipes] = useState(TRENDING_RECIPES);
  const [isGeneratingTrending, setIsGeneratingTrending] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const recipeDetailRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('smartmeal_favorites');
    if (saved) setFavorites(JSON.parse(saved));

    const savedFull = localStorage.getItem('smartmeal_saved_recipes');
    if (savedFull) setSavedRecipes(JSON.parse(savedFull));

    // Daily Trending Logic
    const lastTrendingUpdate = localStorage.getItem('smartmeal_trending_date');
    const today = new Date().toDateString();
    
    if (lastTrendingUpdate !== today) {
      generateDailyTrending();
    } else {
      const cachedTrending = localStorage.getItem('smartmeal_trending_recipes');
      if (cachedTrending) setTrendingRecipes(JSON.parse(cachedTrending));
    }

    // Temporary debug log to help user identify the active API key
    const activeKey = getApiKey();
    if (activeKey) {
      console.log("🛠️ SmartMeal Debug: Active API Key starts with:", activeKey.substring(0, 8));
      console.log("🛠️ SmartMeal Debug: Active API Key ends with:", activeKey.substring(activeKey.length - 4));
    }
  }, []);

  const generateDailyTrending = async (retryCount = 0) => {
    setIsGeneratingTrending(true);
    try {
      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate exactly 5 trending and seasonal recipe ideas for today (${new Date().toDateString()}). 
        Ensure the output is a valid JSON array. Be concise but complete.`,
        config: {
          systemInstruction: "You are a professional chef and nutritionist. Always return valid, minified JSON. Do not include any markdown formatting or extra text. Keep descriptions and instructions concise to avoid truncation. Each recipe must be high quality and unique.",
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                cookTime: { type: Type.STRING },
                servings: { type: Type.NUMBER },
                difficulty: { type: Type.STRING },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.STRING },
                      category: { type: Type.STRING }
                    }
                  }
                },
                instructions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      timer: { type: Type.NUMBER }
                    }
                  }
                },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING }
                  }
                },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchScore: { type: Type.NUMBER },
                whyThisRecipe: { type: Type.STRING }
              }
            }
          }
        }
      });

      let data;
      try {
        let text = response.text?.trim() || '[]';
        // Remove potential markdown code blocks if they exist
        if (text.startsWith('```json')) {
          text = text.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (text.startsWith('```')) {
          text = text.replace(/^```/, '').replace(/```$/, '').trim();
        }
        
        // Basic JSON repair for common truncation issues
        if (!text.endsWith(']') && !text.endsWith('}')) {
           // If it looks truncated, try to close it
           // 1. Handle unterminated strings
           const lastQuoteIndex = text.lastIndexOf('"');
           const secondLastQuoteIndex = text.lastIndexOf('"', lastQuoteIndex - 1);
           const quotesCount = (text.match(/"/g) || []).length;
           if (quotesCount % 2 !== 0) {
             text += '"';
           }

           // 2. Handle missing brackets/braces
           const openBrackets = (text.match(/\[/g) || []).length;
           const closeBrackets = (text.match(/\]/g) || []).length;
           const openBraces = (text.match(/\{/g) || []).length;
           const closeBraces = (text.match(/\}/g) || []).length;
           
           if (openBraces > closeBraces) text += '}'.repeat(openBraces - closeBraces);
           if (openBrackets > closeBrackets) text += ']'.repeat(openBrackets - closeBrackets);
        }

        data = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error in Trending Recipes:", parseError);
        if (retryCount < 1) {
          console.log("Retrying trending recipe generation...");
          return generateDailyTrending(retryCount + 1);
        }
        data = [];
      }
      if (data.length > 0) {
        setTrendingRecipes(data);
        localStorage.setItem('smartmeal_trending_recipes', JSON.stringify(data));
        localStorage.setItem('smartmeal_trending_date', new Date().toDateString());
      }
    } catch (err: any) {
      console.error("Failed to generate trending recipes:", err);
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not found')) {
        setError("Invalid API Key. Please check your Vercel Environment Variables.");
      }
    } finally {
      setIsGeneratingTrending(false);
    }
  };

  useEffect(() => {
    if (recipes.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('smartmeal_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('smartmeal_saved_recipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  const addIngredient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !ingredients.includes(inputValue.trim())) {
      setIngredients([...ingredients, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await getAi().models.generateContent({
          model: MODEL_NAME,
          contents: [
            {
              parts: [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: "List the food ingredients you see in this image. Return only a comma-separated list of ingredient names." }
              ]
            }
          ]
        });

        const detected = response.text?.split(',').map(i => i.trim()) || [];
        setIngredients(prev => Array.from(new Set([...prev, ...detected])));
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Failed to recognize ingredients. Please try again.");
      setLoading(false);
    }
  };

  const generateRecipes = async () => {
    if (!getApiKey()) {
      setError("API Key is missing. Please check your environment variables.");
      return;
    }

    if (ingredients.length === 0) {
      setError("Please add some ingredients first!");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const prompt = `Generate 3 unique and delicious recipes using some or all of these ingredients: ${ingredients.join(', ')}. 
      Pantry items available: ${pantry.join(', ')}.
      Dietary Preference: ${dietaryPreference}.
      Cuisine Style: ${cuisine}.
      Cooking Time Preference: ${cookingTime}.
      
      For each recipe, provide:
      - Title
      - Short description
      - Prep time and Cook time
      - Servings
      - Difficulty (Easy, Medium, Hard)
      - List of ingredients with amounts and categories
      - Step-by-step instructions (include a 'timer' in seconds if a step requires waiting)
      - Nutrition breakdown (calories, protein, carbs, fat, and a list of 5 vitamins/minerals)
      - Tags (e.g., Vegan, Quick, High Protein)
      - matchScore: A percentage (0-100) based on how many of the user's ingredients are used.
      - whyThisRecipe: A one-sentence explanation of why this recipe is a good match for the ingredients and cuisine style.
      - substitutions: A list of suggested substitutions for missing ingredients.
      
      If Cuisine Style is 'Any', choose a diverse range of styles.
      If Cuisine Style is specified (e.g., 'South Indian'), strictly follow that style.
      Return the response as a JSON array of recipe objects.`;

      const response = await getAi().models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                cookTime: { type: Type.STRING },
                servings: { type: Type.NUMBER },
                difficulty: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                whyThisRecipe: { type: Type.STRING },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.STRING },
                      category: { type: Type.STRING }
                    }
                  }
                },
                instructions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      timer: { type: Type.NUMBER }
                    }
                  }
                },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING },
                    vitamins: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          value: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                missingIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                substitutions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      replacement: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ["title", "description", "prepTime", "cookTime", "ingredients", "instructions", "nutrition", "matchScore", "whyThisRecipe"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      const recipesWithIds = data.map((r: any, i: number) => ({ 
        ...r, 
        id: r.id || String(i + 1) 
      }));
      
      setRecipes(recipesWithIds);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not found')) {
        setError("Invalid API Key. Please check your Vercel Environment Variables.");
      } else if (err.message?.includes('quota')) {
        setError("API Quota exceeded. Please try again later.");
      } else {
        setError("Failed to generate recipes. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    const id = recipe.id;
    setFavorites(prev => {
      const isFav = prev.includes(id);
      if (isFav) {
        setSavedRecipes(s => s.filter(r => r.id !== id));
        return prev.filter(f => f !== id);
      } else {
        setSavedRecipes(s => {
          // Prevent duplicates
          if (s.some(r => r.id === id)) return s;
          return [...s, recipe];
        });
        return [...prev, id];
      }
    });
  };

  const shareRecipe = (recipe: Recipe) => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Check out this recipe for ${recipe.title} on SmartMeal!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${recipe.title}\n\n${recipe.description}\n\nIngredients:\n${recipe.ingredients.map(i => `- ${i.amount} ${i.name}`).join('\n')}`);
      alert("Recipe copied to clipboard!");
    }
  };

  const startCooking = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setIsCooking(true);
    setCurrentStep(0);
  };

  const FilterModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={() => setShowFilters(false)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 space-y-8 sm:space-y-10 shadow-2xl border border-stone-100 dark:border-stone-800 scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-stone-900 z-10 pb-4">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">Smart Filters</h3>
          <button onClick={() => setShowFilters(false)} className="p-2 sm:p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Dietary Preference</h4>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {DIETARY_OPTIONS.map((pref) => (
                <button
                  key={pref}
                  onClick={() => setDietaryPreference(pref as DietaryPreference)}
                  className={cn(
                    "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-bold transition-all duration-300",
                    dietaryPreference === pref 
                      ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105" 
                      : "bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Cuisine Style</h4>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {CUISINE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setCuisine(opt as Cuisine)}
                  className={cn(
                    "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-bold transition-all duration-300",
                    cuisine === opt 
                      ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105" 
                      : "bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Cooking Time</h4>
            <div className="flex gap-2 sm:gap-3">
              {['< 15 min', '< 30 min', 'Any'].map(time => (
                <button 
                  key={time} 
                  onClick={() => setCookingTime(time)}
                  className={cn(
                    "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-bold transition-all",
                    cookingTime === time
                      ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 hover:border-brand-300"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-stone-900 pt-4">
          <button 
            onClick={() => setShowFilters(false)}
            className="w-full py-4 sm:py-5 bg-stone-900 dark:bg-brand-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-stone-900/20 dark:shadow-brand-500/20 hover:scale-[1.02] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
  const getGradient = (title: string) => {
    const colors = [
      'from-orange-400 to-rose-500',
      'from-emerald-400 to-teal-600',
      'from-blue-400 to-indigo-600',
      'from-amber-400 to-orange-600',
      'from-violet-400 to-purple-600',
      'from-pink-400 to-rose-600'
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const TrendingModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6"
      onClick={() => setShowAllTrending(false)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 space-y-8 sm:space-y-10 shadow-2xl border border-stone-100 dark:border-stone-800 scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-stone-900 z-10 pb-4">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white">All Trending Recipes</h3>
          <button onClick={() => setShowAllTrending(false)} className="p-2 sm:p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trendingRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className={cn(
                "group relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl cursor-pointer border border-white/20 dark:border-stone-800/50 backdrop-blur-md bg-white/10 dark:bg-stone-900/40",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-20 before:transition-opacity group-hover:before:opacity-40",
                getGradient(recipe.title)
              )} 
              onClick={() => { setCurrentRecipe(recipe as any); setShowAllTrending(false); }}
            >
              <div className="absolute top-6 left-6 z-10 w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-lg">
                <ChefHat size={20} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 text-white shadow-lg">
                  <ChefHat size={32} />
                </div>
                <h4 className="font-serif font-bold text-2xl leading-tight text-white drop-shadow-lg">{recipe.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/30">{(recipe as any).matchScore}% Match</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pb-24 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 dark">
      <AnimatePresence>
        {showFilters && <FilterModal />}
        {showAllTrending && <TrendingModal />}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-6 py-5 flex items-center justify-between border-b border-stone-200/50 dark:border-stone-800/50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setCurrentRecipe(null); setIsCooking(false); }}>
          <div className="w-12 h-12 bg-stone-900 dark:bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-stone-900/20 dark:shadow-brand-500/20 group-hover:scale-110 transition-transform duration-500">
            <ChefHat size={28} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-white">SmartMeal</h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 leading-none">AI Kitchen</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!currentRecipe && !isCooking ? (
            <motion.div
              key="main-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {activeTab === 'cook' ? (
                <>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-[2rem] text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-4 shadow-lg shadow-red-500/5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        <X size={20} className="cursor-pointer" onClick={() => setError(null)} />
                      </div>
                      <span className="flex-1">{error}</span>
                    </motion.div>
                  )}
                  {/* Hero Section */}
                  <section className="text-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold uppercase tracking-widest"
                    >
                      <Sparkles size={14} />
                      <span>AI-Powered Kitchen Assistant</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tighter">
                      What's in your <br />
                      <span className="text-brand-600 italic">kitchen?</span>
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto text-lg">
                      Snap, type, or speak. We'll find the perfect recipe for your ingredients.
                    </p>
                  </section>

                  {/* Input Section */}
                  <section className="space-y-8">
                    <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-2 shadow-2xl shadow-stone-200 dark:shadow-none border border-stone-100 dark:border-stone-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Scan Card */}
                        <div className="relative group overflow-hidden rounded-[2.5rem] shadow-md">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[16/10] bg-stone-950 dark:bg-stone-800 flex flex-col items-center justify-center gap-4 text-white shadow-inner hover:scale-[1.01] transition-all duration-500 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800')] opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-60 transition-all duration-1000" />
                            <div className="relative z-10 flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 group-hover:bg-brand-500/20 group-hover:border-brand-500/40 transition-all">
                                <Camera size={36} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-serif font-bold tracking-tight">Scan Ingredients</div>
                                <div className="text-xs font-bold uppercase tracking-widest opacity-60">AI Vision Technology</div>
                              </div>
                            </div>
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>

                        {/* Manual Entry Card */}
                        <div className="bg-white dark:bg-stone-800/50 rounded-[2.5rem] p-8 flex flex-col justify-between border border-stone-200 dark:border-stone-700/50 shadow-md">
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                 <h3 className="text-xl font-serif font-bold flex items-center gap-2 text-stone-900 dark:text-white">
                                   <Utensils size={20} className="text-brand-500" /> 
                                   Manual Entry
                                 </h3>
                                 <p className="text-xs text-stone-500 font-medium">Type your ingredients</p>
                               </div>
                             </div>

                             <form onSubmit={addIngredient} className="relative">
                               <input 
                                 type="text"
                                 value={inputValue}
                                 onChange={(e) => setInputValue(e.target.value)}
                                 placeholder="Add ingredients (e.g. Pasta, Basil...)"
                                 className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl py-5 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm text-stone-900 dark:text-white"
                               />
                               <button 
                                 type="submit" 
                                 className="absolute right-2.5 top-2.5 bottom-2.5 px-4 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all"
                               >
                                 <Plus size={20} />
                               </button>
                             </form>
                           </div>

                           <div className="flex flex-wrap gap-2 mt-8 min-h-[40px]">
                             <AnimatePresence>
                               {ingredients.map((ing) => (
                                 <motion.span
                                   key={ing}
                                   initial={{ scale: 0.8, opacity: 0, x: -10 }}
                                   animate={{ scale: 1, opacity: 1, x: 0 }}
                                   exit={{ scale: 0.8, opacity: 0, x: 10 }}
                                   className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-sm group/tag"
                                 >
                                   {ing}
                                   <button 
                                     onClick={() => removeIngredient(ing)}
                                     className="text-stone-300 hover:text-red-500 transition-colors"
                                   >
                                     <X size={14} />
                                   </button>
                                 </motion.span>
                               ))}
                             </AnimatePresence>
                             {ingredients.length > 0 && (
                               <button 
                                 onClick={() => setIngredients([])}
                                 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors px-2"
                               >
                                 Clear All
                               </button>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                       <button 
                         onClick={() => setShowFilters(true)}
                         className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] text-sm font-bold shadow-xl shadow-stone-200/50 dark:shadow-none hover:border-brand-300 transition-all group"
                       >
                         <Filter size={20} className="text-brand-500 group-hover:rotate-12 transition-transform" />
                         <span className="text-stone-700 dark:text-stone-300">
                           {dietaryPreference === 'None' ? 'Preferences' : dietaryPreference}
                         </span>
                       </button>
                       
                       <button
                         onClick={generateRecipes}
                         disabled={loading || ingredients.length === 0}
                         className="w-full flex-1 py-5 bg-brand-600 dark:bg-brand-500 text-white rounded-[2rem] font-bold text-lg shadow-2xl shadow-brand-600/20 dark:shadow-brand-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3"
                       >
                         {loading ? <Loader2 className="animate-spin" /> : <Utensils size={22} />}
                         <span>{loading ? 'Crafting Recipes...' : 'Generate AI Recipes'}</span>
                       </button>
                    </div>
                  </section>

                  {/* Quick Shortcuts */}
                  <section className="grid grid-cols-1 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-2">
                          <History size={18} className="text-brand-500" /> Easy Add
                        </h3>
                        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800 ml-4" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Chicken', 'Pasta', 'Cream', 'Mushrooms', 'Spinach', 'Tomato', 'Onion'].map(item => (
                          <button 
                            key={item}
                            onClick={() => !ingredients.includes(item) && setIngredients([...ingredients, item])}
                            className="px-5 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-2xl text-xs font-bold text-stone-800 dark:text-stone-400 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm"
                          >
                            + {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Trending Recipes */}
                  <section className="space-y-8 overflow-hidden">
                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-1">
                        <h3 className="text-3xl font-serif font-bold flex items-center gap-3 text-stone-900 dark:text-white">
                          <TrendingUp className="text-brand-500" /> Trending Today
                        </h3>
                        <p className="text-sm text-stone-500 font-medium">Popular creations from the community</p>
                      </div>
                      <button 
                        onClick={() => setShowAllTrending(true)}
                        className="px-6 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-all"
                      >
                        View All
                      </button>
                    </div>
                    
                    <div className="marquee-container -mx-6">
                      <div className="marquee-track px-6 gap-8">
                        {[...trendingRecipes, ...trendingRecipes].map((recipe, idx) => (
                          <div 
                            key={`${recipe.id}-${idx}`} 
                            onClick={() => setCurrentRecipe(recipe as any)}
                            className={cn(
                              "relative w-[300px] aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer border border-stone-200 dark:border-stone-800/50 backdrop-blur-md bg-stone-900 dark:bg-stone-900/40 flex flex-col items-center justify-center p-8 text-center",
                              "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-60 before:transition-opacity group-hover:before:opacity-80",
                              getGradient(recipe.title)
                            )}
                          >
                            <div className="relative z-10 space-y-4 w-full">
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-lg">
                                  <ChefHat size={20} />
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe as any); }}
                                  className={cn(
                                    "p-2.5 rounded-xl backdrop-blur-xl transition-all border border-white/30",
                                    favorites.includes(recipe.id) ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/30"
                                  )}
                                >
                                  <Heart size={16} fill={favorites.includes(recipe.id) ? "currentColor" : "none"} />
                                </button>
                              </div>
                              <h4 className="font-serif font-bold text-2xl leading-tight text-white drop-shadow-xl whitespace-normal">
                                {recipe.title}
                              </h4>
                              <div className="flex items-center justify-center gap-3">
                                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/30 shadow-lg">
                                  {(recipe as any).matchScore}% Match
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 flex items-center gap-1.5">
                                  <Clock size={14} /> {(recipe as any).cookTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Results Grid */}
                  {recipes.length > 0 && (
                    <section ref={resultsRef} className="space-y-8 pt-12 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-serif font-bold">AI Recommendations</h3>
                        <div className="text-sm font-bold text-stone-400">{recipes.length} recipes found</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recipes.map((recipe) => (
                          <RecipeCard 
                            key={recipe.id}
                            recipe={recipe}
                            isFavorite={favorites.includes(recipe.id)}
                            onToggleFavorite={() => toggleFavorite(recipe)}
                            onShare={shareRecipe}
                            onClick={setCurrentRecipe}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                savedRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {savedRecipes.map((recipe) => (
                      <RecipeCard 
                        key={recipe.id}
                        recipe={recipe}
                        isFavorite={favorites.includes(recipe.id)}
                        onToggleFavorite={() => toggleFavorite(recipe)}
                        onShare={shareRecipe}
                        onClick={setCurrentRecipe}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <Heart size={48} className="mx-auto text-stone-200" />
                    <h3 className="text-xl font-bold">No saved recipes yet</h3>
                    <p className="text-stone-400">Your favorite AI creations will appear here.</p>
                  </div>
                )
              )}
            </motion.div>
          ) : currentRecipe && !isCooking ? (
            <motion.div
              key="recipe-detail"
              ref={recipeDetailRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <button 
                onClick={() => setCurrentRecipe(null)}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
              >
                <ChevronLeft size={20} />
                <span>Back to results</span>
              </button>

              <div className={cn(
                "relative min-h-[300px] sm:min-h-[400px] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 sm:p-12 text-center text-white",
                getGradient(currentRecipe.title)
              )}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                <div className="relative z-10 space-y-6 sm:space-y-8 w-full max-w-3xl">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentRecipe.tags?.map(tag => (
                        <span key={tag} className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-3xl md:text-7xl font-serif font-bold leading-tight drop-shadow-2xl">{currentRecipe.title}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-sm font-bold uppercase tracking-widest opacity-90">
                      <span className="flex items-center gap-2 drop-shadow-lg"><Clock size={16} className="sm:w-5 sm:h-5" /> {currentRecipe.cookTime}</span>
                      <span className="flex items-center gap-2 drop-shadow-lg"><Users size={16} className="sm:w-5 sm:h-5" /> {currentRecipe.servings} Servings</span>
                      <span className="flex items-center gap-2 drop-shadow-lg"><Flame size={16} className="sm:w-5 sm:h-5" /> {currentRecipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  <section className="space-y-6">
                    <h3 className="text-3xl font-serif font-bold">The Story</h3>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-lg italic">
                      "{currentRecipe.description}"
                    </p>
                    <div className="p-6 rounded-3xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 flex items-start gap-4">
                      <Sparkles className="text-brand-500 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-brand-800 dark:text-brand-300">Why this works</h4>
                        <p className="text-sm text-brand-700 dark:text-brand-400">{currentRecipe.whyThisRecipe}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-serif font-bold">Ingredients</h3>
                      <button className="text-sm font-bold text-brand-600 flex items-center gap-2">
                        <ShoppingBasket size={18} /> Add to list
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentRecipe.ingredients?.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm">
                          <div className="w-10 h-10 rounded-2xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                            <Utensils size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{ing.name}</div>
                            <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">{ing.category || 'Pantry'}</div>
                          </div>
                          <div className="text-sm font-bold text-brand-600">{ing.amount}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {currentRecipe.substitutions?.length > 0 && (
                    <section className="space-y-6">
                      <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                        <History size={20} className="text-stone-400" /> Smart Substitutions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentRecipe.substitutions.map((sub, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 flex items-center justify-between">
                            <span className="text-sm text-stone-500 line-through">{sub.original}</span>
                            <ChevronRight size={16} className="text-stone-300" />
                            <span className="text-sm font-bold text-brand-600">{sub.replacement}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="space-y-8">
                  <NutritionDashboard nutrition={currentRecipe.nutrition} />
                  
                  <div className="p-8 rounded-[2.5rem] bg-stone-900 text-white space-y-6 shadow-2xl">
                    <h4 className="text-xl font-serif font-bold">Ready to cook?</h4>
                    <p className="text-sm text-stone-400 leading-relaxed">
                      Follow our interactive cooking mode with built-in timers and voice control.
                    </p>
                    <button
                      onClick={() => startCooking(currentRecipe)}
                      className="w-full py-5 bg-brand-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-3"
                    >
                      <Flame size={22} />
                      <span>Start Cooking</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <CookingMode recipe={currentRecipe!} onClose={() => setIsCooking(false)} />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 glass border border-stone-200 dark:border-stone-800/50 px-10 py-5 rounded-[3rem] flex items-center gap-16 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50">
        <button 
          onClick={() => setActiveTab('cook')}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", activeTab === 'cook' ? "text-brand-600 scale-110" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200")}
        >
          <Utensils size={26} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cook</span>
          {activeTab === 'cook' && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-brand-600 rounded-full mt-1" />}
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", activeTab === 'saved' ? "text-brand-600 scale-110" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200")}
        >
          <Heart size={26} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Saved</span>
          {activeTab === 'saved' && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-brand-600 rounded-full mt-1" />}
        </button>
      </nav>
    </div>
  );
}
