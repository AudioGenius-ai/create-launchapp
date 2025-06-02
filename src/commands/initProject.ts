import { spawn } from 'child_process';

// Allow overriding spawn for testing
export let spawnFn = spawn;
export function setSpawn(fn: typeof spawn) {
  spawnFn = fn;
}
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface InitOptions {
  branch?: string;
  install?: boolean;
  worktree?: boolean;
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

  const repoUrl = 'https://github.com/launchapp/launchapp.git';

  if (options.worktree) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launchapp-'));
    await run('git', ['clone', '--bare', repoUrl, tmpDir]);
    const wtArgs = ['worktree', 'add', path.resolve(projectName)];
    if (options.branch) {
      wtArgs.push(options.branch);
    }
    await run('git', wtArgs, { cwd: tmpDir });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } else {
    const args = ['clone', repoUrl, projectName];
    if (options.branch) {
      args.push('-b', options.branch);
    }

    await run('git', args);
  }

  if (options.install) {
    await run('npm', ['install'], { cwd: path.resolve(projectName) });
  }
}
