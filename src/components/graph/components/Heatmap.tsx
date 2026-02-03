import { useEffect, useMemo, useRef } from "react";

import * as d3 from "d3";

import classes from "../graph.module.scss";

import { type DataObj, type DateGroup } from "../testHeatMap";

const HeatMap = ({
  data,
  liquidationType,
  placeholderN,
  dataDays,
  maxValue,
  colorSliderValue,
  width,
  height,
  gradientLow,
  gradientHigh,
}: {
  data: DataObj[];
  liquidationType: "value" | "openInterest";
  placeholderN: string[];
  dataDays: number;
  maxValue: number;
  colorSliderValue: number;
  width: number;
  height: number;
  gradientLow: number;

  gradientHigh: number;
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
    () => ({ top: 15, bottom: 25, left: 35, right: 35 }),
    [],
  );

  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  const colorSchemeValues = useMemo(
    () => ({
      low: maxValue - colorSliderValue * 0.2,
      medium: maxValue - colorSliderValue * 0.5,
    }),
    [colorSliderValue, maxValue],
  );

  const colorScale = useMemo(
    () =>
      d3
        .scaleLinear<string>()
        .domain([0, colorSchemeValues.low, colorSchemeValues.medium, maxValue])
        .range([
          "rgb(50, 163, 255)",
          "rgb(50, 255, 163)",
          "rgb(252, 255, 50)",
          "rgb(255, 132, 50)",
        ]),
    [colorSchemeValues, maxValue],
  );

  // map for finding coins quickly: O(1)
  const valueLookup = useMemo(() => {
    const map = new Map();
    data.forEach((d) => {
      map.set(
        `${d.date.getTime()}-${d.coin}`,
        d[liquidationType as keyof DataObj],
      );
    });
    return map;
  }, [data, liquidationType]);

  useEffect(() => {
    if (!data) return;

    const svgElement = d3
      .select("#svgRef")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);
    const mouseTooltip = d3.select("#mouse-tooltip");
    const coinTooltip = d3.select("#coin-tooltip");
    const dateTooltip = d3.select("#date-tooltip");

    svgElement.selectAll("*").remove();

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

    const chart = svgElement
      .append("g")
      .attr("transform", `translate(${margins.left}, ${margins.top})`);

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
      interval = d3.timeDay.every(4);
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
      .attr("transform", `translate(${cellWidth}, ${innerHeight})`)
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
      .style("text-anchor", "middle");

    const listeningRect = chart
      .append("rect")
      .attr("class", classes.rect)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent");

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
        .style(
          "transform",
          `translate3d(-7.5px, ${snappedY + margins.top - 10}px, 0)`,
        );

      dateTooltip
        .style("display", "block")
        .html(dateFormatter(snappedDate))
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style(
          "transform",
          `translate3d(${snappedX - 25}px, -${margins.top + 10}px, 0)`,
        );

      mouseTooltip
        .style("display", "block")
        .html(
          `<strong>Liquidated Traders</strong> <br /> ${coinAtMouse} - ${valAtMouse}`,
        )
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style(
          "transform",
          `translate3d(${snappedX + 65}px, ${snappedY + 30}px, 0)`,
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
    width,
    height,
    liquidationType,
  ]);

  // Color slider
  useEffect(() => {
    if (!cellsRef.current) return;

    if (dataDays < 90) {
      cellsRef
        .current!.interrupt()

        .attr("fill", function () {
          const value = parseFloat(d3.select(this).attr("data-value"));
          return colorScale(value);
        });
    } else {
      const timer = setTimeout(() => {
        cellsRef.current!.interrupt().attr("fill", function () {
          const value = parseFloat(d3.select(this).attr("data-value"));
          return colorScale(value);
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [colorScale, cellsRef, dataDays]);

  // gradient-slider
  const percentageScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([0, 100]);

  useEffect(() => {
    if (!cellsRef.current) return;

    const timer = setTimeout(() => {
      cellsRef.current!.interrupt().attr("fill", function () {
        const value = parseFloat(d3.select(this).attr("data-value"));

        if (
          Math.round(percentageScale(value)) < gradientLow ||
          Math.round(percentageScale(value)) > 100 - gradientHigh
        ) {
          return "#000000";
        } else {
          return colorScale(value);
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [cellsRef, gradientHigh, gradientLow, colorScale, percentageScale]);

  return (
    <div style={{ position: "relative" }}>
      <svg id="svgRef" />

      <div
        id="mouse-tooltip"
        className={`absolute hidden pointer-events-none z-1001 ${classes.mousetooltip}`}
      />
      <div
        id="coin-tooltip"
        className={`absolute hidden text-right pointer-events-none w-10 z-1000 top-0 ${classes.tooltip}`}
      />
      <div
        id="date-tooltip"
        className={`absolute hidden pointer-events-none z-1000 w-30 text-center ${classes.tooltip}`}
      />
    </div>
  );
};

export default HeatMap;
