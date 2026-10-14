// Stage 5 register R5.3 E-15 (operator instruction): the Vercel function must carry pdfjs-dist. src/pdf.ts resolves
// it at module load through createRequire(...).resolve, which Vercel's file tracing does not follow, so without it
// every function route failed with "Cannot find module 'pdfjs-dist/package.json'". Offline: reads vercel.json only.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

describe("vercel.json function bundle (E-15, F-10)", () => {
  it("the function includes node_modules/pdfjs-dist with data, config and public/stories; maxDuration and the rewrites are unchanged", () => {
    const v = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    expect(Object.keys(v.functions)).toEqual(["api/index.ts"]);
    const fn = v.functions["api/index.ts"];
    expect(fn.includeFiles).toBe("{data,config,public/stories,node_modules/pdfjs-dist}/**");
    expect(fn).toEqual({ maxDuration: 300, includeFiles: "{data,config,public/stories,node_modules/pdfjs-dist}/**" });
    expect(v.outputDirectory).toBe("public");
    expect(v.rewrites).toEqual([{ source: "/api/(.*)", destination: "/api/index" }, { source: "/health", destination: "/api/index" }]);
    // The module the function cannot trace is the one src/pdf.ts resolves at load.
    expect(readFileSync(path.join(ROOT, "src", "pdf.ts"), "utf8")).toContain('localRequire.resolve("pdfjs-dist/package.json")');
  });
});
