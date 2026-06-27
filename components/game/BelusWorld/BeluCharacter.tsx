import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type BeluEmotion = 'happy' | 'sad' | 'scared' | 'excited' | 'calm' | 'curious' | 'overwhelmed';

interface Props {
  emotion: BeluEmotion;
  size?: number;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

// Eye shapes per emotion
const EyeShape: Record<BeluEmotion, React.FC<{ cx: number; cy: number; flip?: boolean }>> = {
  happy: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="#fff" />
      <ellipse cx={cx} cy={cy + 2} rx={7} ry={6} fill="#3D2B1F" />
      <circle cx={cx + 2} cy={cy} r={2.5} fill="#fff" />
      {/* Happy squint line */}
      <path d={`M ${cx - 11} ${cy - 3} Q ${cx} ${cy - 10} ${cx + 11} ${cy - 3}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  sad: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="#fff" />
      <ellipse cx={cx} cy={cy + 1} rx={7} ry={7} fill="#3D2B1F" />
      <circle cx={cx + 2} cy={cy - 1} r={2} fill="#fff" />
      {/* Drooping upper lid */}
      <path d={`M ${cx - 11} ${cy} Q ${cx} ${cy + 7} ${cx + 11} ${cy}`} stroke="#3D2B1F" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Tear */}
      <ellipse cx={cx - 3} cy={cy + 13} rx={3} ry={4} fill="#A8D8EA" opacity={0.85} />
    </g>
  ),
  scared: ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="#fff" />
      <circle cx={cx} cy={cy} r={8} fill="#3D2B1F" />
      <circle cx={cx + 3} cy={cy - 2} r={3} fill="#fff" />
      {/* Wide open lids */}
      <path d={`M ${cx - 12} ${cy} Q ${cx} ${cy - 14} ${cx + 12} ${cy}`} stroke="#3D2B1F" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M ${cx - 12} ${cy} Q ${cx} ${cy + 13} ${cx + 12} ${cy}`} stroke="#3D2B1F" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  excited: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={12} ry={12} fill="#fff" />
      {/* Star-shaped pupil */}
      <polygon points={`${cx},${cy - 8} ${cx + 3},${cy - 3} ${cx + 8},${cy - 3} ${cx + 4},${cy + 1} ${cx + 5},${cy + 7} ${cx},${cy + 4} ${cx - 5},${cy + 7} ${cx - 4},${cy + 1} ${cx - 8},${cy - 3} ${cx - 3},${cy - 3}`} fill="#FFD700" />
      <circle cx={cx} cy={cy} r={3} fill="#3D2B1F" />
      <circle cx={cx + 2} cy={cy - 2} r={1.5} fill="#fff" />
      {/* Sparkle */}
      <line x1={cx + 13} y1={cy - 8} x2={cx + 16} y2={cy - 11} stroke="#FFD700" strokeWidth="2" />
      <line x1={cx + 15} y1={cy - 5} x2={cx + 19} y2={cy - 5} stroke="#FFD700" strokeWidth="2" />
    </g>
  ),
  calm: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="#fff" />
      <ellipse cx={cx} cy={cy + 1} rx={7} ry={5} fill="#3D2B1F" />
      <circle cx={cx + 2} cy={cy} r={2} fill="#fff" />
      {/* Half-lidded top */}
      <path d={`M ${cx - 11} ${cy - 1} Q ${cx} ${cy + 3} ${cx + 11} ${cy - 1}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  curious: ({ cx, cy, flip }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={flip ? 10 : 12} ry={flip ? 9 : 11} fill="#fff" />
      <circle cx={cx + (flip ? 1 : -1)} cy={cy + 1} r={flip ? 6 : 8} fill="#3D2B1F" />
      <circle cx={cx + (flip ? 3 : 1)} cy={cy - 1} r={flip ? 2 : 2.5} fill="#fff" />
      {/* Raised eyebrow one side */}
      {!flip && <path d={`M ${cx - 12} ${cy - 9} Q ${cx} ${cy - 16} ${cx + 12} ${cy - 10}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
    </g>
  ),
  overwhelmed: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="#fff" />
      {/* Spiral pupils */}
      <path d={`M ${cx} ${cy} C ${cx + 4} ${cy - 4}, ${cx + 7} ${cy}, ${cx + 4} ${cy + 4} C ${cx + 2} ${cy + 6}, ${cx - 3} ${cy + 5}, ${cx - 5} ${cy + 2} C ${cx - 7} ${cy - 1}, ${cx - 5} ${cy - 6}, ${cx - 2} ${cy - 7}`} stroke="#3D2B1F" strokeWidth="2" fill="none" />
      <path d={`M ${cx - 11} ${cy + 2} Q ${cx} ${cy + 10} ${cx + 11} ${cy + 2}`} stroke="#3D2B1F" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
};

