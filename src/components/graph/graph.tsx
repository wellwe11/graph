import { useEffect, useRef } from "react";
import * as d3 from "d3";
import classes from "./graph.module.scss";

const Graph = ({ data }) => {
  const chartContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data) return;

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

    // Scales
    // data.price.x === date
    const x = d3
      .scaleTime()
      .range([0, width])
      .domain(d3.extent(data!.price, (d) => new Date(d.x)) as [Date, Date]);

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
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H%M")))
      .call((g) =>
        g
          .select(".domain")
          .remove()
          .selectAll(".tick text")
          .style("stroke-opacity", 0),
      );
    svg.selectAll(".tick text").attr("fill", "#777");

    // svg.append("g").call(
    //   d3
    //     .axisLeft(y)
    //     .ticks(d3.max(data.price, (d) => d.y - yMin) / 4500) // Increase/decrease to adjust visible price-points
    //     .tickFormat((d) => {
    //       const num: number = d;

    //       if (num >= 10000) {
    //         return `${(num / 1000).toFixed(0)}k`;
    //       } else {
    //         num.toString();
    //       }
    //     }),
    // );

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
      .style("visibility", (d, i, nodes) => {
        if (i === 0) {
          return "hidden";
        } else {
          return "visible";
        }
      });

    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(new Date(d.x)))
      .y((d) => y(d.y));

    svg
      .append("path")
      .datum(data.price)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    console.log(data);
  }, [data]);

  if (!data) return <div>Loading...</div>;

  return <div className="chart-container" ref={chartContainer} />;
};

export default Graph;
