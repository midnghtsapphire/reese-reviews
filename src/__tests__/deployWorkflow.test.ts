import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guards against corrupted deploy workflow merges.
 * A previous auto-bot commit concatenated two workflow documents into one file,
 * producing duplicate top-level keys and a broken job graph (deploy-pages needed
 * `build` while deploy needed `ci`).
 */
describe("deploy workflow integrity", () => {
  const workflowPath = resolve(process.cwd(), ".github/workflows/deploy.yml");
  const source = readFileSync(workflowPath, "utf8");

  it("has a single workflow name", () => {
    const names = [...source.matchAll(/^name:\s*(.+)$/gm)].map((m) => m[1].trim());
    expect(names).toEqual(["Deploy to DigitalOcean"]);
  });

  it("declares a single on: trigger block at the top level", () => {
    // Count unindented `on:` keys (top-level only)
    const topLevelOn = [...source.matchAll(/^on:\s*$/gm)];
    expect(topLevelOn).toHaveLength(1);
  });

  it("uses a coherent job graph (ci -> deploy -> notify)", () => {
    expect(source).toMatch(/^\s{2}ci:/m);
    expect(source).toMatch(/^\s{2}deploy:/m);
    expect(source).toMatch(/^\s{2}notify:/m);
    expect(source).toMatch(/needs:\s*ci/);
    expect(source).toMatch(/needs:\s*deploy/);
    // Legacy broken job from the corrupted merge must stay gone
    expect(source).not.toMatch(/deploy-pages/);
    expect(source).not.toMatch(/needs:\s*build/);
  });

  it("runs lint, typecheck, test, and build in the CI gate", () => {
    expect(source).toMatch(/npm run lint/);
    expect(source).toMatch(/npm run typecheck/);
    expect(source).toMatch(/npm test/);
    expect(source).toMatch(/npm run build/);
  });

  it("does not embed a second workflow document mid-file", () => {
    expect(source).not.toMatch(/^name: Build & Deploy$/m);
    expect(source).not.toMatch(/node-version: '20\.x'/);
  });
});

describe("DigitalOcean app spec secrets", () => {
  const appPath = resolve(process.cwd(), ".do/app.yaml");
  const source = readFileSync(appPath, "utf8");

  it("does not commit plaintext secret values", () => {
    expect(source).not.toMatch(/sk-or-/);
    expect(source).not.toMatch(/value:\s*["']https?:\/\//);
    expect(source).toMatch(/type:\s*SECRET/);
  });
});
