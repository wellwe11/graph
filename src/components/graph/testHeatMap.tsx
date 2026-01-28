import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./graph.module.scss";

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

const DaysSelect = ({ activeDay, setActiveDay }) => {
  const [displayDays, setDisplayDays] = useState(false);
  const [label, setLabel] = useState(() => activeDay);

  const days = [
    { label: "1 day", value: 1 },
    { label: "1 week", value: 7 },
    { label: "2 week", value: 14 },
    { label: "30 day", value: 30 },
    { label: "3 month", value: 90 },
    { label: "6 month", value: 182 },
    { label: "1 year", value: 365 },
  ];

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
  const data = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = d3.timeDay.offset(today, -i);

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

const HeatMap = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cellsRef = useRef<d3.Selection<
    SVGRectElement,
    SVGSVGElement,
    SVGSVGElement,
    SVGSVGElement
  > | null>(null);

  /** Change amount of cells & time-labels depending on data-days
   * 1 day: {
   * times: 11, 13, 15, 17, 21, 23, 01, 03, 05, 07, 09
   * format: DD, tt:tt
   * cells: 24
   * },
   * 1 week: {
   * times: 18, 10, 02, 18, 10, 02, 18, 10, 02, 18, 10
   * format: DD, tt:tt
   * cells: 21
   * },
   * 2 week:
   * 30 day:
   * 3 month:
   * 6 month:
   * 1 year:
   */

  // placeholder names
  const placeholderN = useMemo(
    () => [
      "BTC",
      "ETH",
      "Doge",
      "NGP",
      "RNG",
      "BPN",
      "USD",
      "IDK",
      "WOO",
      "DOGE",
      "ASD",
      "BTW",
      "WTF",
      "EYY",
      "asd",
      "djiqbnwd",
      "asdhb",
      "asgdfh",
      "dwq",
      "asdq",
      "asdq",
      "qwqert",
      "wqefh",
      "jgew",
      "_mbv",
      "qq12",
      "vfdj",
      "sdlcv",
      "lkjdf",
      "c,vlb",
    ],
    [],
  );

  const [dataDays, setDataDays] = useState(90);
  // current placeholder-data
  const data = useMemo(
    () => generateHeatmapData(placeholderN, dataDays),
    [dataDays, placeholderN],
  );

  const margins = useMemo(
    () => ({ top: 50, bottom: 50, left: 50, right: 50 }),
    [],
  );

  const height = 500;
  const width = 1200;
  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  // Find the max value for the domain
  const maxValue = d3.max(data, (d) => d.value) || 1000;

  const defaultSliderValue = maxValue * 0.4;
  const [colorSliderValue, setColorSliderValue] =
    useState<number>(defaultSliderValue);

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

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svgElement = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    svgElement.selectAll("*").remove();

    const chart = svgElement
      .append("g")
      .attr("transform", `translate(${margins.left}, ${margins.top})`);

    const uniqueDates = Array.from(new Set(data.map((d) => d.date.getTime())))
      .map((time) => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());

    const x = d3
      .scaleBand()
      .domain(uniqueDates.map((d) => d.getTime().toString()))
      .range([0, innerWidth])
      .padding(0);

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
      .attr("x", (d) => x(d.date.getTime().toString())!)
      .attr("y", (d) => y(d.coin)!)
      .attr("width", x.bandwidth() + 1)
      .attr("height", y.bandwidth() + 1)
      .attr("data-value", (d) => d.value)
      .attr("fill", (d) => colorScale(d.value))
      .attr("rx", 0);

    chart
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .attr("color", "#888")
      .selectAll("text")
      .style("font-size", "10px")
      .select(".domain")
      .remove();

    const xTickValues = uniqueDates
      .filter((d, i) => i % Math.round(data.length / 500) === 0)
      .map((d) => d.getTime().toString());

    chart
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(xTickValues)
          .tickFormat((d) => d3.timeFormat("%d %b")(new Date(parseInt(d))))
          .tickSize(0),
      )
      .call((g) => g.select(".domain").remove())
      .attr("color", "#888")
      .selectAll("text")
      .style("font-size", "10px");

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
      .attr("stroke-width", x.bandwidth())
      .style("pointer-events", "none")
      .style("opacity", 0);

    const crosshairX = chart
      .append("line")
      .attr("class", classes.crosshairLine)
      .attr("id", "tooltip-line-x")
      .attr("stroke", "white")
      .attr("strok-width", 1.1)
      .attr("stroke-dasharray", "5")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const highlightY = chart
      .append("line")
      .attr("class", classes.highlightLine)
      .attr("id", "tooltip-line-y")
      .attr("stroke", "white")
      .attr("stroke-width", y.bandwidth())
      .style("pointer-events", "none")
      .style("opacity", 0);

    const crosshairY = chart
      .append("line")
      .attr("class", classes.crosshairLine)
      .attr("id", "tooltip-line-y")
      .attr("stroke", "white")
      .attr("strok-width", 1.1)
      .attr("stroke-dasharray", "5")
      .style("pointer-events", "none")
      .style("opacity", 0);

    listeningRect
      .on("mousemove", (event) => {
        const [mouseX, mouseY] = d3.pointer(event);

        const dateIndex = Math.floor(mouseX / x.bandwidth());
        const hoverDate = uniqueDates[dateIndex];

        if (!hoverDate) return;

        const snappedX = x(hoverDate.getTime().toString());

        const index = Math.floor(mouseY / y.step());
        const coinAtMouse = y.domain()[index];

        if (!coinAtMouse) return;

        const snappedY = y(coinAtMouse)! + y.bandwidth() / 2;

        highlightX

          .transition()
          .duration(30)
          .style("opacity", 0.4)
          .attr("x1", snappedX + x.bandwidth() / 2)
          .attr("x2", snappedX + x.bandwidth() / 2)
          .attr("y1", 0)
          .attr("y2", innerHeight);

        crosshairX

          .transition()
          .duration(75)
          .ease(d3.easeLinear)
          .style("opacity", 1)
          .attr("x1", snappedX + x.bandwidth() / 2)
          .attr("x2", snappedX + x.bandwidth() / 2)
          .attr("y1", 0)
          .attr("y2", innerHeight);

        highlightY

          .transition()
          .duration(30)
          .style("opacity", 0.4)
          .attr("y1", snappedY)
          .attr("y2", snappedY)
          .attr("x1", 0)
          .attr("x2", innerWidth);

        crosshairY

          .transition()
          .duration(75)
          .ease(d3.easeLinear)
          .style("opacity", 1)
          .attr("y1", snappedY)
          .attr("y2", snappedY)
          .attr("x1", 0)
          .attr("x2", innerWidth);
      })
      .on("mouseleave", () => {
        highlightX.style("opacity", 0);
        crosshairX.style("opacity", 0);

        highlightY.style("opacity", 0);
        crosshairY.style("opacity", 0);
      });
  }, [
    data,
    innerHeight,
    innerWidth,
    margins.top,
    margins.bottom,
    margins.left,
    margins.right,
    placeholderN,
    // colorScale // Removed because it forces entire SVG to re-render. Will need to further seperate concerns in future
  ]);

  useEffect(() => {
    if (!cellsRef.current) return;

    const timer = setTimeout(() => {
      cellsRef.current
        .interrupt()
        .transition()
        .attr("fill", function () {
          const value = parseFloat(d3.select(this).attr("data-value"));
          return colorScale(value);
        });
    }, 25); // Adjust for quicker color-change-update. Currently 25 to avoid unnecessary throttling

    return () => clearTimeout(timer);
  }, [colorScale]);

  return (
    <div>
      <div style={{ width: "200px", marginLeft: margins.left }}>
        <DaysSelect activeDay={dataDays} setActiveDay={setDataDays} />
        <ColorSlider
          value={colorSliderValue}
          setValue={setColorSliderValue}
          maxVal={maxValue}
        />
      </div>
      <svg ref={svgRef} />;
    </div>
  );
};

export default HeatMap;
