import { useState } from "react";

const DropDownMenu = ({
  data,
  action,
  default: defaultIndex,
}: {
  data: string[];
  action: (e: React.MouseEvent<HTMLButtonElement>) => void;
  default: number;
}) => {
  const [displayDays, setDisplayDays] = useState(false);
  const [label, setLabel] = useState<string>(() => data[defaultIndex]);

  return (
    <div
      onClick={() => setDisplayDays(!displayDays)}
      className="relative z-10 w-full text-white flex justify-center"
    >
      <button
        className="cursor-pointer w-full h-full bg-[#151b2b] p-2 rounded-sm"
        onClick={() => setDisplayDays(!displayDays)}
        style={{ border: "1px solid gray" }}
      >
        {label}
      </button>
      <div
        className="absolute flex flex-col items-left w-25 top-10 bg-[#151b2b] rounded-sm"
        style={{
          opacity: `${displayDays ? "1" : "0"}`,
          visibility: `${displayDays ? "visible" : "hidden"}`,
          border: "1px solid gray",
        }}
      >
        {data.map((a, i) => (
          <button
            key={i}
            className="cursor-pointer text-left p-2 hover:bg-[rgba(123,133,160,0.597)]"
            onClick={(e) => {
              setDisplayDays(false);
              setLabel(a);
              action(e);
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DropDownMenu;
