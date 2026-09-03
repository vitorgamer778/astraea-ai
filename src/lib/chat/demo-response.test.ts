import { describe, expect, it } from "vitest";
import { createDemoResponse } from "./demo-response";

describe("createDemoResponse", () => {
  it("returns a transparent default demo response", () => {
    const response = createDemoResponse("Olá");
    expect(response).toContain("Astraea Demo");
    expect(response).toContain("não foi enviada");
  });

  it("returns a formatted technical demonstration", () => {
    expect(createDemoResponse("Mostre código TypeScript")).toContain("```ts");
  });
});
