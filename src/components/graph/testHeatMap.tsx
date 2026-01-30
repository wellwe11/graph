import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./graph.module.scss";

// Divide code into smaller chunks
// Isolate logic
// Create final graph-item (which is placed below graph)

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

interface DataObj {
  coin: string;
  date: Date;
  value: number;
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
      <label htmlFor="slider">Color slider</label>
      <div style={{ position: "relative" }}>
        <div
          className="absolute -bottom-8.5 px-2 py-1 mb-2 text-xs font-bold text-white transition-opacity bg-gray-500 rounded -translate-x-1/2 pointer-events-none"
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
  const [displayDays, setDisplayDays] = useState(false);
  const days = [
    { label: "1 day", value: 1 },
    { label: "1 week", value: 7 },
    { label: "2 week", value: 14 },
    { label: "30 day", value: 30 },
    { label: "3 month", value: 90 },
    { label: "6 month", value: 182 },
    { label: "1 year", value: 365 },
  ];

  const [label, setLabel] = useState("3 month");

  return (
    <div
      onMouseLeave={() => setDisplayDays(false)}
      className="relative z-10 w-fit"
    >
      <button className="cursor-pointer" onClick={() => setDisplayDays(true)}>
        {label}
      </button>
      <div
        className="absolute bg-white flex flex-col items-left w-20"
        style={{
          opacity: `${displayDays ? "1" : "0"}`,
          visibility: `${displayDays ? "visible" : "hidden"}`,
        }}
      >
        {days.map(({ label, value }) => (
          <button
            key={value}
            className="cursor-pointer text-left"
            onClick={() => {
              setActiveDay(value);
              setDisplayDays(false);
              setLabel(label);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
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
      data.push({
        coin: name,
        date: date,

        value: Math.floor(Math.random() * 1000) + (name === "BTC" ? 500 : 0),
      });
    });
  }
  return data;
};

const HeatMap = ({
  data,
  placeholderN,
  dataDays,
  svgRef,
  maxValue,
  colorSliderValue,
}: {
  data: DataObj[];
  placeholderN: string[];
  dataDays: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  maxValue: number;
  colorSliderValue: number;
}) => {
  const prevCoinAtMouse = useRef<string | null>(null);
  const prevDateAtMouse = useRef<Date | null>(null);
  const cellsRef = useRef<d3.Selection<
    SVGRectElement | d3.BaseType,
    DataObj,
    SVGGElement,
    unknown
  > | null>(null);

  const margins = useMemo(
    () => ({ top: 50, bottom: 50, left: 50, right: 50 }),
    [],
  );

  const height = 500;
  const width = 1000;
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
      map.set(`${d.date.getTime()}-${d.coin}`, d.value);
    });
    return map;
  }, [data]);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const mouseTooltip = d3.select("#mouse-tooltip");
    const coinTooltip = d3.select("#coin-tooltip");
    const dateTooltip = d3.select("#date-tooltip");

    const dateFormatter = d3.timeFormat("%d %b %Y, %H:%M");

    const svgElement = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svgElement.selectAll("*").remove();

    const chart = svgElement
      .append("g")
      .attr("transform", `translate(${margins.left}, ${margins.top})`);

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
      .attr("data-value", (d) => d.value);

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
      .attr("width", innerWidth)
      .attr("height", innerHeight);

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

      if (prevDateAtMouse.current?.getTime() !== snappedDate.getTime()) {
        crosshairX
          .interrupt()
          .attr("x1", centerX)
          .attr("x2", centerX)
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .style("display", "block")
          .style("opacity", 1);

        highlightX
          .interrupt()
          .style("opacity", 0.4)
          .style("display", "block")
          .transition()
          .duration(50)
          .ease(d3.easeCubicOut)
          .attr("x1", centerX)
          .attr("x2", centerX)
          .attr("y1", 0)
          .attr("y2", innerWidth);

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
          .interrupt()
          .style("opacity", 0.4)
          .style("display", "block")
          .transition()
          .duration(50)
          .ease(d3.easeCubicOut)
          .attr("y1", snappedY)
          .attr("y2", snappedY)
          .attr("x1", 0)
          .attr("x2", innerWidth);

        prevCoinAtMouse.current = coinAtMouse;
      }

      coinTooltip
        .style("display", "block")
        .html(coinAtMouse)
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style("transform-origin", "top")
        .style("transform", `translate3d(-42.5px, ${snappedY + 110}px, 0)`);

      dateTooltip
        .style("display", "block")
        .html(dateFormatter(snappedDate))
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style("transform-origin", "left")
        .style(
          "transform",
          `translate3d(${snappedX - margins.left}px, ${height + 22.5}px, 0)`,
        );

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
          `translate3d(${snappedX + 65}px, ${snappedY + 135}px, 0)`,
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
    innerHeight,
    innerWidth,
    margins.top,
    margins.bottom,
    margins.left,
    margins.right,
    placeholderN,
    dataDays,
    svgRef,
    valueLookup,
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
  }, [colorScale]);

  return (
    <>
      <div
        id="mouse-tooltip"
        className={classes.mousetooltip}
        style={{
          display: "none",
          pointerEvents: "none",
          zIndex: 1001,
        }}
      />
      <div
        id="coin-tooltip"
        className={classes.tooltip}
        style={{
          display: "none",
          textAlign: "right",
          pointerEvents: "none",
          width: "40px",
          zIndex: 1000,
        }}
      />
      <div
        id="date-tooltip"
        className={classes.tooltip}
        style={{
          display: "none",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />
    </>
  );
};

const Container = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

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
  const [dataDays, setDataDays] = useState(90);

  // current placeholder-data
  const data = useMemo(
    () => generateHeatmapData(placeholderN, dataDays),
    [dataDays, placeholderN],
  );

  // Find the max value for the domain
  const maxValue = d3.max(data, (d) => d.value) || 1000;

  const defaultSliderValue = maxValue * 0.4;
  const [colorSliderValue, setColorSliderValue] =
    useState<number>(defaultSliderValue);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ width: "200px", marginLeft: 50 }}>
        <HeatMap
          data={data}
          placeholderN={placeholderN}
          dataDays={dataDays}
          svgRef={svgRef}
          maxValue={maxValue}
          colorSliderValue={colorSliderValue}
        />
        <DaysSelect setActiveDay={setDataDays} />
        <ColorSlider
          value={colorSliderValue}
          setValue={setColorSliderValue}
          maxVal={maxValue}
        />
      </div>
      <svg ref={svgRef} />
    </div>
  );
};

export default Container;
