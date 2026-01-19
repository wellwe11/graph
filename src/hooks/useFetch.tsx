import { useEffect, useState } from "react";

const useFetch = (link: string) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetcher = async () => {
      setIsLoading(true);

      try {
        const req = await fetch(link);
        if (!req.ok) return;

        const fetchedData = await req.json();
        setData(fetchedData);
        setWasSuccess(true);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error(`Error fetching data: ${error}`);
        }
        setWasSuccess(false);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetcher();

    return () => controller.abort();
  }, []);

  return [data, isLoading, wasSuccess];
};

export default useFetch;
