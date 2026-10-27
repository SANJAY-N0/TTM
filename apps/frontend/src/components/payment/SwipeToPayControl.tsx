import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Sparkles, CheckCircle } from 'lucide-react';

interface SwipeToPayControlProps {
  amount: number;
  disabled?: boolean;
  isProcessing?: boolean;
  onSwipeSuccess: () => void;
}

export const SwipeToPayControl: React.FC<SwipeToPayControlProps> = ({
  amount,
  disabled = false,
  isProcessing = false,
  onSwipeSuccess
}) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isProcessing && !disabled) {
      setSliderValue(0);
      setIsSuccess(false);
    }
  }, [isProcessing, disabled]);

  const handleUpdate = (clientX: number) => {
    if (!sliderRef.current || disabled || isProcessing || isSuccess) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(Math.max(0, (x / rect.width) * 100), 100);
    
    setSliderValue(percent);

    if (percent >= 88) {
      setIsSuccess(true);
      setSliderValue(100);
      isDraggingRef.current = false;
      setTimeout(() => {
        onSwipeSuccess();
      }, 300);
    }
  };

  const handleTouchStart = () => {
    if (!disabled && !isProcessing && !isSuccess) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) {
      handleUpdate(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current && !isSuccess) {
      isDraggingRef.current = false;
      setSliderValue(0);
    }
  };

  const handleMouseDown = () => {
    if (!disabled && !isProcessing && !isSuccess) {
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleUpdate(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current && !isSuccess) {
      isDraggingRef.current = false;
      setSliderValue(0);
    }
  };

  return (
    <div className="w-full space-y-2 select-none">
      <div 
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative h-16 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 touch-none cursor-pointer transition-all border ${
          isSuccess 
            ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-600/30' 
            : disabled || isProcessing
            ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:brightness-105 border-emerald-500/40 shadow-lg shadow-emerald-600/20'
        }`}
      >
        {/* Background Progress Fill */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-emerald-500/40 transition-all duration-75"
          style={{ width: `${sliderValue}%` }}
        />

        {/* Text Prompt Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12 text-center">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-white animate-bounce" />
                <span>Swipe Confirmed!</span>
              </>
            ) : isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 text-white animate-spin" />
                <span>Initiating Cashfree...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 opacity-80" />
                <span>Swipe to Pay ₹{amount}</span>
              </>
            )}
          </span>
        </div>

        {/* Slider Thumb Handle */}
        <div 
          className={`absolute left-1.5 top-1.5 bottom-1.5 w-14 bg-white text-emerald-700 rounded-xl shadow-md flex items-center justify-center transition-transform duration-75 ${
            isSuccess ? 'bg-white text-emerald-600' : ''
          }`}
          style={{ 
            transform: `translateX(${(sliderValue / 100) * (sliderRef.current ? Math.max(0, sliderRef.current.offsetWidth - 68) : 0)}px)` 
          }}
        >
          {isSuccess ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 stroke-[3px]" />
          ) : (
            <ArrowRight className="w-6 h-6 text-emerald-600 stroke-[3px] animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold px-1 uppercase tracking-wider">
        <span>Official Cashfree Gateway</span>
        <span>256-bit Encrypted</span>
      </div>
    </div>
  );
};
