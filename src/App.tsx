import classes from "./App.module.scss";
import useFetch from "./hooks/useFetch";

const Graph = ({ data }) => {
  return (
    <div className={classes.graph}>
      <div className={classes.container}>
        <h1>This is a graph</h1>
      </div>
    </div>
  );
};

function App() {
  const [data, isLoading, wasSuccess] = useFetch("/data.json");

  if (isLoading)
    return (
      <div>
        <h1>Data is loading</h1>
      </div>
    );

  if (!wasSuccess)
    return (
      <div>
        <h1>Failed to fetch data</h1>
      </div>
    );

  return (
    <div className={classes.app}>
      <Graph data={data} />
    </div>
  );
}

export default App;
