import axios from "axios";

const fetchData = async (link: string) => {
  const { data } = await axios.get(link);
  await new Promise((r) => setTimeout(r, 1000));

  return data;
};

export default fetchData;
