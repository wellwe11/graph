import { useEffect, useState } from "react";

const useFetch = (link: string) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetcher = async () => {
      setIsLoading(true);
      setError(false);

      try {
        const req = await fetch(link, { signal: controller.signal });
        if (!req.ok) {
          setError(true);
          return;
        }

        const fetchedData = await req.json();
        setData(fetchedData);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error(`Error fetching data: ${err}`);
          setError(true);
        }
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetcher();

    return () => controller.abort();
  }, [link]);

  return [data, isLoading, error];
};

export default useFetch;
