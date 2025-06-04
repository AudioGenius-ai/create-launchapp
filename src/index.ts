import { initProject } from './commands/initProject';
import { createEnv } from './commands/createEnv';

function showHelp() {
  console.log(
    `Usage: create-launchapp <project-name> [--branch <branch>] [--install] [--worktree] [--create-env]\n` +
      `       create-launchapp create-env <project-name>`
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'create-env') {
    const project = args[1];
    if (!project) {
      console.error('Error: project-name is required for create-env.');
      showHelp();
      process.exit(1);
    }
    await createEnv(project);
    return;
  }

  const projectName = args[0];

  if (!projectName || projectName.startsWith('--')) {
    console.error('Error: project-name is required.');
    showHelp();
    process.exit(1);
  }

  let branch: string | undefined;
  let install = false;
  let worktree = false;
  let createEnvAfter = false;

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
    } else if (arg === '--worktree') {
      worktree = true;
    } else if (arg === '--create-env') {
      createEnvAfter = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    await initProject(projectName, { branch, install, worktree });
    if (createEnvAfter) {
      await createEnv(projectName);
    }
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
