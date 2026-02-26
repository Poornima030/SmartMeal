import React from 'react';
import { motion } from 'motion/react';
import { Clock, Flame, Heart, Share2, Info, ChevronRight, ChefHat, Dumbbell } from 'lucide-react';
import { Recipe } from '../types';
import { cn } from '../utils';

interface Props {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare: (recipe: Recipe) => void;
  onClick: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<Props> = ({ recipe, isFavorite, onToggleFavorite, onShare, onClick }) => {
  // Generate a consistent gradient based on the recipe title
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

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border border-stone-300 dark:border-stone-800/50 shadow-xl transition-all cursor-pointer backdrop-blur-md bg-white dark:bg-stone-900/40",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-5 before:transition-opacity group-hover:before:opacity-10",
        getGradient(recipe.title)
      )}
      onClick={() => onClick(recipe)}
    >
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
          className={cn(
            "p-3 rounded-2xl backdrop-blur-xl transition-all border border-white/30",
            isFavorite ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/30"
          )}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-8 space-y-6 relative z-0">
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-2xl leading-tight text-stone-900 dark:text-white group-hover:text-brand-600 transition-colors">
            {recipe.title}
          </h4>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-sm font-bold text-stone-800 dark:text-stone-300">
            <span className="flex items-center gap-1.5"><Clock size={16} className="text-brand-600 dark:text-brand-500" /> {recipe.cookTime}</span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="flex items-center gap-1.5"><Flame size={16} className="text-orange-600 dark:text-orange-500" /> {recipe.nutrition.calories} kcal</span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="flex items-center gap-1.5"><Dumbbell size={16} className="text-emerald-600 dark:text-emerald-500" /> {recipe.nutrition.protein} protein</span>
          </div>
          
          <div className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Difficulty: <span className={cn(
              "ml-1",
              recipe.difficulty === 'Easy' ? "text-emerald-500" : 
              recipe.difficulty === 'Medium' ? "text-amber-500" : "text-rose-500"
            )}>{recipe.difficulty}</span>
          </div>
        </div>

        <button className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-sm shadow-lg group-hover:bg-brand-600 dark:group-hover:bg-brand-500 group-hover:text-white transition-all flex items-center justify-center gap-2">
          [ View Recipe ]
          <ChevronRight size={18} />
        </button>

        {/* Why this recipe - subtle glassmorphism */}
        <div className="p-4 rounded-2xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 backdrop-blur-sm flex items-start gap-3">
          <Info size={16} className="text-brand-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug italic">
            "{recipe.whyThisRecipe}"
          </p>
        </div>
      </div>
    </motion.div>
  );
};
