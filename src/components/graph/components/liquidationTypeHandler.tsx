import DropDownMenu from "./dropdownMenu";

const LiquidationTypeHandler = ({
  setLiquidationType,
}: {
  setLiquidationType: React.Dispatch<
    React.SetStateAction<"value" | "openInterest">
  >;
}) => {
  const types = ["Open Interest", "Market Cap"];

  const handleTypechange = (e: React.MouseEvent<HTMLButtonElement>) => {
    const text = (e.target as HTMLElement).textContent as string;

    if (text.toLowerCase() === "open interest") {
      setLiquidationType("openInterest");
    } else {
      setLiquidationType("value");
    }
  };

  return <DropDownMenu data={types} action={handleTypechange} default={0} />;
};

export default LiquidationTypeHandler;
