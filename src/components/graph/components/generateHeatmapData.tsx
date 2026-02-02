import * as d3 from "d3";

import { type DataObj } from "../testHeatMap";

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

export default generateHeatmapData;
