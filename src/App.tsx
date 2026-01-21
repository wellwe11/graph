import classes from "./App.module.scss";
import Graph from "./components/graph/graph";
import useFetch from "./hooks/useFetch";

function App() {
  const [data, isLoading, error] = useFetch("/data.json");

  if (isLoading)
    return (
      <div>
        <h1>Data is loading</h1>
      </div>
    );

  if (error)
    return (
      <div>
        <h1>Failed to fetch data</h1>
      </div>
    );

  return <div className={classes.app}>{data && <Graph data={data} />}</div>;
}

export default App;
