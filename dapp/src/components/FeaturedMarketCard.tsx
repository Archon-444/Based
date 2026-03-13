import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

interface FeaturedMarketCardProps {
    title: string;
    category: string;
    volume: string;
    odds: { yes: number; no: number };
    endsIn: string;
    onClick?: () => void;
    index: number;
}

const GRADIENTS = [
    'bg-gradient-to-r from-purple-600 to-blue-600',
    'bg-gradient-to-r from-cyan-500 to-blue-500',
    'bg-gradient-to-r from-orange-500 to-red-500',
    'bg-gradient-to-r from-pink-500 to-rose-500',
];

export const FeaturedMarketCard: React.FC<FeaturedMarketCardProps> = ({
    title,
    category,
    volume,
    odds,
    endsIn,
    onClick,
    index,
}) => {
    const gradient = GRADIENTS[index % GRADIENTS.length];

    return (
        <div className="group cursor-pointer" onClick={onClick}>
            {/* Main Card Area */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={`relative h-64 w-full overflow-hidden rounded-[32px] ${gradient} shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10`}
            >
                {/* Abstract Overlay/Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

                {/* Dark Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27]/90 via-[#0A0E27]/40 to-transparent" />

                {/* Content Inside Card */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end gap-3">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                            {category}
                        </span>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                            <FiTrendingUp className="w-3 h-3 text-[#00D4FF]" />
                            <span className="text-xs font-medium text-white/90">
                                Vol: {volume}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-display font-bold text-white leading-tight mt-1 mb-2 text-shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {title}
                    </h3>

                    {/* Probability Bar */}
                    <div className="w-full bg-black/40 rounded-full h-2.5 mb-1 overflow-hidden border border-white/5">
                        <div
                            className="bg-gradient-to-r from-[#00D4FF] to-[#6B4CE6] h-2.5 rounded-full"
                            style={{ width: `${odds.yes}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#00D4FF]">Yes {odds.yes}%</span>
                        <span className="text-white/60">No {odds.no}%</span>
                    </div>
                </div>
            </motion.div>

            {/* Metadata Below Card (Removed for cleaner look as it's now inside the card) */}
        </div>
    );
};
