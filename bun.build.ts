import { Command } from "commander";
import { watch } from "fs";

type BuildConfig = {
  publicDir: string;
  sourceDir: string;
  outDir: string;
  sourceMap?: "none" | "inline" | "external";
};

const build = (config: BuildConfig) =>
  Bun.build({
    entrypoints: ["./src/background/index.ts"],
    outdir: config.outDir,
    target: "browser",
    sourcemap: config.sourceMap ?? "none",
    minify: true,
  });

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
