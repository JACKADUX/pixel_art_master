import { describe, expect, it } from "vitest";
import { createChatMessage, toApiMessages } from "./ChatMessage";

describe("createChatMessage", () => {
  it("omits images when none provided", () => {
    const message = createChatMessage("user", "hello");
    expect(message.images).toBeUndefined();
    expect(message.role).toBe("user");
    expect(message.content).toBe("hello");
  });

  it("keeps images when provided", () => {
    const message = createChatMessage("user", "look", {
      images: ["data:image/png;base64,AAA"],
    });
    expect(message.images).toEqual(["data:image/png;base64,AAA"]);
  });

  it("uses provided id", () => {
    const message = createChatMessage("assistant", "", { id: "fixed-id" });
    expect(message.id).toBe("fixed-id");
  });
});

describe("toApiMessages", () => {
  it("serializes plain text messages as string content", () => {
    const messages = [createChatMessage("user", "hi")];
    expect(toApiMessages(messages)).toEqual([{ role: "user", content: "hi" }]);
  });

  it("serializes image messages as multimodal content parts", () => {
    const messages = [
      createChatMessage("user", "描述这张图片", {
        images: ["data:image/png;base64,AAA"],
      }),
    ];

    expect(toApiMessages(messages)).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "描述这张图片" },
          { type: "image_url", image_url: { url: "data:image/png;base64,AAA" } },
        ],
      },
    ]);
  });

  it("omits empty text part when only an image is present", () => {
    const messages = [
      createChatMessage("user", "   ", {
        images: ["data:image/jpeg;base64,BBB"],
      }),
    ];

    expect(toApiMessages(messages)).toEqual([
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: "data:image/jpeg;base64,BBB" } },
        ],
      },
    ]);
  });

  it("supports multiple images", () => {
    const messages = [
      createChatMessage("user", "compare", {
        images: ["data:image/png;base64,A", "data:image/png;base64,B"],
      }),
    ];

    expect(toApiMessages(messages)).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "compare" },
          { type: "image_url", image_url: { url: "data:image/png;base64,A" } },
          { type: "image_url", image_url: { url: "data:image/png;base64,B" } },
        ],
      },
    ]);
  });
});
