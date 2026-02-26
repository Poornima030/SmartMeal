import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Nutrition } from '../types';
import { MOCK_VITAMINS } from '../utils';

interface Props {
  nutrition: Nutrition;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export const NutritionDashboard: React.FC<Props> = ({ nutrition }) => {
  const macroData = [
    { name: 'Protein', value: parseInt(nutrition.protein) },
    { name: 'Carbs', value: parseInt(nutrition.carbs) },
    { name: 'Fat', value: parseInt(nutrition.fat) },
  ];

  const vitaminData = nutrition.vitamins || MOCK_VITAMINS;

  return (
    <div className="space-y-8 p-6 bg-stone-900 rounded-3xl border border-stone-800 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold">Nutrition Dashboard</h3>
        <div className="text-2xl font-bold text-brand-600">{nutrition.calories} <span className="text-sm font-normal text-stone-400">kcal</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64">
          <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 text-center">Macronutrients</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px' }} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64">
          <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 text-center">Vitamins & Minerals</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vitaminData}>
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#a8a29e' }} />
              <YAxis hide />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px' }} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-800">
        <p className="text-xs text-stone-400 text-center italic">
          Values are approximate and based on standard nutritional data.
        </p>
      </div>
    </div>
  );
};
