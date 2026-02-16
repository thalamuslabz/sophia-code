import { Command } from "commander";
import chalk from "chalk";
import { checkVersion, performUpdate, isUpdateAvailable } from "../core/version-manager.js";

export const updateCommand = new Command("update")
  .description("Check for updates and install the latest version")
  .option("-c, --check", "Only check for updates, don't install")
  .option("-f, --force", "Force update even if already on latest version")
  .action(async (options: { check?: boolean; force?: boolean }) => {
    console.log();

    if (options.check) {
      // Just check, don't update
      console.log(chalk.blue("🔍 Checking for updates..."));
      console.log();

      const info = await checkVersion();

      console.log(`  Local version:  ${chalk.cyan(info.local)}`);
      console.log(`  Latest version: ${chalk.cyan(info.latest)}`);
      console.log(`  Minimum required: ${chalk.cyan(info.minimum)}`);
      console.log();

      if (info.versionsBehind === 0) {
        console.log(chalk.green("✅ You are on the latest version!"));
      } else {
        console.log(
          chalk.yellow(
            `⚠️  You are ${info.versionsBehind} version${info.versionsBehind > 1 ? "s" : ""} behind.`
          )
        );

        if (info.isLocked) {
          console.log();
          console.log(chalk.red("🔒 This version is LOCKED and must be updated."));
        }

        console.log();
        console.log(chalk.dim("Run 'sophia update' to install the latest version."));
      }

      console.log();
      return;
    }

    // Perform update
    if (!options.force) {
      const hasUpdate = await isUpdateAvailable();

      if (!hasUpdate) {
        console.log(chalk.green("✅ You are already on the latest version!"));
        console.log(chalk.dim(`   Version: ${chalk.cyan((await checkVersion()).local)}`));
        console.log();
        console.log(chalk.dim("Use --force to reinstall anyway."));
        console.log();
        return;
      }
    }

    const success = await performUpdate();
    process.exit(success ? 0 : 1);
  });
