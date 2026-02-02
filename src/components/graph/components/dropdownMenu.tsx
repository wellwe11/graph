import { useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setDisplayDays(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={() => setDisplayDays(!displayDays)}
      className="relative z-10 text-white"
    >
      <button
        className="cursor-pointer bg-[#151b2b] rounded-sm h-8.5 px-5 w-full"
        onClick={() => setDisplayDays(!displayDays)}
        style={{ border: "1px solid gray" }}
      >
        {label}
      </button>
      <div
        className="absolute text-nowrap flex flex-col items-left top-10 bg-[#151b2b] rounded-sm w-full"
        style={{
          opacity: `${displayDays ? "1" : "0"}`,
          visibility: `${displayDays ? "visible" : "hidden"}`,
          border: "1px solid gray",
        }}
      >
        {data.map((a, i) => (
          <button
            key={i}
            className="cursor-pointer text-left px-2.5 py-1 hover:bg-[rgba(123,133,160,0.597)]"
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
