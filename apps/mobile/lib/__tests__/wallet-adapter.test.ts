import { describe, it, expect } from "@jest/globals";

// We can't import APP_IDENTITY directly since it's not exported,
// so we test the module-level constant by reading the source
describe("APP_IDENTITY", () => {
  it("icon is a relative URI (required by MWA spec)", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(
      path.join(__dirname, "..", "wallet-adapter.ts"),
      "utf-8"
    );
    expect(source).toContain('icon: "/');
  });

  it("uri is a valid https URL", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(
      path.join(__dirname, "..", "wallet-adapter.ts"),
      "utf-8"
    );
    expect(source).toContain('uri: "https://thecommunication.link"');
  });

  it('name is "Midnight"', () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(
      path.join(__dirname, "..", "wallet-adapter.ts"),
      "utf-8"
    );
    expect(source).toContain('name: "Midnight"');
  });
});
