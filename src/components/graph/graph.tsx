import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as d3 from "d3";
import { sliderBottom } from "d3-simple-slider";
import fetchData from "../../functions/useFetch";

import classes from "./graph.module.scss";

type Price = {
  x: Date;
  y: number;
};

const GraphTwo = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["graphData"],
    queryFn: () => fetchData("/data.json"),
    select: (rawData) => ({
      ...rawData,
      price: rawData.price.map((d: any) => ({ ...d, x: new Date(d.x) })),
    }),
  });

  const chartContainer = useRef<HTMLDivElement | null>(null);

  // chartContainer dimensions
  const margin = { top: 70, right: 60, bottom: 50, left: 80 };
  const width = 1400 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  // chartContainer scales
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  useEffect(() => {
    if (!chartContainer.current || isLoading) return;

    // Clean chart once data updates
    d3.select(chartContainer.current).selectAll("svg").remove();

    const refEl = chartContainer?.current;

    // Main-svg
    const svg = d3
      .select(refEl)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.right})`);
    const toolTip = d3
      .select("body")
      .append("div")
      .attr("class", classes.toolTip);

    const tooltipRawDate = d3
      .select("body")
      .append("div")
      .attr("class", classes.toolTip);

    // since price fluxes at a very high number, base minimum/maximum on percentace instead of 0/max
    const yMin = (d3.min(data.price, (d: Price) => d.y) * 0.8) as number,
      yMax = (d3.max(data.price, (d: Price) => d.y) * 1.1) as number;

    x.domain([data.from, data.to]) as [Date, Date];
    y.domain([yMin, yMax]);

    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#85bb65")
      .attr("stop-opacity", 1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#85bb65")
      .attr("stop-opacity", 0);

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .style("font-size", "14px")
      .call(
        d3
          .axisBottom(x)
          .tickValues(x.ticks(d3.timeYear.every(1)))
          .tickFormat(d3.timeFormat("%Y")),
      )
      .selectAll(".tick line")
      .style("stroke-opacity", 1);
    svg.selectAll(".tick text").attr("fill", "#777");

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${width},0)`)
      .style("font-size", "14px")
      .call(
        d3
          .axisRight(y)
          .ticks(10)
          .tickFormat((d: number) => {
            if (isNaN(d)) return "";
            return `${d.toFixed(2)}`;
          }),
      )
      .selectAll(".tick text")
      .style("fill", "+777");

    const line = d3
      .line()
      .x((d: Price) => x(d.x))
      .y((d: Price) => y(d.y));

    const area = d3
      .area()
      .x((d: Price) => x(d.x))
      .y0(height)
      .y1((d: Price) => y(d.y));

    svg
      .append("path")
      .datum(data.price)
      .attr("class", "area")
      .attr("d", area)
      .style("fill", "url(#gradient")
      .style("opacity", 0.5);

    svg
      .append("path")
      .datum(data.price)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "#85bb65")
      .attr("stroke-width", 1)
      .attr("d", line);

    const circle = svg
      .append("circle")
      .attr("r", 0)
      .attr("fill", "red")
      .style("stroke", "white")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    const tooltipLineX = svg
      .append("line")
      .attr("class", classes.tooltipLine)
      .attr("id", "tooltip-line-x")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    const tooltipLineY = svg
      .append("line")
      .attr("class", classes.tooltipLine)
      .attr("id", "tooltip-line-y")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    const listeningRect = svg
      .append("rect")
      .attr("class", classes.rect)
      .attr("width", width)
      .attr("height", height);

    listeningRect.on("mousemove", (event: MouseEvent) => {
      const [xCoord] = d3.pointer(event, this);
      const bisectDate = d3.bisector((d: Price) => d.x).left;

      const x0 = x.invert(xCoord);
      const i = bisectDate(data.price, x0, 1);
      const d0 = data.price[i - 1];
      const d1 = data.price[i];
      const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

      const xPos = x(d.x);
      const yPos = y(d.y);

      circle.attr("cx", xPos).attr("cy", yPos);

      circle.transition().duration(50).attr("r", 5);

      tooltipLineX
        .style("display", "block")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", height);

      tooltipLineY
        .style("display", "block")
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("x1", 0)
        .attr("x2", width);

      toolTip
        .style("display", "block")
        .style("left", `${width + 90}px`)
        .style("top", `${yPos + 68}px`)
        .html(`${d.y !== undefined ? d.y.toFixed(2) : "N/A"}`);

      tooltipRawDate
        .style("display", "block")
        .style("left", `${xPos + 60}px`)
        .style("top", `${height + 53}px`)
        .html(`${d.x !== undefined ? d.x.toISOString().slice(0, 10) : "N/A"}`);
    });

    listeningRect.on("mouseleave", () => {
      circle.transition().duration(50).attr("r", 0);
      toolTip.style("display", "none");
      tooltipRawDate.style("display", "none");
      tooltipLineX.attr("x1", 0).attr("x2", 0);
      tooltipLineY.attr("y1", 0).attr("y2", 0);
      tooltipLineX.style("display", "none");
      tooltipLineY.style("display", "none");
    });

    const sliderRange = sliderBottom()
      .min(data.min)
      .max(data.max)
      .width(300)
      .tickFormat(d3.timeFormat("%Y-%m-%d"))
      .ticks(3)
      .default([data.from, data.to])
      .fill("#85bb65");

    sliderRange.on("onchange", (val) => {
      x.domain(val);

      const filteredData = data.filter((d) => d.x >= val[0] && d.x <= val[1]);

      svg.select(".line").attr("d", line(filteredData));
      svg.select(".area").attr("d", area(filteredData));

      y.domain([0, d3.max(filteredData, (d) => d.x)]);

      svg
        .select(".x-axis")
        .transition()
        .duration(300)
        .call(
          d3
            .axisBottom(x)
            .tickValues(x.ticks(d3.timeYear.every(1)))
            .tickFormat(d3.timeFormat("%Y")),
        );
    });

    svg
      .select(".y-axis")
      .transition()
      .duration(300)
      .call(
        d3
          .axisRight(y)
          .ticks(10)
          .tickFormat((d) => {
            if (d <= 0) return "";
            return `${d.toFixed(2)}`;
          }),
      );

    const gRange = d3
      .select("#slider-range")
      .append("svg")
      .attr("width", 500)
      .attr("height", 100)
      .append("g")
      .attr("transform", "translate(90,30)");

    gRange.call(sliderRange);

    svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", margin.left - 115)
      .attr("y", margin.top - 100)
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("font-family", "sans-serif")
      .text("Bitcoin Price Over Time");
  }, [
    data,
    isLoading,
    height,
    width,
    margin.left,
    margin.right,
    margin.bottom,
    margin.top,
    x,
    y,
  ]);

  return <div ref={chartContainer}></div>;
};

const Graph = () => {
  return (
    <>
      <GraphTwo />
      {/* <GraphOne /> */}
    </>
  );
};

export default Graph;
