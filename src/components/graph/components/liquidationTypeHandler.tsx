import DropDownMenu from "./dropdownMenu";

const LiquidationTypeHandler = ({
  handler,
}: {
  handler: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const types = ["Open Interest", "Market Cap"];

  return <DropDownMenu data={types} action={handler} default={0} />;
};

export default LiquidationTypeHandler;
