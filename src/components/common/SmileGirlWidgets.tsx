import React from 'react';
import { Sparkles, Heart, Cloud, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SmileGirlWidgets: React.FC = () => {
  const { currentCompany, currentUser, setActiveView } = useApp();

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  // Days array for the mini calendar
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Smile Girl Mascot Photo Widget */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border-2 border-pink-200/90 shadow-[0_4px_20px_-2px_rgba(251,66,156,0.08)] flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-pink-100/60 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative shrink-0">
          <img
            src="/smile_girl.jpg"
            alt="Smile Girl"
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-pink-300 shadow-md group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icon.svg';
            }}
          />
          <span className="absolute -top-1 -right-1 bg-white text-pink-500 rounded-full p-0.5 shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-500" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">
              Smile Girl • iOS Pack
            </span>
          </div>
          <h3 className="text-base font-extrabold text-[#3F1D26] tracking-tight mt-1 truncate">
            Hi, {currentUser.name.split(' ')[0]}! ✨
          </h3>
          <p className="text-[11px] text-[#734954] mt-0.5 line-clamp-2">
            Workspace: <strong className="text-pink-600 font-bold">{currentCompany.name}</strong>. Let’s make today delightful and profitable!
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-pink-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Store is active & online</span>
          </div>
        </div>
      </div>

      {/* 2. Mini Calendar Widget (Widgetsmith / Ermine Style) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border-2 border-pink-200/90 shadow-[0_4px_20px_-2px_rgba(251,66,156,0.08)] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-pink-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-xs font-extrabold tracking-wider text-[#3F1D26] uppercase">
              {monthName} {now.getFullYear()}
            </span>
          </div>
          <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
            Today: Day {currentDay}
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <span key={idx} className="font-extrabold text-pink-400/90 py-0.5">
              {day}
            </span>
          ))}
          {calendarDays.slice(0, 28).map((day, idx) => {
            const isToday = day === currentDay;
            return (
              <div
                key={idx}
                className={`py-0.5 rounded-lg flex items-center justify-center font-medium transition-colors ${
                  isToday
                    ? 'bg-[#FB429C] text-white font-bold shadow-xs'
                    : day
                    ? 'text-[#5C3A42] hover:bg-pink-50'
                    : 'text-transparent'
                }`}
              >
                {day || '0'}
              </div>
            );
          })}
        </div>

        <div className="mt-2 pt-1 border-t border-pink-100/60 flex items-center justify-between text-[10px] text-pink-600 font-semibold">
          <span>Weekly target cycle</span>
          <button 
            onClick={() => setActiveView('goals')}
            className="hover:underline flex items-center gap-0.5 font-bold"
          >
            <span>Planner</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* 3. Cute Weather & Cheer Cloud Widget (Matching Reference Image) */}
      <div className="bg-gradient-to-br from-pink-50/90 to-rose-100/60 rounded-3xl p-4 border-2 border-pink-200/90 shadow-[0_4px_20px_-2px_rgba(251,66,156,0.08)] flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full">
            Daily Vibe & Weather
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-pink-700">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 fill-pink-300" />
            Sunny & Sweet
          </span>
        </div>

        {/* Cute Cloud Character Illustration */}
        <div className="flex items-center gap-3 my-2">
          <div className="relative w-14 h-11 bg-white rounded-full shadow-xs flex items-center justify-center border border-pink-200">
            {/* Cloud ears/bumps */}
            <div className="absolute -top-2.5 left-2 w-7 h-7 bg-white rounded-full border-t border-pink-200" />
            <div className="absolute -top-1.5 right-2 w-6 h-6 bg-white rounded-full border-t border-pink-200" />
            {/* Cute sleeping / happy face */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#4A2B33] font-bold">^</span>
                <span className="text-[9px] text-[#4A2B33] font-bold">^</span>
              </div>
              <div className="w-1.5 h-0.5 bg-pink-400 rounded-full mt-0.5" />
            </div>
            {/* Cute pink blush on cloud cheeks */}
            <div className="absolute bottom-2 left-2 w-2 h-1 bg-pink-200 rounded-full" />
            <div className="absolute bottom-2 right-2 w-2 h-1 bg-pink-200 rounded-full" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#3F1D26]">“Dream big, shine bright!”</h4>
            <p className="text-[10px] text-[#734954] mt-0.5">
              Customers love cute shopping experiences.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-pink-600 border-t border-pink-200/60">
          <span>Target: 100% Customer Joy</span>
          <Heart className="w-3 h-3 fill-pink-400 text-pink-500" />
        </div>
      </div>
    </div>
  );
};
