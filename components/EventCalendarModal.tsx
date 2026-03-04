import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Event } from '../types';
import { Link } from 'react-router-dom';
import StickerIcon from './StickerIcon';
import StagedFadeIn from './StagedFadeIn';

interface EventCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: Event[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendarModal({ isOpen, onClose, events }: EventCalendarModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Reset to today when opening
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(today);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    // Get events for a specific day
    const getEventsForDay = (day: number) => {
        const checkDate = new Date(currentYear, currentMonth, day);
        return events.filter(event => {
            // Need to parse event date safely handling timezone/time string
            const evDate = new Date(event.date);
            return isSameDay(evDate, checkDate);
        });
    };

    const selectedEvents = selectedDate ? events.filter(event => isSameDay(new Date(event.date), selectedDate)) : [];

    const getEventDotColor = (type: string) => {
        switch (type) {
            case 'Class': return 'bg-blue-500';
            case 'Fundraiser': return 'bg-green-500';
            case 'Outreach': return 'bg-orange-500';
            case 'Advocacy': return 'bg-emerald-600';
            default: return 'bg-brand-purple';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">

                {/* Left Side: Calendar View */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <StickerIcon icon={CalendarIcon} size={28} color="#00AEEF" />
                            Event Calendar
                        </h2>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handlePrevMonth}
                            className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={handleNextMonth}
                            className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty slots before first day */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-12 md:h-14 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent"></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const loopDate = new Date(currentYear, currentMonth, day);
                            const dayEvents = getEventsForDay(day);
                            const isSelected = selectedDate && isSameDay(loopDate, selectedDate);
                            const isToday = isSameDay(loopDate, new Date());
                            const hasEvents = dayEvents.length > 0;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(loopDate)}
                                    className={`
                    relative h-12 md:h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2
                    ${isSelected
                                            ? 'border-brand-cyan bg-sky-50 dark:bg-sky-900/20 shadow-sm'
                                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }
                    ${isToday && !isSelected ? 'text-brand-cyan font-black' : 'text-slate-700 dark:text-slate-300 font-medium'}
                  `}
                                >
                                    <span className={`text-sm md:text-base ${isSelected ? 'font-bold text-slate-900 dark:text-white' : ''}`}>
                                        {day}
                                    </span>

                                    {/* Event Dots */}
                                    {hasEvents && (
                                        <div className="absolute bottom-1.5 flex gap-1 items-center justify-center w-full px-2">
                                            {dayEvents.slice(0, 3).map((ev, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(ev.type)} transition-transform ${isSelected ? 'scale-125' : ''}`}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Event Details */}
                <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col relative shrink-0">
                    <button
                        onClick={onClose}
                        className="hidden md:flex absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        {selectedDate
                            ? selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })
                            : 'Select a date'}
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {selectedEvents.length === 0 ? (
                            <StagedFadeIn>
                                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 dark:text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <CalendarIcon className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="font-medium text-sm">No events scheduled on this day.</p>
                                </div>
                            </StagedFadeIn>
                        ) : (
                            selectedEvents.map((event, idx) => (
                                <StagedFadeIn key={event.id} delay={idx * 0.1}>
                                    <Link
                                        to={`/events/${event.id}`}
                                        onClick={onClose}
                                        className="block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:border-brand-cyan hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2 h-2 rounded-full ${getEventDotColor(event.type)}`} />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{event.type}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-sky-600 transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="space-y-1 mt-3">
                                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                {event.time}
                                            </div>
                                            <div className="flex items-start text-xs text-slate-600 dark:text-slate-400">
                                                <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{event.location}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-sky-600 dark:text-sky-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
                                            View Details
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </Link>
                                </StagedFadeIn>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
