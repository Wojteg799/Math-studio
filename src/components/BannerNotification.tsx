import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { StudioBanner } from '../types/math';

interface BannerNotificationProps {
  banner: StudioBanner | null;
}

export const BannerNotification: React.FC<BannerNotificationProps> = ({ banner }) => {
  if (!banner) return null;

  const getStyle = () => {
    switch (banner.type) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-r from-amber-500/90 via-yellow-400/90 to-amber-500/90',
          border: 'border-amber-200/50',
          text: 'text-slate-950 font-black',
          subtext: 'text-slate-900 font-semibold',
          icon: <Sparkles className="w-6 h-6 text-slate-950 animate-bounce" />,
          glow: 'shadow-[0_0_35px_rgba(251,191,36,0.6)]'
        };
      case 'alert':
        return {
          bg: 'bg-gradient-to-r from-rose-600/95 via-rose-500/95 to-red-600/95',
          border: 'border-rose-300/40',
          text: 'text-white font-extrabold',
          subtext: 'text-rose-100',
          icon: <AlertTriangle className="w-6 h-6 text-white animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.6)]'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-600/95 via-emerald-500/95 to-teal-600/95',
          border: 'border-emerald-300/40',
          text: 'text-white font-extrabold',
          subtext: 'text-emerald-100',
          icon: <CheckCircle2 className="w-6 h-6 text-white" />,
          glow: 'shadow-[0_0_35px_rgba(52,211,153,0.5)]'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-cyan-600/95 via-blue-500/95 to-indigo-600/95',
          border: 'border-cyan-300/40',
          text: 'text-white font-extrabold',
          subtext: 'text-cyan-100',
          icon: <Info className="w-6 h-6 text-white" />,
          glow: 'shadow-[0_0_35px_rgba(56,189,248,0.5)]'
        };
    }
  };

  const style = getStyle();

  return (
    <AnimatePresence>
      <motion.div
        key={banner.id}
        initial={{ y: -60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -40, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div
          className={`${style.bg} ${style.border} ${style.glow} border backdrop-blur-xl px-7 py-3 rounded-2xl flex items-center gap-4`}
        >
          {style.icon}
          <div>
            <div className={`text-base tracking-wide ${style.text}`}>
              {banner.message}
            </div>
            {banner.subtext && (
              <div className={`text-xs mt-0.5 ${style.subtext}`}>
                {banner.subtext}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

