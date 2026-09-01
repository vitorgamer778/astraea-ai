import { describe, expect, it } from "vitest";
import { shouldSubmitMessage } from "./keyboard";

describe("shouldSubmitMessage", () => {
  it("submits on Enter", () => expect(shouldSubmitMessage({ key: "Enter", shiftKey: false, isComposing: false })).toBe(true));
  it("keeps a newline on Shift+Enter", () => expect(shouldSubmitMessage({ key: "Enter", shiftKey: true, isComposing: false })).toBe(false));
  it("does not submit during IME composition", () => expect(shouldSubmitMessage({ key: "Enter", shiftKey: false, isComposing: true })).toBe(false));
});
