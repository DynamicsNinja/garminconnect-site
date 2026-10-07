import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const LIB = path.join(process.cwd(), "node_modules", "garminconnect-js");
const MCP = path.join(process.cwd(), "node_modules", "@dynamicsninja", "garminconnect-mcp");

export interface SourceFile { pkg: "lib" | "mcp"; repoPath: string; text: string }

export function libVersion(): string {
  return (JSON.parse(readFileSync(path.join(LIB, "package.json"), "utf8")) as { version: string }).version;
}

export function readSource(repoPath: string): SourceFile {
  if (repoPath === "mcp/README.md") return { pkg: "mcp", repoPath, text: readFileSync(path.join(MCP, "README.md"), "utf8") };
  return { pkg: "lib", repoPath, text: readFileSync(path.join(LIB, ...repoPath.split("/")), "utf8") };
}

export function apiCategoryFiles(): string[] {
  return readdirSync(path.join(LIB, "docs", "api")).filter((f) => f.endsWith(".md") && f !== "README.md").sort().map((f) => `docs/api/${f}`);
}
