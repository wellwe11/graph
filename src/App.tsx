import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import classes from "./App.module.scss";
import Graph from "./components/graph/graph";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BinanceGadget from "./components/binanceLiquiMap/binance-gadget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={classes.app}>
        {/* <Graph /> */}
        <BinanceGadget />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />{" "}
    </QueryClientProvider>
  );
}

export default App;
