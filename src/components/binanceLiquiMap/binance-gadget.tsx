import Gradient from "./components/gradient";
import HeatMap from "./components/Heatmap";
import LiquidationMap from "./components/LiquidationMap";
import Nav from "./components/nav";
import TimeLapsChart from "./components/timeLapsChart";

const BinanceGadget = () => {
  return (
    <div>
      <h1>This is BinanceGadget</h1>
      <div>
        <Nav />
      </div>

      <div>
        <Gradient />
      </div>

      <div>
        <div>
          <HeatMap />
          <TimeLapsChart />
        </div>
        <LiquidationMap />
      </div>
    </div>
  );
};

export default BinanceGadget;
