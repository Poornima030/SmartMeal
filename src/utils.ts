import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INGREDIENT_CATEGORIES = [
  'Vegetables',
  'Dairy',
  'Spices',
  'Meat',
  'Grains',
  'Other'
] as const;

export const DIETARY_OPTIONS = [
  'None',
  'Vegan',
  'Keto',
  'Gluten-Free',
  'Vegetarian',
  'Paleo',
  'High Protein',
  'Low Calorie',
  'Kid-friendly'
] as const;

export const CUISINE_OPTIONS = [
  'Any',
  'South Indian',
  'North Indian',
  'Hyderabadi',
  'Bengali',
  'Gujarati',
  'Rajasthani',
  'American',
  'Italian',
  'Chinese',
  'Mexican',
  'Japanese'
] as const;

export const TRENDING_RECIPES = [
  {
    id: 't1',
    title: 'Avocado Toast Deluxe',
    description: 'A sophisticated twist on the classic breakfast staple, featuring creamy avocado, poached eggs, and a hint of chili flakes on artisanal sourdough.',
    prepTime: '5 min',
    cookTime: '5 min',
    servings: 1,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Sourdough Bread', amount: '1 slice', category: 'Grains' },
      { name: 'Avocado', amount: '1 ripe', category: 'Vegetables' },
      { name: 'Eggs', amount: '2 large', category: 'Dairy' },
      { name: 'Chili Flakes', amount: '1 pinch', category: 'Spices' }
    ],
    instructions: [
      { text: 'Toast the sourdough bread until golden brown.', timer: 120 },
      { text: 'Mash the avocado with a pinch of salt and spread on toast.', timer: 60 },
      { text: 'Poach the eggs in simmering water for 3 minutes.', timer: 180 },
      { text: 'Place eggs on toast and sprinkle with chili flakes.' }
    ],
    nutrition: { calories: 320, protein: '14g', carbs: '28g', fat: '18g' },
    tags: ['Breakfast', 'Healthy', 'Quick'],
    missingIngredients: [],
    matchScore: 95,
    whyThisRecipe: 'Perfect balance of healthy fats and protein to start your day.',
    substitutions: []
  },
  {
    id: 't2',
    title: 'Spicy Ramen Bowl',
    description: 'A comforting and fiery ramen bowl packed with umami flavors, fresh greens, and a perfectly soft-boiled egg.',
    prepTime: '10 min',
    cookTime: '10 min',
    servings: 1,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Ramen Noodles', amount: '1 pack', category: 'Grains' },
      { name: 'Chicken Broth', amount: '2 cups', category: 'Other' },
      { name: 'Sriracha', amount: '1 tbsp', category: 'Spices' },
      { name: 'Bok Choy', amount: '1 head', category: 'Vegetables' },
      { name: 'Egg', amount: '1 large', category: 'Dairy' }
    ],
    instructions: [
      { text: 'Boil the noodles according to package instructions.', timer: 180 },
      { text: 'Heat the broth and stir in sriracha.', timer: 300 },
      { text: 'Blanch the bok choy in the broth.', timer: 60 },
      { text: 'Assemble the bowl and top with a soft-boiled egg.' }
    ],
    nutrition: { calories: 540, protein: '22g', carbs: '65g', fat: '12g' },
    tags: ['Dinner', 'Spicy', 'Comfort Food'],
    missingIngredients: [],
    matchScore: 88,
    whyThisRecipe: 'Quick umami fix with a customizable spice level.',
    substitutions: []
  },
  {
    id: 't3',
    title: 'Berry Smoothie Bowl',
    description: 'A vibrant and refreshing smoothie bowl topped with crunchy granola, fresh berries, and a drizzle of honey.',
    prepTime: '5 min',
    cookTime: '10 min',
    servings: 1,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Mixed Berries', amount: '1 cup', category: 'Vegetables' },
      { name: 'Greek Yogurt', amount: '1/2 cup', category: 'Dairy' },
      { name: 'Granola', amount: '1/4 cup', category: 'Grains' },
      { name: 'Honey', amount: '1 tsp', category: 'Other' }
    ],
    instructions: [
      { text: 'Blend the berries and yogurt until smooth.', timer: 60 },
      { text: 'Pour into a bowl.', timer: 30 },
      { text: 'Top with granola and extra berries.' },
      { text: 'Drizzle with honey and serve immediately.' }
    ],
    nutrition: { calories: 210, protein: '12g', carbs: '35g', fat: '4g' },
    tags: ['Breakfast', 'Vegan-option', 'Healthy'],
    missingIngredients: [],
    matchScore: 92,
    whyThisRecipe: 'Antioxidant-rich breakfast that tastes like dessert.',
    substitutions: []
  }
];

export const MOCK_VITAMINS = [
  { name: 'Vit A', value: 45 },
  { name: 'Vit C', value: 80 },
  { name: 'Vit D', value: 20 },
  { name: 'Iron', value: 35 },
  { name: 'Calcium', value: 50 },
];
