import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// Helper to simulate successful spawn
const spawnMock = vi.fn(() => ({
  on: (event: string, cb: (arg?: any) => void) => {
    if (event === 'close') {
      cb(0);
    }
  }
}));

// Mock fs.existsSync to avoid filesystem side effects
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false)
  }
}));

describe('CLI argument parsing', () => {
  const originalArgv = process.argv.slice();
  let exitSpy: any;

  beforeEach(() => {
    vi.resetModules();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
  });

  afterEach(() => {
    process.argv = originalArgv.slice();
    exitSpy.mockRestore();
    vi.unmock('../src/commands/initProject');
    vi.unmock('../src/commands/createEnv');
  });

  it('passes options to initProject', async () => {
    const mod = await import('../src/commands/initProject');
    const initProjectMock = vi.spyOn(mod, 'initProject').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'myapp', '--branch', 'dev', '--install'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: 'dev', install: true, createEnv: false });
  });

  it('runs createEnv for subcommand', async () => {
    const mod = await import('../src/commands/createEnv');
    const createEnvMock = vi.spyOn(mod, 'createEnv').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'create-env', 'dir'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(createEnvMock).toHaveBeenCalledWith('dir');
  });

  it('passes --create-env to initProject', async () => {
    const mod = await import('../src/commands/initProject');
    const initProjectMock = vi.spyOn(mod, 'initProject').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'myapp', '--create-env'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: undefined, install: false, createEnv: true });
  });
});

describe('initProject', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock('../src/commands/initProject');
  });

  afterEach(async () => {
    const { setSpawn } = await import('../src/commands/initProject');
    const { spawn } = await import('child_process');
    setSpawn(spawn);
    vi.clearAllMocks();
  });

  it('executes git clone with branch', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', { branch: 'feature' });

    expect(spawnMock).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://github.com/launchapp/launchapp.git', 'proj', '-b', 'feature'],
      { stdio: 'inherit' }
    );
  });

  it('calls createEnv when option enabled', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    const createEnvMod = await import('../src/commands/createEnv');
    const createEnvSpy = vi.spyOn(createEnvMod, 'createEnv').mockResolvedValue(undefined);
    setSpawn(spawnMock);

    await initProject('proj', { createEnv: true });

    expect(createEnvSpy).toHaveBeenCalledWith(path.resolve('proj'));
  });
});
