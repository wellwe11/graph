import { useEffect, useMemo, useState } from "react";

import * as d3 from "d3";

import classes from "./graph.module.scss";

import ColorSlider from "./components/colorSlider";
import LiquidationTypeHandler from "./components/liquidationTypeHandler";
import generateHeatmapData from "./components/generateHeatmapData";
import DaysSelect from "./components/daysSelect";
import HeatMap from "./components/Heatmap";
import DisplayColorOnlySlider from "./components/displayColorOnlySlider";

/**
 *
 * @param param0
 * @returns
 *
 **  Important note for future updates
 * In theory, the only thing that you need to update is Data. (Located inside of HeatMap)
 * Currently, stale data is created using generateHeatmapData.
 * Remove this function, and replace it with live data.
 * Only requirement for data is to have the following format:
 *
 * see interface DataObj for required data-structure
 *
 * This is easy to confingure in code as well.
 * If date is in format Unix Timestamp: "timestamp": 1739777800000", simply update
 * uniqueDates to handle them with a new Date() format.
 * There might be minor adjustments needed, but most visualisation should be dynamic. This includes:
 * Colors,
 * x-axis,
 * y-axis,
 * tooltip
 * slider
 * drop-down menu: DaysSelect
 *
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
  const maxValue = d3.max(data, (d) => d[liquidationType]) || 1000;

  const [colorSliderValue, setColorSliderValue] = useState<number>(
    +maxValue * 0.4,
  );

  useEffect(() => {
    setColorSliderValue(maxValue * 0.4);
  }, [maxValue]);

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
              setValue={setColorSliderValue}
              maxVal={maxValue}
            />
          </div>

          <div className="flex gap-2.5 justify-center items-center">
            <DaysSelect setActiveDay={setDataDays} />
            <div className="w-40">
              <LiquidationTypeHandler setLiquidationType={setLiquidationType} />
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
      />

      <div>
        <DisplayColorOnlySlider />
      </div>
    </div>
  );
};

export default Container;
