import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./graph.module.scss";
import DropDownMenu from "./components/dropdownMenu";

// Divide code into smaller chunks
// Isolate logic
// Create final graph-item (which is placed below graph)
// remove highlights etc when more than 6 months
// make it a bit scaleable and style it
// tome-toolbar is not center

/**
 * 
 * @param param0 
 * @returns 
 * 
 **  Important note for future updates
   * In theory, the only thing that you need to update is Data. (Located inside of HeatMap)
   * Currently, stale data is created using generateHeatmapData.
   * Only requirement for data is to have the following format:
   * {
    "coin": "someCoin", 
    "date": "2026-01-21T10:54:53.426Z", 
    "value": 449 
    }
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

interface DateGroup {
  date: Date;
  records: DataObj[];
}

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
  const percent = (value / maxVal) * 170;

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
            left: `calc(${percent}% - 12px)`,
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

const DaysSelect = ({
  setActiveDay,
}: {
  setActiveDay: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const days = [
    "1 day",
    "1 week",
    "2 week",
    "30 day",
    "3 month",
    "6 month",
    "1 year",
  ];

  const handleDays = (e: React.MouseEvent<HTMLButtonElement>) => {
    const text = (e.target as HTMLElement).textContent;

    switch (text) {
      case "1 day":
        setActiveDay(1);
        break;
      case "1 week":
        setActiveDay(7);
        break;
      case "2 week":
        setActiveDay(14);
        break;
      case "30 day":
        setActiveDay(30);
        break;
      case "3 month":
        setActiveDay(90);
        break;
      case "6 month":
        setActiveDay(182);
        break;
      case "1 year":
        setActiveDay(365);
        break;
      default:
        console.error(" -- testHeatMap > handleDays -- does not return a day");
        setActiveDay(7);
    }
  };

  useEffect(() => {
    setActiveDay(30);
  }, [setActiveDay]);

  return <DropDownMenu data={days} action={handleDays} default={3} />;
};

const LiquidationTypeHandler = ({
  setLiquidationType,
}: {
  setLiquidationType: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const types = ["Open Interest", "Market Cap"];

  const handleTypechange = (e: React.MouseEvent<HTMLButtonElement>) => {
    const text = (e.target as HTMLElement).textContent as string;

    console.log("asd");
    if (text.toLowerCase() === "open interest") {
      setLiquidationType("openInterest");
    } else {
      setLiquidationType("value");
    }
  };

  return <DropDownMenu data={types} action={handleTypechange} default={0} />;
};

const generateHeatmapData = (names: string[], days = 90) => {
  const data: DataObj[] = [];
  const today = new Date();

  let amountOfData;
  let timeOffset;

  if (days <= 1) {
    amountOfData = 25;
    timeOffset = (i: number) => d3.timeHour.offset(today, -i);
  } else if (days <= 7) {
    amountOfData = Math.floor((days * 16) / 6);
    timeOffset = (i: number) => d3.timeHour.offset(today, -i * 6);
  } else if (days <= 14) {
    amountOfData = Math.floor((days * 26) / 8);
    timeOffset = (i: number) => d3.timeHour.offset(today, -i * 8);
  } else {
    amountOfData = days;
    timeOffset = (i: number) => d3.timeDay.offset(today, -i);
  }

  for (let i = 0; i < amountOfData; i++) {
    const date = timeOffset(i);

    names.forEach((name) => {
      const priceClarity = Math.random() > 0.8 ? 2000 : 100;

      data.push({
        coin: name,
        date: date,
        value: Math.floor(Math.random() * 500) + priceClarity,
        openInterest: Math.floor(Math.random() * 100000) + 50000,
      });
    });
  }
  return data;
};

const HeatMap = ({
  data,
  liquidationType,
  placeholderN,
  dataDays,
  maxValue,
  colorSliderValue,
  width,
  height,
}: {
  data: DataObj[];
  liquidationType: DataObj["value"] | DataObj["openInterest"];
  placeholderN: string[];
  dataDays: number;
  maxValue: number;
  colorSliderValue: number;
  width: number;
  height: number;
}) => {
  const prevCoinAtMouse = useRef<string | null>(null);
  const prevDateAtMouse = useRef<Date | null>(null);
  const cellsRef = useRef<d3.Selection<
    d3.BaseType,
    DataObj,
    SVGGElement,
    unknown
  > | null>(null);

  const margins = useMemo(
    () => ({ top: 50, bottom: 50, left: 50, right: 50 }),
    [],
  );

  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  const colorSchemeValues = useMemo(
    () => ({
      low: maxValue - colorSliderValue * 0.5,
      medium: maxValue - colorSliderValue * 1.5,
    }),
    [colorSliderValue, maxValue],
  );

  const colorScale = useMemo(
    () =>
      d3
        .scaleLinear<string>()
        .domain([0, colorSchemeValues.low, colorSchemeValues.medium, maxValue])
        .range(["#38cdff", "#38ff38", "#ffe138", "#ff6d38"]),
    [colorSchemeValues, maxValue],
  );

  // map for finding coins quickly: O(1)
  const valueLookup = useMemo(() => {
    const map = new Map();
    data.forEach((d) => {
      map.set(`${d.date.getTime()}-${d.coin}`, d[liquidationType]);
    });
    return map;
  }, [data, liquidationType]);

  useEffect(() => {
    if (!data) return;

    const svgElement = d3.select("#svgRef");
    const mouseTooltip = d3.select("#mouse-tooltip");
    const coinTooltip = d3.select("#coin-tooltip");
    const dateTooltip = d3.select("#date-tooltip");

    svgElement.selectAll("*").remove();

    const chart = svgElement
      .append("g")
      .attr("transform", `translate(${margins.left}, 0)`)
      .style("width", innerWidth)
      .style("height", innerHeight);

    const dataByDate = d3.group(data, (d) => d.date.getTime());
    const uniqueDates = Array.from(dataByDate.keys())
      .sort((a, b) => a - b)
      .map((time) => ({
        date: new Date(time),
        records: dataByDate.get(time),
      })) as DateGroup[];

    const cellWidth = innerWidth / uniqueDates.length;

    const x = d3
      .scaleTime()
      .domain([
        uniqueDates[0].date,
        d3.timeSecond.offset(uniqueDates[uniqueDates.length - 1].date, 1),
      ])
      .range([0, innerWidth - cellWidth]);

    const y = d3
      .scaleBand()
      .domain(placeholderN)
      .range([0, innerHeight])
      .padding(0);

    cellsRef.current = chart
      .selectAll(".cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.date)!)
      .attr("y", (d) => y(d.coin)!)
      .attr("width", cellWidth + 0.5)
      .attr("height", y.bandwidth())
      .attr("data-value", (d) => d[liquidationType])
      .attr("fill", (d) => colorScale(d[liquidationType]))
      .style("shape-rendering", "crispEdges");

    chart
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .attr("color", "#888")
      .selectAll("text")
      .style("font-size", "10px")
      .select(".domain")
      .remove();

    let interval: d3.TimeInterval | null;
    let tickFormat;

    if (dataDays <= 1) {
      interval = d3.timeHour.every(2);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%H:%M")(d as Date);
    } else if (dataDays <= 7) {
      interval = d3.timeHour.every(8);
      tickFormat = (d: d3.NumberValue) => {
        const date = d as Date;

        return d3.timeFormat("%d, %H:%M")(date);
      };
    } else if (dataDays <= 14) {
      interval = d3.timeHour.every(30);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%d %b")(d as Date);
    } else if (dataDays <= 30) {
      interval = d3.timeDay.every(2);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%d %b")(d as Date);
    } else if (dataDays <= 90) {
      interval = d3.timeWeek.every(1);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%d %b")(d as Date);
    } else if (dataDays <= 182) {
      interval = d3.timeWeek.every(2);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%d %b")(d as Date);
    } else {
      interval = d3.timeMonth.every(1);
      tickFormat = (d: d3.NumberValue) => d3.timeFormat("%b %Y")(d as Date);
    }

    const filteredTicks = interval!.range(
      uniqueDates[0].date,
      d3.timeSecond.offset(uniqueDates[uniqueDates.length - 1].date, 1),
    );

    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(filteredTicks)
          .tickFormat(tickFormat)
          .tickSize(0),
      )
      .call((g) => g.select(".domain").remove())
      .attr("color", "#888")
      .selectAll("text")
      .style("font-size", "10px")
      .style("text-anchor", "start");

    const listeningRect = chart
      .append("rect")
      .attr("class", classes.rect)
      .attr("width", "100%")
      .attr("height", "100%");

    const highlightX = chart
      .append("line")
      .attr("class", classes.highlightLine)
      .attr("id", "tooltip-line-x")
      .attr("stroke", "white")
      .attr("stroke-width", cellWidth)
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("display", "none");

    const crosshairX = chart
      .append("line")
      .attr("class", classes.crosshairLine)
      .attr("id", "tooltip-line-x")
      .attr("stroke", "white")
      .attr("strok-width", 1.1)
      .attr("stroke-dasharray", "5")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("display", "none");

    const highlightY = chart
      .append("line")
      .attr("class", classes.highlightLine)
      .attr("id", "tooltip-line-y")
      .attr("stroke", "white")
      .attr("stroke-width", y.bandwidth())
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("display", "none");

    const crosshairY = chart
      .append("line")
      .attr("class", classes.crosshairLine)
      .attr("id", "tooltip-line-y")
      .attr("stroke", "white")
      .attr("strok-width", 1.1)
      .attr("stroke-dasharray", "5")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("display", "none");

    listeningRect.on("mousemove", (event) => {
      const [mouseX, mouseY] = d3.pointer(event);

      const dateAtMouse = x.invert(mouseX);

      const bisect = d3.bisector((d: DateGroup) => d.date).left;
      const index = bisect(uniqueDates, dateAtMouse);

      const snappedDate = uniqueDates[Math.max(0, index - 1)].date;
      if (!snappedDate) return;

      const snappedX = x(snappedDate);

      const coinIndex = Math.floor(
        mouseY / (innerHeight / placeholderN.length),
      );
      const coinAtMouse = placeholderN[coinIndex];

      if (!coinAtMouse) return;
      const snappedY = y(coinAtMouse)! + y.bandwidth() / 2;

      const centerX = snappedX + cellWidth / 2;

      const key = `${snappedDate.getTime()}-${coinAtMouse}`;
      const valAtMouse = valueLookup.get(key) || 0;

      // Remove strokes if too many columns - save on performance
      if (dataDays <= 180) {
        if (
          prevDateAtMouse.current?.getTime() !== snappedDate.getTime() ||
          prevCoinAtMouse.current !== coinAtMouse
        ) {
          crosshairX
            .interrupt()
            .attr("x1", centerX)
            .attr("x2", centerX)
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .style("display", "block")
            .style("opacity", 1);

          highlightX

            .style("opacity", 0.4)
            .style("display", "block")
            .transition()
            .duration(150)
            .ease(d3.easeCubicOut)
            .attr("x1", centerX)
            .attr("x2", centerX)
            .attr("y1", 0)
            .attr("y2", innerHeight);
          prevDateAtMouse.current = snappedDate;
        }

        if (prevCoinAtMouse.current !== coinAtMouse) {
          crosshairY
            .interrupt()
            .attr("y1", snappedY)
            .attr("y2", snappedY)
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .style("display", "block")
            .style("opacity", 1);

          highlightY
            .style("opacity", 0.4)
            .style("display", "block")
            .transition()
            .duration(150)
            .ease(d3.easeCubicOut)
            .attr("y1", snappedY)
            .attr("y2", snappedY)
            .attr("x1", 0)
            .attr("x2", innerWidth);

          prevCoinAtMouse.current = coinAtMouse;
        }
      }
      const dateFormatter = d3.timeFormat("%d %b %Y, %H:%M");

      coinTooltip
        .style("display", "block")
        .html(coinAtMouse)
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style("transform", `translate3d(10px, ${snappedY - 10}px, 0)`);

      dateTooltip
        .style("display", "block")
        .html(dateFormatter(snappedDate))
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style("transform", `translate3d(${snappedX + 5}px, -20px, 0)`);

      mouseTooltip
        .style("display", "block")
        .html(
          `<strong>Liquidition traders</strong> <br /> ${coinAtMouse} - ${valAtMouse}`,
        )
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style(
          "transform",
          `translate3d(${snappedX + 70}px, ${snappedY + 20}px, 0)`,
        );
    });

    chart.on("mouseleave", () => {
      highlightX.interrupt().style("opacity", 0).style("display", "none");
      crosshairX.interrupt().style("opacity", 0).style("display", "none");
      highlightY.interrupt().style("opacity", 0).style("display", "none");
      crosshairY.interrupt().style("opacity", 0).style("display", "none");
      mouseTooltip.style("display", "none");
      coinTooltip.style("display", "none");
      dateTooltip.style("display", "none");
    });

    return () => {
      svgElement.selectAll("*").remove();
    };
  }, [
    data,
    placeholderN,
    dataDays,
    valueLookup,

    innerHeight,
    innerWidth,
    margins.top,
    margins.bottom,
    margins.left,
    margins.right,
  ]);

  useEffect(() => {
    if (!cellsRef.current) return;
    const timer = setTimeout(() => {
      cellsRef
        .current!.interrupt()
        .transition()
        .attr("fill", function () {
          const value = parseFloat(d3.select(this).attr("data-value"));
          return colorScale(value);
        });
    }, 25); // Adjust for quicker color-change-update. Currently 25 to avoid unnecessary throttling

    return () => clearTimeout(timer);
  }, [colorScale, cellsRef]);

  return (
    <div className="relative w-full h-full">
      <svg id="svgRef" className="w-full h-full" />

      <div
        id="mouse-tooltip"
        className={`hidden pointer-events-none z-1001 ${classes.mousetooltip}`}
      />
      <div
        id="coin-tooltip"
        className={`hidden text-right pointer-events-none w-10 z-1000 top-0 ${classes.tooltip}`}
      />
      <div
        id="date-tooltip"
        className={`hidden pointer-events-none z-1000 w-30 text-center ${classes.tooltip}`}
      />
    </div>
  );
};

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

  console.log(liquidationType);
  const [colorSliderValue, setColorSliderValue] = useState<number>(0);

  useEffect(() => {
    setColorSliderValue(maxValue * 0.4);
  }, [maxValue]);

  const height = 500;
  const width = 1200;

  return (
    <div
      className="flex flex-col bg-[#151b2b] p-2.5"
      style={{
        width,
        height,
      }}
    >
      <div className="flex justify-end">
        <div className="flex justify-between gap-5 py-1.5">
          <div className="w-40">
            <ColorSlider
              value={colorSliderValue}
              setValue={setColorSliderValue}
              maxVal={maxValue}
            />
          </div>
          <div className="w-40">
            <DaysSelect setActiveDay={setDataDays} />
          </div>
          <div>
            <LiquidationTypeHandler setLiquidationType={setLiquidationType} />
          </div>
        </div>
      </div>
      <div className="relative h-full w-full">
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
      </div>
    </div>
  );
};

export default Container;
