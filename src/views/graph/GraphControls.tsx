import React, { useEffect, useState } from "react";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp } from "react-icons/fa";
import "./GraphControls.css";
import { RiFlipVerticalFill, RiFlipVerticalLine } from "react-icons/ri";
import { PiSunHorizonBold } from "react-icons/pi";
import { IoSunny } from "react-icons/io5";
import { useAtomValue } from "jotai/react";
import { graphSettingsAtom } from "@/atoms/graphAtoms";

interface GraphControlsProps {
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  onDirectionToggle: () => void;
  isDescending: boolean;
  onMaxPathLengthChange: (maxPathLength: number) => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
  onDirectionToggle,
  isDescending,
  onMaxPathLengthChange,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const graphSettings = useAtomValue(graphSettingsAtom);
  const [maxPathLength, setMaxPathLength] = useState(graphSettings.graphSpan);

  const handleHidden = () => {
    setIsHidden((prev) => !prev);
  };

  const handleToggle = () => {
    if (onDirectionToggle) {
      onDirectionToggle();
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setMaxPathLength(value);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      onMaxPathLengthChange(maxPathLength);
    }, 1000);

    return () => clearTimeout(timeout); // Clear on value change or unmount
  }, [maxPathLength, onMaxPathLengthChange]);

  return (
    <>
      {!isHidden && (
        <div className="slider-control">
          <label htmlFor="max-path-length" title="Visisble graph span size">
            G-span {maxPathLength}
          </label>
          <input
            id="max-path-length"
            type="range"
            min="0"
            max="99"
            value={maxPathLength}
            onChange={handleSliderChange}
            aria-label="Visisble graph span size"
          />
        </div>
      )}
      <div className="pm-graph-controls">
        <button onClick={handleToggle} title="Flip direction (Ctrl)">
          {isDescending ? <RiFlipVerticalLine /> : <RiFlipVerticalFill />}
        </button>
        <button onClick={handleHidden} title={isHidden ? "Show" : "Hide"}>
          {isHidden ? <IoSunny /> : <PiSunHorizonBold />}
        </button>
        {!isHidden && (
          <>
            <button onClick={onPanUp} title="Descend">
              <FaArrowUp />
            </button>
            <button onClick={onPanDown} title="Go Back">
              <FaArrowDown />
            </button>
            <button onClick={onPanLeft} title="Anti Clockwise">
              <FaArrowLeft />
            </button>
            <button onClick={onPanRight} title="Clockwise">
              <FaArrowRight />
            </button>
          </>
        )}
      </div>
    </>
  );
};
