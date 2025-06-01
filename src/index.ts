#!/usr/bin/env node
import { initProject } from './commands/initProject';
import { createEnv } from './commands/createEnv';

function showHelp() {
  console.log(`Usage:`);
  console.log(`  create-launchapp <project-name> [--branch <branch>] [--install] [--create-env]`);
  console.log(`  create-launchapp create-env <projectDir>`);
}

async function main() {
  const args = process.argv.slice(2);
  const first = args[0];

  if (first === 'create-env') {
    const projectDir = args[1];
    if (!projectDir || projectDir.startsWith('--')) {
      console.error('Error: projectDir is required.');
      showHelp();
      process.exit(1);
    }
    try {
      await createEnv(projectDir);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
    return;
  }

  const projectName = first;

  if (!projectName || projectName.startsWith('--')) {
    console.error('Error: project-name is required.');
    showHelp();
    process.exit(1);
  }

  let branch: string | undefined;
  let install = false;
  let createEnvFlag = false;

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
    } else if (arg === '--create-env') {
      createEnvFlag = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    await initProject(projectName, { branch, install, createEnv: createEnvFlag });
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
