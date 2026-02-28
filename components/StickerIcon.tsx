import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StickerIconProps {
    icon: LucideIcon;
    size?: number;
    color?: string;
    className?: string;
    bgColor?: string;
    show3D?: boolean;
}

const StickerIcon: React.FC<StickerIconProps> = ({
    icon: Icon,
    size = 24,
    color = "currentColor",
    className = "",
    bgColor = "bg-white",
    show3D = true
}) => {
    return (
        <motion.div
            whileHover={show3D ? {
                scale: 1.15,
                rotate: [0, -7, 7, 0],
                transition: { duration: 0.5, type: "spring", stiffness: 260 }
            } : {}}
            whileTap={{ scale: 0.9 }}
            className={`relative inline-flex items-center justify-center p-3 rounded-[1.5rem] bg-gradient-to-br from-white to-slate-50/50 ${className}
                ${show3D ? 'shadow-[0_6px_0_#d1d5db,0_12px_24px_-8px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_0_#9ca3af,0_16px_32px_-12px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px]' : 'border-2 border-slate-100'} 
                dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 transition-all duration-300 group`}
        >
            {/* Glossy Overlay for 3D feel */}
            {show3D && (
                <div className="absolute top-1 left-2 right-2 h-[40%] bg-white/40 rounded-t-[1rem] blur-[1px] pointer-events-none opacity-80" />
            )}

            {/* Icon container with white border */}
            <div className="relative z-10 flex items-center justify-center p-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-inner border-2 border-slate-50 dark:border-slate-800">
                <Icon
                    size={size}
                    style={{ color }}
                    className="filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
                />
            </div>

            {/* Playful Bottom Shadow for depth */}
            <div className={`absolute -bottom-1.5 -right-1.5 w-full h-full rounded-[1.25rem] -z-10 transition-all duration-300 
                ${show3D ? 'bg-sky-500/10 group-hover:bg-sky-500/20 blur-[2px]' : 'bg-transparent'}`}
            />
        </motion.div>
    );
};

export default StickerIcon;
