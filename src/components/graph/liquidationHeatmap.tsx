import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import fetchData from "../../functions/useFetch";
import { useEffect, useMemo, useRef, useState } from "react";

const LiquidationHeatmap = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => fetchData("/liquidation.json"),

    // select: (rawData) => ({
    //   ...rawData,
    //   data: rawData.data.map((d) => ({
    //     ...d,
    //     timestamp: new Date(d.timestamp),
    //   })),
    // }),
  });

  // Creating a hash-table we first need to map out a fixed period of time (default: 1 month)
  // We need amount of liquidation per day
  // Dates
  // The amount of trades on that day
  const sortTimes = (coinEntry) => {
    const DateObj = () => {
      // Create new day from today
      const today = new Date();
      // Calc end date
      const end = d3.timeMonth.offset(today, 1);

      // Create array for each day
      const daysArray = d3.timeDay.range(today, end);
      // Format each day to defined date & array to hold liquidation-events
      const formatDays = daysArray.map((date) => ({
        day: parseInt(d3.timeFormat("%d")(date)),
        month: d3.timeFormat("%b")(date).toLowerCase(),
        year: parseInt(d3.timeFormat("%Y")(date)),
        // Each date will only display 3 hours. TimeMap will later replace this empty array.
        // Each obj has a time, and they will be put in the most fitting array.
        events: {
          2: [],
          10: [],
          18: [],
        },
      }));

      return formatDays;
    };

    const formattedMonth = DateObj();

    const hourBuckets = [2, 10, 18];

    coinEntry.objs.forEach((e) => {
      const d = new Date(Number(e.timestamp));
      const hour = d.getHours();
      const day = d.getDate();
      const month = d3.timeFormat("%b")(d).toLowerCase();

      const bucket = [...hourBuckets].reverse().find((h) => hour >= h) || 18;
      const dayEntry = formattedMonth.find(
        (entry) => entry.month === month && Number(entry.day - 1) === day, // switch in future - data is old so it is '-' the amount of data it needs
      );

      if (dayEntry) {
        dayEntry.events[bucket].push(e);
      }
    });

    return {
      symbol: coinEntry.symbol,
      amount: coinEntry.amount,
      liquidated: coinEntry.liquidated,
      dates: formattedMonth,
    };
  };

  const sortCoins = () => {
    if (!data) return;

    const mappedCoins = new Map();

    data.data.forEach((obj) => {
      const symbol = obj.symbol;

      const existing = mappedCoins.get(symbol);

      if (!existing) {
        mappedCoins.set(symbol, {
          symbol: symbol,
          amount: 1,
          liquidated: obj.amount * obj.price,
          objs: [obj],
        });
      } else {
        existing.amount += 1;
        existing.liquidated += obj.amount * obj.price;
        existing.objs.push(obj);
      }
    });

    return Array.from(mappedCoins);
  };

  const sortedCoins = sortCoins();

  const coinsSortedByDate = sortedCoins?.map(([o, a]) => sortTimes(a));
  console.log(coinsSortedByDate);

  const margin = { top: 30, right: 30, bottom: 30, left: 30 },
    width = 450 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

  const svg = d3
    .select(".svgContainer")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + margin.top})`);

  return <div className="svgContainer" />;
};

export default LiquidationHeatmap;
