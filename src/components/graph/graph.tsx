import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as d3 from "d3";
import { sliderBottom } from "d3-simple-slider";
import fetchData from "../../functions/useFetch";

import classes from "./graph.module.scss";

const GraphOne = () => {
  const chartContainer = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["graphData"],
    queryFn: () => fetchData("/data.json"),
  });

  useEffect(() => {
    if (isLoading) return;

    // Clean chart
    d3.select(chartContainer.current).selectAll("svg").remove();

    const margin = { top: 70, right: 30, bottom: 40, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Main-svg
    const svg = d3
      .select(chartContainer.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // tooltip - mouse over svg
    const tooltip = d3
      .select("body")
      .append("div")
      .append("tooltip")
      .attr("class", `${classes.tooltip}`);

    // Scales
    // data.price.x === date
    const x = d3
      .scaleTime()
      .range([0, width])
      .domain(d3.extent(data.price, (d) => new Date(d.x)) as [Date, Date]);

    // data.price.y === price
    const yMin = d3.min(data.price, (d) => d.y) as number;
    const yMax = d3.max(data.price, (d) => d.y) as number;
    const y = d3
      .scaleLinear()
      .domain([yMin - 10000, yMax + 10000])
      .range([height, 0])
      .nice();

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .style("font-size", "12px")
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M")))
      .call((g) => g.select(".domain").remove().selectAll(".tick text"))
      .style("stroke-opacity", 0);
    svg.selectAll(".tick text").attr("fill", "#777");

    // y-axis
    svg
      .append("g")
      .style("font-size", "12px")
      .call(
        d3
          .axisLeft(y)
          .ticks(d3.max(data.price, (d) => d.y - yMin) / 4500) // Increase/decrease to adjust visible price-points
          .tickFormat((d) => {
            const num: number = d;

            if (num >= 10000) {
              return `${(num / 1000).toFixed(0)}k`;
            } else {
              num.toString();
            }
          })
          .tickSize(0)
          .tickPadding(10),
      )
      .call((g) => g.select(".domain").remove())
      .selectAll(".tick text")
      .style("fill", "#777")
      .style("visibility", (_, i, __) => {
        if (i === 0) {
          return "hidden";
        } else {
          return "visible";
        }
      });

    // x-axis grid-line
    svg
      .selectAll("xGrid")
      .data(x.ticks())
      .join("line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5);

    // y-axis grid-line
    svg
      .selectAll("yGrid")
      .data(y.ticks(d3.max(data.price, (d) => d.y - yMin) / 4500).slice(1, -1))
      .join("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5);

    // Individual vertical line (connects y & x)
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(new Date(d.x)))
      .y((d) => y(d.y));

    const area = d3
      .area<{ x: number; y: number }>()
      .x((d) => x(new Date(d.x)))
      .y0(height)
      .y1((d) => y(d.y));

    svg
      .append("path")
      .datum(data.price)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .append("path")
      .datum(data.price)
      .attr("class", "area") // Add this class so your slider can find it
      .attr("fill", "steelblue")
      .attr("opacity", 0.2)
      .attr("d", area);

    // hovering svg
    const circle = svg
      .append("circle")
      .attr("r", 0)
      .attr("fill", "steelblue")
      .style("stroke", "white")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    const listeningRect = svg
      .append("rect")
      .attr("class", classes.rect)
      .attr("width", width)
      .attr("height", height);

    // tooltip - mousemovement tracker
    listeningRect.on("mousemove", function (event) {
      const [xCoord] = d3.pointer(event);
      const x0 = x.invert(xCoord);
      const bisectDate = d3.bisector((d) => new Date(d.x)).left;

      const i = bisectDate(data.price, x0, 1);
      const d0 = data.price[i - 1];
      const d1 = data.price[i];

      const d =
        x0.getTime() - new Date(d0.x).getTime() >
        new Date(d1.x).getTime() - x0.getTime()
          ? d1
          : d0;

      circle.attr("cx", x(new Date(d.x))).attr("cy", y(d.y));
      circle.transition().duration(50).attr("r", 5);

      tooltip
        .style("display", "block")
        .style("left", `${x(new Date(d.x)) + 100}px`)
        .style("top", `${y(d.y) + 75}px`)
        .html(
          `<strong>Time:</strong> ${new Date(d.x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<br><strong>Price:</strong>${d.y}`,
        );
    });

    listeningRect.on("mouseleave", function () {
      circle.transition().duration(50).attr("r", 0);

      tooltip.style("display", "none");
    });

    // define sliderRange and its time-range
    const sliderRange = sliderBottom()
      .min(d3.min(data.price, (d) => new Date(d.x)))
      .max(d3.max(data.price, (d) => new Date(d.x)))
      .width(300)
      .tickFormat(d3.timeFormat("%H:%M"))
      .ticks(3)
      .default([
        d3.min(data.price, (d) => new Date(d.x)),
        d3.max(data.price, (d) => new Date(d.x)),
      ])
      .fill("#85bb65");

    sliderRange.on("onchange", (val) => {
      x.domain(val);

      const filteredData = data.price.filter(
        (d) => new Date(d.x) >= val[0] && new Date(d.x) <= val[1],
      );

      svg.select(".line").datum(filteredData).attr("d", line);

      svg.select(".area").attr("d", area(filteredData)); // not sure what he means by area

      y.domain([0, d3.max(filteredData, (d) => d.y) as number]).nice();

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
    });

    const gRange = d3
      .select("#slider-range")
      .append("svg")
      .attr("width", 500)
      .attr("height", 100)
      .append("g")
      .attr("transform", `translate(90,30)`);

    gRange.call(sliderRange);

    // graph title
    svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", margin.left - 115)
      .attr("y", margin.top - 100)
      .style("font-size", "18px")
      .style("font-weight", "thin")
      .style("font-family", "sans-serif")
      .text("Bitcoin-BTCby times: ... : ...");
  }, [data]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="chart-container" ref={chartContainer} />;
      <div id="slider-range" />
    </>
  );
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

  const margin = { top: 70, right: 60, bottom: 50, left: 80 };
  const width = 1400 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  useEffect(() => {
    if (!chartContainer.current || isLoading) return;

    const refEl = chartContainer?.current;

    const svg = d3
      .select(refEl)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.right})`);

    console.log(data);

    x.domain(d3.extent(data.price, (d) => d.x)).nice() as [number, Date];
    y.domain([0, d3.max(data.price, (d) => d.y) as number]).nice() as [
      number,
      number,
    ];

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
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

  return (
    <div ref={chartContainer}>
      <h1>Hello</h1>
    </div>
  );
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
