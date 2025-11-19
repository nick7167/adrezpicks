import React from 'react';
import { Zap } from 'lucide-react';

interface HeroProps {
  onSubscribe: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSubscribe }) => {
  return (
    <div className="relative py-16 md:py-24 text-center overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-vegas-green opacity-[0.05] blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-vegas-green mb-6">
        <Zap className="w-3 h-3 mr-2" fill="#00ff41" />
        <span>LIVE: 85% Win Rate Last 7 Days</span>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
        Beat the Books <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-vegas-green to-emerald-600">
            With Professional Edge
        </span>
      </h1>
      
      <p className="text-neutral-400 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
        Stop guessing. Start investing. Access daily high-confidence sports predictions powered by data analysis and expert handicappers.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
            onClick={onSubscribe}
            className="w-full sm:w-auto px-8 py-4 bg-vegas-green hover:bg-green-400 text-black font-bold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]"
        >
            Get Premium Access
        </button>
        <button className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg border border-neutral-800 transition-colors">
            View Free Picks
        </button>
      </div>
    </div>
  );
};

export default Hero;