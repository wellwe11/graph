import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { sliderBottom } from "d3-simple-slider";
import fetchData from "../../functions/useFetch";

import classes from "./graph.module.scss";
import LiquidationHeatmap from "./liquidationHeatmap";
import TestGraph from "./testGraph";
import HeatMap from "./testHeatMap";

const Graph = () => {
  return (
    <>
      <HeatMap />
      {/* <TestGraph /> */}
      {/* <LiquidationHeatmap /> */}
    </>
  );
};

export default Graph;
