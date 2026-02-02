import { useState } from "react";

// Updates minvalue for what turns orange/red ('high' on heatmap)
const ColorSlider = ({
  value,
  setValue,
  maxVal = 700,
}: {
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  maxVal: number;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };
  const [viewVal, setViewVal] = useState(false);

  // value-div. Calculate margin left to follow current set of value
  const percent = Math.round((value / maxVal) * 155);

  return (
    <div
      onMouseEnter={() => setViewVal(true)}
      onMouseLeave={() => setViewVal(false)}
    >
      <label htmlFor="slider" className="text-white">
        Color slider
      </label>
      <div style={{ position: "relative" }}>
        <div
          className="absolute z-10 -bottom-8.5 px-2 py-1 mb-2 text-xs font-bold text-white transition-opacity bg-gray-500 rounded -translate-x-1/2 pointer-events-none"
          style={{
            left: `calc(${percent > 5 ? percent : 5}%)`,
            opacity: `${viewVal ? "1" : "0"}`,
          }}
        >
          {Math.round(value)}
        </div>
        <input
          id="slider"
          type="range"
          min="100"
          max={maxVal * 0.6}
          value={value}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer 
          accent-gray-600
          [&::-webkit-slider-thumb]:appearance-none 
          [&::-webkit-slider-thumb]:w-5 
          [&::-webkit-slider-thumb]:h-5 
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:bg-gray-600 
          [&::-webkit-slider-thumb]:border-2 
          [&::-webkit-slider-thumb]:border-white 
          
          "
        />
      </div>
    </div>
  );
};

export default ColorSlider;