const MouthShape: Record<BeluEmotion, React.FC<{ cx: number; cy: number }>> = {
  happy: ({ cx, cy }) => <path d={`M ${cx - 14} ${cy} Q ${cx} ${cy + 14} ${cx + 14} ${cy}`} stroke="#3D2B1F" strokeWidth="3" fill="none" strokeLinecap="round" />,
  sad: ({ cx, cy }) => <path d={`M ${cx - 12} ${cy + 8} Q ${cx} ${cy} ${cx + 12} ${cy + 8}`} stroke="#3D2B1F" strokeWidth="3" fill="none" strokeLinecap="round" />,
  scared: ({ cx, cy }) => <ellipse cx={cx} cy={cy + 5} rx={10} ry={8} fill="#3D2B1F" />,
  excited: ({ cx, cy }) => <path d={`M ${cx - 16} ${cy - 2} Q ${cx} ${cy + 18} ${cx + 16} ${cy - 2}`} stroke="#3D2B1F" strokeWidth="3" fill="none" strokeLinecap="round" />,
  calm: ({ cx, cy }) => <path d={`M ${cx - 10} ${cy + 2} Q ${cx} ${cy + 10} ${cx + 10} ${cy + 2}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
  curious: ({ cx, cy }) => <path d={`M ${cx - 8} ${cy + 4} Q ${cx + 4} ${cy + 8} ${cx + 10} ${cy + 2}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
  overwhelmed: ({ cx, cy }) => <path d={`M ${cx - 12} ${cy + 4} Q ${cx - 4} ${cy + 2} ${cx + 4} ${cy + 6} Q ${cx + 8} ${cy + 8} ${cx + 12} ${cy + 4}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
};

const emotionBodyColor: Record<BeluEmotion, string> = {
  happy: '#5BA3D9',
  sad: '#7898B5',
  scared: '#6A90B8',
  excited: '#4D9FDF',
  calm: '#5BA8C4',
  curious: '#5BA3D9',
  overwhelmed: '#7B8FAD',
};

const emotionWeatherGlow: Record<BeluEmotion, string> = {
  happy: '#FFE066',
  sad: '#A8C8E0',
  scared: '#9BB5C8',
  excited: '#FF9F40',
  calm: '#B8E0D2',
  curious: '#D4E8F5',
  overwhelmed: '#C0C8D8',
};

export { emotionWeatherGlow };

const BeluCharacter: React.FC<Props> = ({ emotion, size = 200, className = '', onClick, animate = true }) => {
  const scale = size / 220;
  const bodyColor = emotionBodyColor[emotion];
  const LeftEye = EyeShape[emotion];
  const RightEye = EyeShape[emotion];
  const Mouth = MouthShape[emotion];

  const isExcited = emotion === 'excited';
  const isOverwhelmed = emotion === 'overwhelmed';

  return (
    <motion.div
      className={`inline-block cursor-pointer select-none ${className}`}
      style={{ width: size, height: size * 1.1 }}
      onClick={onClick}
      animate={animate ? {
        y: isOverwhelmed ? [0, -3, 3, -3, 0] : [0, -6, 0],
        rotate: isOverwhelmed ? [-2, 2, -2, 2, 0] : 0,
        scale: isExcited ? [1, 1.06, 1] : 1,
      } : {}}
      transition={{
        y: { duration: isOverwhelmed ? 0.4 : 2.2, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 0.15, repeat: isOverwhelmed ? 3 : 0 },
        scale: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <svg
        viewBox="0 0 220 240"
        width={size}
        height={size * 1.1}
        style={{ overflow: 'visible', filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.18))` }}
      >
        <defs>
          <radialGradient id={`bodyGrad-${emotion}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#7BBDE8" />
            <stop offset="100%" stopColor={bodyColor} />
          </radialGradient>
          <radialGradient id={`earGrad-${emotion}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#6AAFE0" />
            <stop offset="100%" stopColor="#4A88C4" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#A8D8F0" />
            <stop offset="100%" stopColor="#8EC8E8" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx={110} cy={235} rx={55} ry={8} fill="rgba(0,0,0,0.12)" />

        {/* Left ear — animated flap */}
        <motion.g
          animate={animate ? { rotate: [-5, 8, -5] } : {}}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '70px', originY: '90px' }}
        >
          <ellipse cx={58} cy={90} rx={34} ry={44} fill={`url(#earGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2" />
          <ellipse cx={60} cy={91} rx={20} ry={27} fill="#FFB7C5" opacity={0.45} />
        </motion.g>

        {/* Right ear — animated flap opposite phase */}
        <motion.g
          animate={animate ? { rotate: [5, -8, 5] } : {}}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          style={{ originX: '155px', originY: '90px' }}
        >
          <ellipse cx={162} cy={90} rx={34} ry={44} fill={`url(#earGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2" />
          <ellipse cx={160} cy={91} rx={20} ry={27} fill="#FFB7C5" opacity={0.45} />
        </motion.g>

        {/* Body */}
        <ellipse cx={110} cy={162} rx={68} ry={60} fill={`url(#bodyGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2.5" />

        {/* Belly */}
        <ellipse cx={110} cy={158} rx={38} ry={32} fill="url(#bellyGrad)" opacity={0.6} />

        {/* Head */}
        <circle cx={110} cy={92} r={56} fill={`url(#bodyGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2.5" />

        {/* Forehead highlight */}
        <ellipse cx={100} cy={68} rx={22} ry={14} fill="rgba(255,255,255,0.18)" />

        {/* Left eye */}
        <LeftEye cx={88} cy={88} />

        {/* Right eye */}
        <RightEye cx={132} cy={88} flip />

        {/* Blush left */}
        <ellipse cx={72} cy={106} rx={13} ry={9} fill="#FFB7C5" opacity={0.55} />
        {/* Blush right */}
        <ellipse cx={148} cy={106} rx={13} ry={9} fill="#FFB7C5" opacity={0.55} />

        {/* Nose / snout */}
        <ellipse cx={110} cy={112} rx={18} ry={13} fill="#4A88C4" stroke="#3A7BAD" strokeWidth="1.5" />
        {/* Nostrils */}
        <ellipse cx={104} cy={115} rx={4} ry={3} fill="#2C5F8A" />
        <ellipse cx={116} cy={115} rx={4} ry={3} fill="#2C5F8A" />

        {/* Mouth */}
        <Mouth cx={110} cy={120} />

        {/* Trunk — animated sway */}
        <motion.path
          d={emotion === 'scared' ? 'M 110 124 Q 118 145 125 165 Q 130 178 122 182' : emotion === 'excited' ? 'M 110 124 Q 130 148 135 168 Q 138 180 128 175' : 'M 110 124 Q 90 148 88 168 Q 86 180 96 178'}
          stroke={bodyColor}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          style={{ filter: 'none' }}
          animate={animate ? { d: emotion === 'excited' ? ['M 110 124 Q 130 148 135 168 Q 138 180 128 175', 'M 110 124 Q 125 142 128 162 Q 130 178 120 175'] : undefined } : {}}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.path
          d={emotion === 'scared' ? 'M 110 124 Q 118 145 125 165 Q 130 178 122 182' : emotion === 'excited' ? 'M 110 124 Q 130 148 135 168 Q 138 180 128 175' : 'M 110 124 Q 90 148 88 168 Q 86 180 96 178'}
          stroke="#3A7BAD"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          opacity={0.3}
        />

        {/* Legs */}
        <rect x={72} y={205} width={28} height={28} rx={10} fill={`url(#bodyGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2" />
        <rect x={118} y={205} width={28} height={28} rx={10} fill={`url(#bodyGrad-${emotion})`} stroke="#3A7BAD" strokeWidth="2" />
        {/* Feet highlight */}
        <ellipse cx={86} cy={226} rx={8} ry={4} fill="rgba(255,255,255,0.25)" />
        <ellipse cx={132} cy={226} rx={8} ry={4} fill="rgba(255,255,255,0.25)" />

        {/* Excited sparkles */}
        <AnimatePresence>
          {isExcited && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[{ x: 40, y: 40 }, { x: 175, y: 35 }, { x: 185, y: 100 }, { x: 28, y: 130 }].map((pos, i) => (
                <motion.text key={i} x={pos.x} y={pos.y} fontSize={16}
                  animate={{ scale: [0.8, 1.3, 0.8], rotate: [0, 20, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  style={{ originX: `${pos.x}px`, originY: `${pos.y}px` }}
                >✨</motion.text>
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
};

export default BeluCharacter;
