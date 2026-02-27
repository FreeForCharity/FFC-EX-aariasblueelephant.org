import React from 'react';

export interface DonationQRProps {
    as?: 'a' | 'div';
    onClick?: () => void;
}

const DonationQR: React.FC<DonationQRProps> = ({ as = 'a', onClick }) => {
    const Component = as as any;

    return (
        <Component
            href={as === 'a' ? "https://www.zeffy.com/en-US/donation-form/aariasblueelephant" : undefined}
            target={as === 'a' ? "_blank" : undefined}
            rel={as === 'a' ? "noopener noreferrer" : undefined}
            onClick={onClick}
            className="group relative inline-block w-[250px] h-[250px] cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 transition-transform hover:-translate-y-1 bg-white"
            data-donate-btn="true" // Include this data attribute so the custom animation engine treats it as a donate button and makes it giggle + throw confetti
        >
            {/* The Actual QR Code */}
            <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.zeffy.com/en-US/donation-form/aariasblueelephant&margin=2"
                alt="Zeffy Donation QR Code"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
            />

            {/* The Centered Logo (20% size = 50px out of 250px) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1 rounded-md shadow-sm">
                    <img
                        src="/qr-logo.png"
                        alt="Aaria's Blue Elephant"
                        className="w-[42px] h-[42px] object-contain"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {/* The Glassmorphism Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300 group-hover:opacity-0 group-hover:backdrop-blur-none elevation-overlay">
                <div className="bg-white/90 px-5 py-3 rounded-xl shadow-xl border border-slate-200/50 transform transition-transform group-hover:scale-95">
                    <span className="font-sans font-black uppercase text-slate-900 tracking-widest text-lg italic">
                        Click or Scan
                    </span>
                </div>
            </div>
        </Component>
    );
};

export default DonationQR;
