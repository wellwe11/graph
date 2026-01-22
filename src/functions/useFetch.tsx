import axios from "axios";

const fetchData = async (link: string) => {
  const { data } = await axios.get(link);

  return data;
};

export default fetchData;
