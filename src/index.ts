#!/usr/bin/env node
import { initProject } from './commands/initProject';
import { createEnv } from './commands/createEnv';

function showHelp() {
  console.log(`Usage: create-launchapp <project-name> [--branch <branch>] [--install] [--env]`);
}

async function main() {
  const args = process.argv.slice(2);
  const projectName = args[0];

  if (!projectName || projectName.startsWith('--')) {
    console.error('Error: project-name is required.');
    showHelp();
    process.exit(1);
  }

  let branch: string | undefined;
  let install = false;
  let env = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--branch') {
      if (i + 1 >= args.length) {
        console.error('Error: --branch requires a value.');
        showHelp();
        process.exit(1);
      }
      branch = args[++i];
    } else if (arg === '--install') {
      install = true;
    } else if (arg === '--env') {
      env = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    await initProject(projectName, { branch, install });
    if (env) {
      createEnv(projectName);
    }
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
