import type { LuminancePaletteGroup } from "@/domain/luminancePalette/LuminancePaletteGroup";

import { LuminancePaletteSwatchCell } from "./LuminancePaletteSwatchCell";



interface LuminancePaletteGroupPreviewProps {

  group: LuminancePaletteGroup;

}



export function LuminancePaletteGroupPreview({ group }: LuminancePaletteGroupPreviewProps) {

  if (group.colors.length === 0) {

    return (

      <span className="text-[10px] text-zinc-500" aria-hidden>

        空

      </span>

    );

  }



  return (

    <div className="flex flex-row gap-1" aria-hidden>

      {group.colors.map((swatch) => (

        <LuminancePaletteSwatchCell

          key={swatch.hex}

          mode="preview"

          swatch={swatch}

          interactive={false}

        />

      ))}

    </div>

  );

}



/** @deprecated Use LuminancePaletteGroupPreview */

export const LuminancePaletteColumnPreview = LuminancePaletteGroupPreview;

