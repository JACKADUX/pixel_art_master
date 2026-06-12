import { useEffect, useState } from "react";

export function useAltKeyHeld(): boolean {
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const syncAltState = (event: KeyboardEvent | MouseEvent) => {
      setAltHeld(event.altKey);
    };

    const resetAltState = () => {
      setAltHeld(false);
    };

    window.addEventListener("keydown", syncAltState);
    window.addEventListener("keyup", syncAltState);
    window.addEventListener("blur", resetAltState);

    return () => {
      window.removeEventListener("keydown", syncAltState);
      window.removeEventListener("keyup", syncAltState);
      window.removeEventListener("blur", resetAltState);
    };
  }, []);

  return altHeld;
}
