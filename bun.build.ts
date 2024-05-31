import { Command } from "commander";
import { watch } from "fs";
import path from "path";
import manifest from "./src/manifest";

type BuildConfig = {
  publicDir: string;
  sourceDir: string;
  outDir: string;
  sourceMap?: "none" | "inline" | "external";
};

const build = async (config: BuildConfig) => {
  // manifest.json
  await Bun.write(`${config.outDir}/manifest.json`, JSON.stringify(manifest));

  const buildOptions = {
    outdir: path.join(config.outDir, "scripts"),
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  };

  // background
  await Bun.build({
    entrypoints: ["./src/background/background.ts"],
    outdir: path.join(config.outDir, "scripts"),
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  });

  // content_scripts
  await Bun.build({
    entrypoints: [
      "./src/content_scripts/authorize.ts",
      "./src/content_scripts/gfg.ts",
      "./src/content_scripts/leetcode.ts",
    ],
    outdir: path.join(config.outDir, "scripts"),
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  });

  // popup
  await Bun.build({
    entrypoints: ["./src/popup/oauth2.ts", "./src/popup/popup.ts"],
    outdir: path.join(config.outDir, "scripts"),
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  });

  // tabs
  await Bun.build({
    entrypoints: ["./src/tabs/welcome.ts"],
    outdir: path.join(config.outDir, "scripts"),
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  });

  // css
  const popupCss = Bun.file("./src/popup/popup.css");
  await Bun.write(`${config.outDir}/css/popup.css`, popupCss);

  const welcomeCss = Bun.file("./src/tabs/welcome.css");
  await Bun.write(`${config.outDir}/css/welcome.css`, welcomeCss);

  // html
  const popupHtml = Bun.file("./src/popup/popup.html");
  await Bun.write(`${config.outDir}/popup.html`, popupHtml);

  const welcomeHtml = Bun.file("./src/tabs/welcome.html");
  await Bun.write(`${config.outDir}/welcome.html`, welcomeHtml);

  // icons
  const icons = manifest.icons;
  if (!icons) {
    console.error("No icons found in manifest");
  } else {
    Object.entries(icons).map(async ([size, path]) => {
      const file = Bun.file(`${config.publicDir}/${path}`);
      await Bun.write(`${config.outDir}/${path}`, file);
    });
  }
};

const program = new Command();
program
  .option("--watch", "Watch for file changes", false)
  .option("--source <dir>", "Source directory", "src")
  .option("--out <dir>", "Output directory", "dist");
program.parse(process.argv);
const options = program.opts();

const buildConfig: BuildConfig = {
  publicDir: "public",
  sourceDir: options.source,
  outDir: options.out,
};

if (options.watch) {
  console.log("Watching for file changes (Ctrl-C to exit)");
  const watcher = watch(
    options.source,
    { recursive: true },
    async (event, filename) => {
      console.log(`Detected ${event} in ${filename}`);
      await build({ ...buildConfig, sourceMap: "inline" });
      console.log("Build complete");
    }
  );
  process.on("SIGINT", () => {
    console.log("Closing watcher...");
    watcher.close();
    process.exit(0);
  });
} else {
  console.log("Building...");
  build(buildConfig);
  console.log("Build complete");
}
