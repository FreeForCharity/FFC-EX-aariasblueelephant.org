import { Metadata } from 'next';
import React from 'react';
import WheelOfFun from '@/components/WheelOfFun';

export const metadata: Metadata = {
    title: "Wheel of Fun | Aaria's Blue Elephant",
    description: "Spin the wheel to signify your impact and win community tokens. Join our mission to build a world without barriers.",
    openGraph: {
        title: "Wheel of Fun | Aaria's Blue Elephant",
        description: "Every spin brings us closer to a world without barriers. Participate in our community engagement game and win tokens.",
    },
};

export default function WheelPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-32 px-4">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                        Wheel of <span className="text-sky-500">Fun</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-lg">
                        Spin the wheel to signify your impact and win community tokens!
                        (Developer Preview - Accessible for local verification)
                    </p>
                </div>

                <div className="w-full flex justify-center scale-110 md:scale-125 mb-16">
                    <WheelOfFun />
                </div>

                <div className="mt-10 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">
                        "Every spin brings us closer to a world without barriers."
                    </p>
                </div>
            </div>
        </div>
    );
}
