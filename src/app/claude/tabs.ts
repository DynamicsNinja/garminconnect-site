export const TABS = [
  { id: "web", label: "claude.ai & mobile" },
  { id: "desktop", label: "Claude Desktop" },
  { id: "code", label: "Claude Code" },
  { id: "other", label: "Other MCP clients" },
] as const;
export type TabId = (typeof TABS)[number]["id"];
