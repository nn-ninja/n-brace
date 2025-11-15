import { useRef } from "react";

import type { KeyboardEvent } from "react";

interface NavigationHandlers {
  handlePanUp: () => void;
  handlePanDown: () => void;
  handlePanLeft: () => void;
  handlePanRight: () => void;
  handleDirectionToggle: () => void;
}

export function useGraphKeyboard(navigation: NavigationHandlers) {
  const changedDescendingDuringCtrl = useRef(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Control":
        navigation.handleDirectionToggle();
        event.preventDefault();
        break;
      case "ArrowUp":
        navigation.handlePanUp();
        event.preventDefault();
        break;
      case "ArrowDown":
        navigation.handlePanDown();
        event.preventDefault();
        break;
      case "ArrowLeft":
        navigation.handlePanLeft();
        event.preventDefault();
        break;
      case "ArrowRight":
        navigation.handlePanRight();
        event.preventDefault();
        break;
      default:
        break;
    }

    if (event.ctrlKey) {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          changedDescendingDuringCtrl.current = true;
          break;
        default:
          break;
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (changedDescendingDuringCtrl.current && event.key === "Control") {
      changedDescendingDuringCtrl.current = false;
      navigation.handleDirectionToggle();
      event.preventDefault();
    }
  };

  return { handleKeyDown, handleKeyUp };
}
