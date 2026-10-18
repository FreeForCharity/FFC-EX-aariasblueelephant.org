import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, state } = useLocation();

    useEffect(() => {
        // switching tabs changes the address but not the page — stay where you are
        if ((state as { keepScroll?: boolean } | null)?.keepScroll) return;

        // Force immediate scroll to top
        window.scrollTo(0, 0);

        // Also handle smooth cases or delayed renders
        const timer = setTimeout(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant'
            });
        }, 0);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
