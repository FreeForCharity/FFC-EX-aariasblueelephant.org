import React from 'react';
import { motion } from 'framer-motion';

interface StagedFadeInProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    className?: string;
    trigger?: 'mount' | 'view';
}

const StagedFadeIn: React.FC<StagedFadeInProps> = ({
    children,
    delay = 0,
    direction = 'up',
    className = "",
    trigger = 'view'
}) => {
    const [isSafetyVisible, setIsSafetyVisible] = React.useState(false);

    React.useEffect(() => {
        // Fallback: Force visibility after a safety window to handle failed observers/hydration stalls
        const timer = setTimeout(() => {
            setIsSafetyVisible(true);
        }, 1500); // 1.5s is safe for most loads
        return () => clearTimeout(timer);
    }, []);

    const directions = {
        up: { y: 40 },
        down: { y: -40 },
        left: { x: 40 },
        right: { x: -40 }
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction]
            }}
            animate={isSafetyVisible || trigger === 'mount' ? {
                opacity: 1,
                x: 0,
                y: 0
            } : undefined}
            whileInView={!isSafetyVisible && trigger === 'view' ? {
                opacity: 1,
                x: 0,
                y: 0
            } : undefined}
            viewport={trigger === 'view' ? { once: true, margin: "100px" } : undefined}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: isSafetyVisible ? 0 : delay,
                duration: 0.8
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default StagedFadeIn;
