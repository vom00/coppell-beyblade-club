import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// Remotion's bundler ignores tsconfig paths, so the @/ alias SnapCN uses is set here too.
Config.overrideBundlerConfig((config) => {
  const withTw = enableTailwind(config);
  return {
    ...withTw,
    resolve: { ...withTw.resolve, alias: { ...(withTw.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") } },
  };
});

// Windows cannot start an .exe whose path is 260 characters or longer, and a deep checkout puts
// Remotion's own headless browser past that. Fall back to Microsoft Edge (or $EDGE) there.
const shell = path.join(process.cwd(), "node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
if (process.platform === "win32" && shell.length >= 260) {
  Config.setBrowserExecutable(process.env.EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe");
}
