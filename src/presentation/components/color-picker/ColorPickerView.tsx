import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPickerLayoutOrientation } from "@/domain/color/ColorPickerLayout";
import {
  useColorPickerState,
  type ColorPickerState,
} from "@/presentation/hooks/useColorPickerState";
import { focusCanvasKeyboard } from "@/presentation/utils/canvasKeyboardFocus";
import { ColorPickerHeader } from "./ColorPickerHeader";
import { ColorPickerPanel } from "./ColorPickerPanel";

interface ColorPickerViewProps {
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  orientation: ColorPickerLayoutOrientation;
  headerVariant: "popover" | "floating";
  onDetach?: () => void;
  onClose?: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

export function ColorPickerView({
  currentColor,
  onChange,
  orientation,
  headerVariant,
  onDetach,
  onClose,
  onHeaderMouseDown,
}: ColorPickerViewProps) {
  const pickerState = useColorPickerState({ currentColor, onChange });

  const handleCommitHexInput = () => {
    pickerState.commitHexInput();
    focusCanvasKeyboard();
  };

  return (
    <>
      <ColorPickerHeader
        variant={headerVariant}
        currentColor={currentColor}
        hexInput={pickerState.hexInput}
        setHexInput={pickerState.setHexInput}
        onCommitHexInput={handleCommitHexInput}
        onDetach={onDetach}
        onClose={onClose}
        onHeaderMouseDown={onHeaderMouseDown}
      />
      <ColorPickerPanel
        currentColor={currentColor}
        orientation={orientation}
        state={pickerState}
      />
    </>
  );
}

export type { ColorPickerState };
