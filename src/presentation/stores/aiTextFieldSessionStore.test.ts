import { describe, expect, it } from "vitest";
import { toPanelState } from "./aiTextFieldSessionStore";

describe("aiTextFieldSessionStore geometry helpers", () => {
  it("maps geometry to panel state fields", () => {
    expect(toPanelState({ x: 100, y: 120, width: 500, height: 600 })).toEqual({
      panelX: 100,
      panelY: 120,
      panelWidth: 500,
      panelHeight: 600,
    });
  });
});
