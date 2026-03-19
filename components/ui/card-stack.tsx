import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Card {
  id: string | number;
  src: string;
  alt: string;
  title: string;
  description: string;
  isRealEvent?: boolean;
}

interface CardStackProps {
  initialCards: Card[];
  isSkeleton?: boolean;
}

export default function CardStack({ 
    initialCards: propCards,
    isSkeleton
}: CardStackProps) {
  const [cards, setCards] = useState<Card[]>(propCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);

  const dragY = useMotionValue(0);
  const rotateX = useTransform(dragY, [-200, 0, 200], [8, 0, -8]);

  useEffect(() => {
    if (propCards && propCards.length > 0) {
      setCards(propCards);
      setCurrentIndex(0);
    }
  }, [propCards]);

  const moveToEnd = () => {
    setCards(prev => {
        if (prev.length <= 1) return prev;
        return [...prev.slice(1), prev[0]];
    });
    setCurrentIndex((prev) => (prev + 1) % propCards.length);
  };

  const moveToStart = () => {
    setCards(prev => {
        if (prev.length <= 1) return prev;
        return [prev[prev.length - 1], ...prev.slice(0, -1)];
    });
    setCurrentIndex((prev) => (prev - 1 + propCards.length) % propCards.length);
  };

  const handleDragEnd = (_: any, info: any) => {
    const velocity = info.velocity.y;
    const offsetVal = info.offset.y;

    if (Math.abs(offsetVal) > 60 || Math.abs(velocity) > 500) {
      if (offsetVal < 0 || velocity < 0) {
        setDragDirection('up');
        setTimeout(() => {
          moveToEnd();
          setDragDirection(null);
        }, 150);
      } else {
        setDragDirection('down');
        setTimeout(() => {
          moveToStart();
          setDragDirection(null);
        }, 150);
      }
    }
    dragY.set(0);
  };

  if (isSkeleton) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3 lg:p-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-full h-full rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse border-[6px] border-white dark:border-slate-800 shadow-xl"
            style={{
              zIndex: 30 - i,
              transform: `translateY(${i * 12}px) scale(${1 - i * 0.04})`,
              rotate: i === 1 ? '1deg' : i === 2 ? '-1deg' : '0deg'
            }}
          />
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Navigation - subtle on sides, even further out */}
      {cards.length > 1 && (
        <>
            <button 
                onClick={(e) => { e.preventDefault(); moveToStart(); }}
                className="absolute left-4 z-40 p-2 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all text-sky-600 group-hover:scale-110"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={(e) => { e.preventDefault(); moveToEnd(); }}
                className="absolute right-4 z-40 p-2 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all text-sky-600 group-hover:scale-110"
            >
                <ChevronRight size={20} />
            </button>
        </>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3 lg:p-4">
        <AnimatePresence>
            {cards.slice(0, 3).map((card, i) => {
                const isFront = i === 0;

                return (
                    <motion.div
                        key={card.id}
                        className="absolute w-full h-full max-w-full max-h-full"
                        style={{
                            zIndex: 30 - i,
                            rotateX: isFront ? rotateX : 0,
                            transformPerspective: 1000,
                        }}
                        animate={{
                            y: i * 12, // Offset each card downwards behind the front card
                            scale: 1 - i * 0.04, // Slightly scale down
                            rotateZ: i === 1 ? 1 : i === 2 ? -1 : 0, // Very subtle fan effect
                            opacity: dragDirection && isFront ? 0 : 1
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25
                        }}
                        drag={isFront ? 'y' : false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.4}
                        onDragEnd={handleDragEnd}
                        onHoverStart={() => isFront && setShowInfo(true)}
                        onHoverEnd={() => setShowInfo(false)}
                    >
                        {/* Wrapper for the actual card to apply border and shadow */}
                        <div className={`w-full h-full relative rounded-3xl overflow-hidden border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform duration-300 ${isFront && 'hover:scale-[1.02]'}`}>
                            {isFront && card.isRealEvent ? (
                                <Link to={`/events/${card.id}`} className="block w-full h-full">
                                    <CardImage card={card} showInfo={showInfo} priority={isFront} />
                                </Link>
                            ) : (
                                <CardImage card={card} showInfo={isFront && showInfo} priority={isFront} />
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
      </div>

      {/* Progress Indicator Dots slightly simplified */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-30 pointer-events-none">
        {propCards.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentIndex === i ? 'bg-sky-500 w-4' : 'bg-slate-300 w-1'}`} />
        ))}
      </div>
    </div>
  );
}

function CardImage({ card, showInfo, priority }: { card: Card, showInfo: boolean, priority?: boolean }) {
    return (
        <>
            <img
                src={card.src}
                alt={card.alt}
                loading={priority ? "eager" : "lazy"}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
            />
            {/* Dark gradient overlay for text legibility */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${showInfo ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Show Info text even when not hovered but slightly more subtle if not hovered */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white"
                initial={false}
                animate={{ 
                    opacity: showInfo ? 1 : 0.8,
                    y: showInfo ? 0 : 4
                }}
            >
                <h3 className="font-black text-lg sm:text-xl leading-tight drop-shadow-md">{card.title}</h3>
                <p className="text-white/90 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-wider bg-black/30 backdrop-blur-md inline-block px-2 py-0.5 rounded">
                    {card.description}
                </p>
            </motion.div>
        </>
    );
}
