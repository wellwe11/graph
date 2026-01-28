import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

// --- Types ---
interface DataPoint {
  date: string;
  symbol: string;
  value: number;
}

interface HeatmapProps {
  width?: number;
  height?: number;
}

// --- Mock Data Generator (Mimics the screenshot patterns) ---
const generateMockData = (): {
  data: DataPoint[];
  symbols: string[];
  dates: string[];
} => {
  const symbols = [
    "BTC",
    "ETH",
    "SOL",
    "XRP",
    "DOGE",
    "BNB",
    "HYPE",
    "BCH",
    "SUI",
    "ADA",
    "ZEC",
    "LTC",
    "LINK",
    "AVAX",
    "PAXG",
    "UNI",
    "ASTER",
    "RIVER",
    "ENA",
    "WLFI",
    "TRX",
    "NEAR",
    "AAVE",
    "1000PEPE",
    "TON",
    "FARTCOIN",
    "XMR",
    "PUMP",
    "DOT",
    "ATOM",
    "TAO",
    "FIL",
    "APT",
  ];

  // Generate last 30 days
  const dates: string[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d3.timeFormat("%d %b")(d));
  }

  const data: DataPoint[] = [];

  symbols.forEach((symbol) => {
    dates.forEach((date) => {
      let value = Math.random() * 500; // Base noise

      // Mimic specific patterns from screenshot
      if (symbol === "RIVER") value += 1500; // The hot orange row
      if (["BTC", "ETH", "SOL"].includes(symbol)) value += Math.random() * 800; // Major caps generally hotter
      if (symbol === "ZEC" && Math.random() > 0.8) value += 1000; // Occasional spikes

      // Random "quiet" zones
      if (Math.random() > 0.7) value = value * 0.2;

      data.push({
        date,
        symbol,
        value: Math.floor(value),
      });
    });
  });

  return { data, symbols, dates };
};
const AIgraph: React.FC<HeatmapProps> = ({ width = 1000, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  // Generate data once
  const { data, symbols, dates } = useMemo(() => generateMockData(), []);

  useEffect(() => {
    if (!svgRef.current) return;

    // 1. Setup Dimensions & Margins
    const margin = { top: 50, right: 30, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous renders
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 2. Create the main group container
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Scales
    const x = d3.scaleBand().range([0, chartWidth]).domain(dates).padding(0.05);

    const y = d3
      .scaleBand()
      .range([0, chartHeight])
      .domain(symbols)
      .padding(0.05);

    // Custom Color Scale to match Coinglass (Deep Teal -> Green -> Yellow -> Orange)
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 500, 1000, 2000])
      .range(["#1f4055", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"])
      .interpolate(d3.interpolateRgb);

    // 4. Draw Heatmap Rectangles
    g.selectAll("rect")
      .data(data, (d: any) => d.date + ":" + d.symbol)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.date)!)
      .attr("y", (d) => y(d.symbol)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("cursor", "crosshair")
      .on("mouseover", (event, d) => {
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: `${d.symbol} on ${d.date}: $${d.value.toLocaleString()} Liquidation`,
        });
        d3.select(event.currentTarget)
          .style("stroke", "#fff")
          .style("stroke-width", 1);
      })
      .on("mouseout", (event) => {
        setTooltip(null);
        d3.select(event.currentTarget).style("stroke", "none");
      });

    // 5. Add X Axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => !(i % 2)))) // Show every 2nd label
      .select(".domain")
      .remove(); // Remove axis line for cleaner look

    // Style X Axis text
    g.selectAll(".tick text")
      .style("fill", "#8d99ae")
      .style("font-size", "10px");

    // 6. Add Y Axis
    g.append("g").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    // Style Y Axis text
    g.selectAll(".tick text")
      .style("fill", "#dfe6e9")
      .style("font-size", "11px")
      .style("font-weight", "bold");

    // 7. Add Title
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 30)
      .attr("text-anchor", "start")
      .style("font-size", "18px")
      .style("fill", "white")
      .style("font-weight", "bold")
      .text("Cryptocurrency Liquidation History Heatmap");

    // 8. Add Legend Gradient
    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient");

    // Create gradient stops based on our color scale
    [0, 25, 50, 75, 100].forEach((offset, i) => {
      // Map percentage to value domain (0 to 2000)
      const val = (offset / 100) * 2000;
      linearGradient
        .append("stop")
        .attr("offset", `${offset}%`)
        .attr("stop-color", colorScale(val));
    });

    // Draw Legend Bar
    const legendWidth = 300;
    const legendHeight = 15;
    const legendX = (width - margin.left - margin.right) / 2; // Center horizontally
    const legendY = height - 40;

    svg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("x", legendX)
      .attr("y", legendY)
      .style("fill", "url(#legend-gradient)")
      .style("rx", 3); // Rounded corners

    // Legend Labels (0 and Max)
    svg
      .append("text")
      .attr("x", legendX)
      .attr("y", legendY + 30)
      .text("0")
      .style("fill", "#8d99ae")
      .style("font-size", "12px");

    svg
      .append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY + 30)
      .attr("text-anchor", "end")
      .text("2174")
      .style("fill", "#8d99ae")
      .style("font-size", "12px");
  }, [width, height, data, dates, symbols]);

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#0b121f",
        borderRadius: "8px",
        padding: "10px",
        display: "inline-block",
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor: "#0b121f" }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${tooltip.x - 50}px, ${tooltip.y - 100}px)`, // Offset to not block mouse
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
            border: "1px solid #444",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default AIgraph;
