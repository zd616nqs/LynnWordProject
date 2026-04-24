
import React from 'react';
import { ActivityLog } from '../types';
import { X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { calculateActivityStreak } from '../utils/date';

interface Props {
  activityLog: ActivityLog;
  onClose: () => void;
}

const Calendar: React.FC<Props> = ({ activityLog, onClose }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Empty spaces for previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Actual days
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const activity = activityLog[dateStr];
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div key={d} className="relative h-12 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold ${isToday ? 'text-[#4A86FF]' : 'text-gray-600'}`}>
            {d}
          </span>
          <div className="flex gap-1 mt-1 h-1.5">
            {activity?.added && <div className="w-1.5 h-1.5 rounded-full bg-[#B5F5D1]"></div>}
            {activity?.reviewed && <div className="w-1.5 h-1.5 rounded-full bg-[#E5D5FF]"></div>}
          </div>
          {isToday && (
            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#4A86FF]"></div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  return (
    <div className="fixed inset-0 z-[60] bg-[#F8F9FB] flex flex-col p-6 animate-in slide-in-from-right duration-500">
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black tracking-tight">Your Journey</h2>
        <button onClick={onClose} className="bg-white p-3 rounded-full soft-shadow text-black/20 hover:text-black transition-colors">
          <X size={20} strokeWidth={3} />
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 soft-shadow border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="p-2 text-gray-300 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <span className="text-lg font-black">{monthName} {currentMonth.getFullYear()}</span>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="p-2 text-gray-300 hover:text-black transition-colors"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-4 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <span key={`${day}-${index}`} className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {renderDays()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#FFEB99] p-6 rounded-[2rem] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-black/40 mb-1">Current Streak</span>
            <span className="text-2xl font-black">{calculateActivityStreak(activityLog)} Days</span>
          </div>
          <Flame size={24} className="text-orange-400 fill-current" />
        </div>
        <div className="bg-white p-6 rounded-[2rem] soft-shadow border border-gray-100 flex items-center gap-4">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-[#B5F5D1]"></div>
               <span className="text-[10px] font-bold text-gray-400">Words Added</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#E5D5FF]"></div>
               <span className="text-[10px] font-bold text-gray-400">Review Done</span>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-[#D1E1FF] p-6 rounded-[2rem] text-center">
        <p className="text-sm font-bold text-[#4A86FF] leading-relaxed italic">
          "Consistency is better than perfection. Keep going!"
        </p>
      </div>
    </div>
  );
};

export default Calendar;
