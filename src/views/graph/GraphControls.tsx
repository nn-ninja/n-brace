import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FlipVertical,
  FlipVertical2,
  Sun,
  Sunrise,
} from "lucide-react";
import "@/views/graph/GraphControls.css";
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
          {isDescending ? <FlipVertical /> : <FlipVertical2 />}
        </button>
        <button onClick={handleHidden} title={isHidden ? "Show" : "Hide"}>
          {isHidden ? <Sun /> : <Sunrise />}
        </button>
        {!isHidden && (
          <>
            <button onClick={onPanUp} title="Descend">
              <ArrowUp />
            </button>
            <button onClick={onPanDown} title="Go Back">
              <ArrowDown />
            </button>
            <button onClick={onPanLeft} title="Anti Clockwise">
              <ArrowLeft />
            </button>
            <button onClick={onPanRight} title="Clockwise">
              <ArrowRight />
            </button>
          </>
        )}
      </div>
    </>
  );
};
