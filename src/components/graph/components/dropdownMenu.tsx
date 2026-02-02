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
      className="relative z-10 text-white flex justify-center"
    >
      <button
        className="cursor-pointer px-2.5 py-1 w-full bg-[#151b2b] rounded-sm"
        onClick={() => setDisplayDays(!displayDays)}
        style={{ border: "1px solid gray" }}
      >
        {label}
      </button>
      <div
        className="absolute flex flex-col items-left w-full top-13 bg-[#151b2b] rounded-sm"
        style={{
          opacity: `${displayDays ? "1" : "0"}`,
          visibility: `${displayDays ? "visible" : "hidden"}`,
          border: "1px solid gray",
        }}
      >
        {data.map((a, i) => (
          <button
            key={i}
            className="cursor-pointer text-left p-1.5 hover:bg-[rgba(123,133,160,0.597)]"
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
