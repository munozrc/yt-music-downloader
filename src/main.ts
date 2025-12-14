#!/usr/bin/env node
import { buildContainer } from "./bootstrap/container.js";

async function main() {
  const { cliApplication } = await buildContainer();
  cliApplication.run(process.argv);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
