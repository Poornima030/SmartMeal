import React from 'react';
import { Calendar, Plus, Clock, Utensils } from 'lucide-react';
import { MealPlan, Recipe } from '../types';
import { cn } from '../utils';

interface Props {
  mealPlan: MealPlan[];
  recipes: Recipe[];
  onAddMeal: (day: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'] as const;

export const MealPlanner: React.FC<Props> = ({ mealPlan, recipes, onAddMeal }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-brand-500" size={24} />
          <h3 className="text-2xl font-serif font-bold">Weekly Meal Plan</h3>
        </div>
        <button className="text-sm font-bold text-brand-600 hover:underline">Clear Plan</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS.map(day => (
          <div key={day} className="space-y-3">
            <div className="text-center py-3 bg-stone-900 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-stone-400 border border-stone-800">
              {day}
            </div>
            
            <div className="space-y-3">
              {MEAL_TYPES.map(type => {
                const plan = mealPlan.find(p => p.day === day && p.mealType === type);
                const recipe = recipes.find(r => r.id === plan?.recipeId);

                return (
                   <div 
                    key={type}
                    className={cn(
                      "group relative min-h-[100px] rounded-[1.5rem] border p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md",
                      recipe 
                        ? "bg-brand-900/10 border-brand-900/30" 
                        : "bg-stone-900 border-dashed border-stone-800 hover:border-brand-400"
                    )}
                    onClick={() => !recipe && onAddMeal(day)}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-2">{type}</div>
                    {recipe ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold leading-tight line-clamp-2 text-white">{recipe.title}</div>
                        <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                          <Clock size={10} className="text-brand-500" /> {recipe.cookTime}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="w-8 h-8 bg-brand-900/20 rounded-full flex items-center justify-center text-brand-500">
                          <Plus size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-brand-500 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-brand-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Utensils size={24} />
          </div>
          <div>
            <h4 className="font-bold">Ready to cook?</h4>
            <p className="text-sm text-white/80">You have 12 meals planned for this week.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-white text-brand-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors">
          Generate Shopping List
        </button>
      </div>
    </div>
  );
};
