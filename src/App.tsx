import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import classes from "./App.module.scss";
import Graph from "./components/graph/graph";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// initiate queryClient
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
      {/* Wrap components inside of client */}
      <div className={classes.app}>{<Graph />}</div>;
      {/* Enable devtools visulation of queries */}
      <ReactQueryDevtools initialIsOpen={false} />{" "}
    </QueryClientProvider>
  );
}

export default App;
