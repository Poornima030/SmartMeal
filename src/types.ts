/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  name: string;
  amount?: string;
  category?: 'Vegetables' | 'Dairy' | 'Spices' | 'Meat' | 'Grains' | 'Other';
  isPantry?: boolean;
}

export interface Nutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  vitamins?: { name: string; value: number }[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Ingredient[];
  instructions: { text: string; timer?: number }[];
  nutrition: Nutrition;
  tags: string[];
  missingIngredients: string[];
  matchScore: number;
  whyThisRecipe: string;
  substitutions: { original: string; replacement: string }[];
  image?: string;
}

export type DietaryPreference = 'None' | 'Vegan' | 'Keto' | 'Gluten-Free' | 'Vegetarian' | 'Paleo' | 'High Protein' | 'Low Calorie' | 'Kid-friendly';

export type Cuisine = 'Any' | 'South Indian' | 'North Indian' | 'Hyderabadi' | 'Bengali' | 'Gujarati' | 'Rajasthani' | 'American' | 'Italian' | 'Chinese' | 'Mexican' | 'Japanese';

export interface MealPlan {
  day: string;
  recipeId: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
}

export interface AppState {
  ingredients: string[];
  pantry: string[];
  recentIngredients: string[][];
  dietaryPreference: DietaryPreference;
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  currentRecipe: Recipe | null;
  isCooking: boolean;
  currentStep: number;
  darkMode: boolean;
  mealPlan: MealPlan[];
}
