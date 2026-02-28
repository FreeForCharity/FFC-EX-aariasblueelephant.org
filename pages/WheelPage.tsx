import React from 'react';
import WheelOfFun from '../components/WheelOfFun';

const WheelPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                        Wheel of <span className="text-brand-cyan">Fun</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
                        Spin the wheel to signify your impact and win community tokens!
                        (Developer Preview - Accessible for local verification)
                    </p>
                </div>

                <div className="w-full flex justify-center scale-110 md:scale-125 mb-16">
                    <WheelOfFun />
                </div>

                <div className="mt-10 p-6 bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        "Every spin brings us closer to a world without barriers."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WheelPage;
