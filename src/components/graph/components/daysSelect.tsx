import DropDownMenu from "./dropdownMenu";

const DaysSelect = ({
  setActiveDay,
}: {
  setActiveDay: (days: number) => void;
}) => {
  const days = [
    "1 day",
    "1 week",
    "2 week",
    "30 day",
    "3 month",
    "6 month",
    "1 year",
  ];

  const handleDays = (e: React.MouseEvent<HTMLButtonElement>) => {
    const text = (e.target as HTMLElement).textContent;
    console.log("asd");

    switch (text) {
      case "1 day":
        setActiveDay(1);
        break;
      case "1 week":
        setActiveDay(7);
        break;
      case "2 week":
        setActiveDay(14);
        break;
      case "30 day":
        setActiveDay(30);
        break;
      case "3 month":
        setActiveDay(90);
        break;
      case "6 month":
        setActiveDay(182);
        break;
      case "1 year":
        setActiveDay(365);
        break;
      default:
        console.error(" -- testHeatMap > handleDays -- does not return a day");
        setActiveDay(7);
    }
  };

  return <DropDownMenu data={days} action={handleDays} default={3} />;
};

export default DaysSelect;
