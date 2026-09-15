import React from "react";
import { Search, Compass, ArrowRight, X, Sparkles, MapPin } from "lucide-react";

interface LandingOverlayProps {
  onClose: () => void;
  onSearch: (q: string) => void;
  onSelectCategory: (cat: string) => void;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({
  onClose,
  onSearch,
  onSelectCategory,
}) => {
  const [query, setQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      onClose();
    }
  };

  const quickCategories = [
    { label: "Academic", id: "Academic Buildings", emoji: "📚", color: "from-blue-600 to-indigo-600" },
    { label: "Hostels", id: "Hostels / Residence Halls", emoji: "🏠", color: "from-purple-600 to-violet-600" },
    { label: "Dining", id: "Dining & Cafeteria", emoji: "🍴", color: "from-orange-500 to-amber-600" },
    { label: "Sports", id: "Sports & Recreation", emoji: "🏋", color: "from-emerald-600 to-teal-600" },
    { label: "Parking", id: "Parking", emoji: "🚗", color: "from-slate-600 to-gray-700" },
    { label: "Medical", id: "Health & Medical", emoji: "🏥", color: "from-red-600 to-rose-600" },
    { label: "Transport", id: "Transportation", emoji: "🚌", color: "from-sky-600 to-cyan-600" },
    { label: "Emergency", id: "Emergency Services", emoji: "🚨", color: "from-rose-600 to-red-700" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 text-center overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* University Crest / Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-600/30 mb-4 border-2 border-white/20">
          <Compass className="w-8 h-8" />
        </div>

        {/* Welcome Headline */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Explore Our University Campus
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-2 font-medium">
          Navigate lecture halls, laboratories, residences, dining courts, sports arenas, and transit routes in high interactive clarity.
        </p>

        {/* Main Search Input */}
        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl mx-auto">
          <div className="relative flex items-center shadow-lg rounded-2xl bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 focus-within:border-blue-500 transition-all p-1.5">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for? (e.g. CSE, Library, Hostel, ATM...)"
              className="w-full px-3 py-2 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="mt-8">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Quick Browse by Destination
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto">
            {quickCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 group text-left"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <span>Dive into Interactive Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
