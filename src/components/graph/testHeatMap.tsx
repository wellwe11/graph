import { useMemo, useState, useTransition } from "react";

import * as d3 from "d3";

// import classes from "./graph.module.scss";

import ColorSlider from "./components/colorSlider";
import LiquidationTypeHandler from "./components/liquidationTypeHandler";
import generateHeatmapData from "./components/generateHeatmapData";
import DaysSelect from "./components/daysSelect";
import HeatMap from "./components/Heatmap";
import GradientSlider from "./components/gradientSlider";

// Next step: Create wrappers for main-component to help clean up code. Then it's done

/**
 *
 * @param param0
 * @returns
 *
 **  Important note for future updates
 * In theory, the only thing that you need to update is Data. (Located inside of HeatMap.tsx => HeatMap)
 * Currently, stale data is created using generateHeatmapData.
 * Remove this function, and replace it with live data.
 * Only requirement for data is to have the following format: * see interface DataObj *
 *
 * If date is in format Unix Timestamp: "timestamp": 1739777800000", simply update
 * uniqueDates to handle them with a new Date() format.
 * There might be minor adjustments needed, but most visualisation should be dynamic. This includes:
 * Colors,
 * x-axis,
 * y-axis,
 * tooltip
 * slider
 * drop-down menu: DaysSelect
 */

export interface DataObj {
  coin: string;
  date: Date;
  value: number;
  openInterest: number;
}

export interface DateGroup {
  date: Date;
  records: DataObj[];
}

// const HeatMapWrapper = () => {
//   // isolated heatmap-logic
// };

const Container = () => {
  // placeholder names
  const placeholderN = useMemo(
    () => [
      "BTC",
      "ETH",
      "USDT",
      "BNB",
      "SOL",
      "XRP",
      "USDC",
      "ADA",
      "STETH",
      "AVAX",
      "DOGE",
      "DOT",
      "TRX",
      "LINK",
      "WBTC",
      "MATIC",
      "SHIB",
      "TON",
      "DAI",
      "LTC",
      "BCH",
      "UNI",
      "LEO",
      "NEAR",
      "OP",
      "APT",
      "ARB",
      "XLM",
      "OKB",
      "LDO",
    ],
    [],
  );

  // DaysSelect dropdown selector - displays data from today - dataKeys
  const [dataDays, setDataDays] = useState(30);

  // Open Interest / Market Cap;
  const [liquidationType, setLiquidationType] = useState<
    "value" | "openInterest"
  >("openInterest");

  // current placeholder-data
  const data = useMemo(
    () => generateHeatmapData(placeholderN, dataDays),
    [dataDays, placeholderN],
  );

  // Find the max value for the domain
  const initialMaxVal = d3.max(data, (d) => d[liquidationType]) || 1000;
  const [maxValue, setMaxval] = useState(() => initialMaxVal);

  const [colorSliderValue, setColorSliderValue] = useState<number>(
    +maxValue * 0.6,
  );

  const [isPending, startTransition] = useTransition();

  console.log(isPending);

  const [gradientLow, setGradientLow] = useState(0);
  const [gradientHigh, setGradientHigh] = useState(0);

  const liquidationTypeChangeHandler = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    startTransition(() => {
      const text = (e.target as HTMLElement).textContent as string;
      let type: "value" | "openInterest";

      if (text.toLowerCase() === "open interest") {
        type = "openInterest";
      } else {
        type = "value";
      }

      setLiquidationType(type);

      const newVal = d3.max(data, (d) => d[type]) || 1000;
      setMaxval(newVal);

      console.log(newVal);

      setColorSliderValue(+newVal * 0.6);
      setGradientLow(0);
      setGradientHigh(0);
    });
  };

  const handleColorSlide = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setGradientLow(0);
    setGradientHigh(0);
    setColorSliderValue(Number(e.target.value));
  };

  const height = 500;
  const width = 900;

  return (
    <div className="flex flex-col bg-[#151b2b] p-2.5 w-fit h-fit">
      <div className="flex justify-center">
        <div
          className="flex justify-between gap-5 py-1.5"
          style={{ width, paddingLeft: "35px", paddingRight: "35px" }}
        >
          <div className="w-40">
            <ColorSlider
              value={colorSliderValue}
              setValue={handleColorSlide}
              maxVal={maxValue}
            />
          </div>

          <div className="flex gap-2.5 justify-center items-center">
            <DaysSelect setActiveDay={setDataDays} />
            <div className="w-40">
              <LiquidationTypeHandler handler={liquidationTypeChangeHandler} />
            </div>
          </div>
        </div>
      </div>

      <HeatMap
        data={data}
        liquidationType={liquidationType}
        placeholderN={placeholderN}
        dataDays={dataDays}
        maxValue={maxValue}
        colorSliderValue={colorSliderValue}
        height={height}
        width={width}
        gradientLow={gradientLow}
        gradientHigh={gradientHigh}
      />

      <div className="flex justify-center items-center">
        <GradientSlider
          gradientLow={gradientLow}
          setGradientLow={setGradientLow}
          gradientHigh={gradientHigh}
          setGradientHigh={setGradientHigh}
        />
      </div>
    </div>
  );
};

export default Container;
