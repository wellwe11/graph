import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import fetchData from "../../functions/useFetch";
import * as d3 from "d3";

const TestGraph = () => {
  // get data
  const { data, isLoading } = useQuery({
    queryKey: ["testData"],
    queryFn: () => fetchData("/liquidation.json"),
  });

  // First we need to create a svgContainer and then bind that by useRef
  const svgRef = useRef<SVGSVGElement | null>(null);
  // create dimensions (height, width etc.)
  const margins = { top: 50, bottom: 50, right: 50, left: 50 };
  const innerWidth = 400 - margins.left - margins.right;
  const innerHeight = 400 - margins.top - margins.bottom;

  // placeholder data
  const placeholderD = useMemo(() => [96, 150, 100, 200], []);
  const placeholderN = useMemo(() => ["BTC", "ETH", "Doge", "NGP"], []);

  // placeholder dates
  const today = new Date();
  const oneMonthAhead = d3.timeMonth.offset(today, 1);

  // define x-axis
  const x = d3
    .scaleTime()
    .domain([today, oneMonthAhead])
    .range([0, innerWidth]);

  // define y-axis
  const y = d3
    .scaleBand()
    .domain(placeholderN)
    .range([0, innerHeight])
    .padding(0.2);

  useEffect(() => {
    if (!data || isLoading || !svgRef.current) return;

    // clean graph; avoid duplicates
    d3.select(svgRef.current).selectAll("*").remove();

    // main svg
    const svg = d3
      .select(svgRef?.current)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .style("background", "#f0f0f0")
      .style("overflow", "visible");

    // the x & y axis-info
    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d"));
    const yAxis = d3.axisLeft(y);

    // Create a bar for each data-point
    svg
      .selectAll(".bar")
      .data(placeholderD)
      .join("rect")
      .attr("class", "bar")

      // x starts at 0
      .attr("x", 0)
      // y creates one for each data-point
      .attr("y", (d, i) => y(placeholderN[i])!)

      // width is based on dates
      .attr("width", (d) => d)

      // height is based on how many data-points there are * size of each
      .attr("height", y.bandwidth())

      .attr("fill", "steelblue");

    svg.append("g").call(yAxis);

    svg
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Now we should have the basic elements for the graph, without the data
  }, [
    data,
    isLoading,
    svgRef,
    placeholderD,
    placeholderN,
    innerHeight,
    innerWidth,
    x,
    y,
  ]);

  return <svg style={{ marginLeft: "50px" }} ref={svgRef} />;
};

export default TestGraph;
