import { spawn } from 'child_process';

// Allow overriding spawn for testing
export let spawnFn = spawn;
export function setSpawn(fn: typeof spawn) {
  spawnFn = fn;
}
import fs from 'fs';
import path from 'path';

export interface InitOptions {
  branch?: string;
  install?: boolean;
}

export function run(command: string, args: string[], options: { cwd?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawnFn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

export async function initProject(projectName: string, options: InitOptions) {
  if (fs.existsSync(projectName)) {
    throw new Error(`Directory ${projectName} already exists.`);
  }

  const repoUrl = 'https://github.com/AudioGenius-ai/launchapp.dev.git';
  const args = ['clone', repoUrl, projectName];
  if (options.branch) {
    args.push('-b', options.branch);
  }

  await run('git', args);

  if (options.install) {
    await run('pnpm', ['install'], { cwd: path.resolve(projectName) });
  }
}
