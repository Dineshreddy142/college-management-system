import React from 'react';
import { BookOpen, Award, Layers, Globe, Beaker, FileCode, Sparkles, CheckCircle2 } from 'lucide-react';

export interface SubjectCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  subject_count?: number;
}

interface SubjectCategoryListProps {
  categories: SubjectCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryCode: string) => void;
  isLoading?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  FOUNDATION: <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
  CORE: <Layers className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
  PROFESSIONAL_ELECTIVE: <Award className="w-5 h-5 text-purple-500 dark:text-purple-400" />,
  OPEN_ELECTIVE: <Globe className="w-5 h-5 text-teal-500 dark:text-teal-400" />,
  LABORATORY: <Beaker className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
  PROJECT: <FileCode className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
  VALUE_ADDED: <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  FOUNDATION: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400',
  CORE: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400',
  PROFESSIONAL_ELECTIVE: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400',
  OPEN_ELECTIVE: 'from-teal-500/10 to-teal-600/5 border-teal-200 dark:border-teal-800/40 text-teal-600 dark:text-teal-400',
  LABORATORY: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
  PROJECT: 'from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400',
  VALUE_ADDED: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
};

export const SubjectCategoryList: React.FC<SubjectCategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Academic Subject Categories
        </h3>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* All Categories Option */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div className={`p-2 rounded-xl ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            {selectedCategory === 'all' && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
          </div>
          <div>
            <p className="font-bold text-xs">ALL CATEGORIES</p>
            <p className={`text-[11px] font-medium mt-0.5 ${selectedCategory === 'all' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Full Curriculum Overview
            </p>
          </div>
        </button>

        {/* Categories List */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.code || selectedCategory === String(cat.id);
          const icon = CATEGORY_ICONS[cat.code] || <BookOpen className="w-4 h-4 text-slate-500" />;
          const gradientStyle = CATEGORY_GRADIENTS[cat.code] || 'from-slate-500/10 border-slate-200 text-slate-700';

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.code)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                  : `bg-gradient-to-br ${gradientStyle} hover:shadow-sm hover:scale-[1.01]`
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900/60 shadow-xs'}`}>
                  {icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-900/10 dark:bg-slate-100/10'
                }`}>
                  {cat.subject_count ?? 0}
                </span>
              </div>
              <div>
                <p className={`font-bold text-[11px] leading-tight line-clamp-1 ${isSelected ? 'text-white' : ''}`}>
                  {cat.name}
                </p>
                <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
