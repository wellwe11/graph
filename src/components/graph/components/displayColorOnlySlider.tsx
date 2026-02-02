import { useState } from "react";

// "#38cdff", "#38ff38", "#ffe138", "#ff6d38",

const DisplayColorOnlySlider = () => {
  const min = 0;
  const max = 100;
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(0);

  return (
    <div className="relative w-50 h-8">
      <input
        className="absolute left-0 z-11 w-full 
        cursor-pointer
        appearance-none 
        bg-transparent 
        pointer-events-none 


        [&::-webkit-slider-thumb]:appearance-none 
        [&::-webkit-slider-thumb]:pointer-events-auto 
        [&::-webkit-slider-thumb]:w-3 
        [&::-webkit-slider-thumb]:h-8
        [&::-webkit-slider-thumb]:rounded-full 
        [&::-webkit-slider-thumb]:bg-transparent 
        [&::-webkit-slider-thumb]:border-2 
        [&::-webkit-slider-thumb]:border-white 


        [&::-moz-range-thumb]:pointer-events-auto
        [&::-moz-range-thumb]:w-5
        [&::-moz-range-thumb]:h-8
        [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:bg-transparent
        [&::-moz-range-thumb]:border-2
        [&::-moz-range-thumb]:border-white
        [&::-moz-range-thumb]:border-solid"
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(e) => {
          const value = Math.min(Number(e.target.value), 100 - maxVal);
          setMinVal(value);
        }}
      />
      <div
        className="z-10 bg-gray-400 absolute left-0 h-full"
        style={{ width: `${minVal}%` }}
      />
      <div
        className="z-10 bg-gray-400 absolute right-0 h-full"
        style={{ width: `${maxVal}%` }}
      />

      <div className="relative h-full w-full rounded border border-zinc-800 overflow-hidden">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient
              id="slider-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#38cdff" />
              <stop offset="33%" stopColor="#38ff38" />
              <stop offset="66%" stopColor="#ffe138" />
              <stop offset="100%" stopColor="#ff6d38" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#slider-gradient)" />
        </svg>
      </div>

      <input
        className="absolute top-0 right-0 z-11 w-full 
        cursor-pointer
        appearance-none 
        bg-transparent 
        pointer-events-none 

       
        [&::-webkit-slider-thumb]:appearance-none 
        [&::-webkit-slider-thumb]:pointer-events-auto 
        [&::-webkit-slider-thumb]:w-3 
        [&::-webkit-slider-thumb]:h-8
        [&::-webkit-slider-thumb]:rounded-full 
        [&::-webkit-slider-thumb]:bg-transparent 
        [&::-webkit-slider-thumb]:border-2 
        [&::-webkit-slider-thumb]:border-white 


        [&::-moz-range-thumb]:pointer-events-auto
        [&::-moz-range-thumb]:w-5
        [&::-moz-range-thumb]:h-8
        [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:bg-transparent
        [&::-moz-range-thumb]:border-2
        [&::-moz-range-thumb]:border-white
        [&::-moz-range-thumb]:border-solid"
        style={{ transform: "rotate(180deg)" }}
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(e) => {
          const value = Math.min(Number(e.target.value), 100 - minVal);

          setMaxVal(value);
        }}
      />
    </div>
  );
};

export default DisplayColorOnlySlider;
