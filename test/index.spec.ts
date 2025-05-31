import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to simulate successful spawn
const spawnMock = vi.fn(() => ({
  on: (event: string, cb: (arg?: any) => void) => {
    if (event === 'close') {
      cb(0);
    }
  }
}));

// Mock fs methods to avoid filesystem side effects
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    writeFileSync: vi.fn()
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
    const envMod = await import('../src/commands/createEnv');
    const createEnvMock = vi.spyOn(envMod, 'createEnv').mockResolvedValue(undefined);
    process.argv = ['node', 'create-launchapp', 'myapp', '--branch', 'dev', '--install', '--create-env'];

    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: 'dev', install: true });
    expect(createEnvMock).toHaveBeenCalledWith('myapp');
  });

  it('supports the create-env subcommand', async () => {
    const envMod = await import('../src/commands/createEnv');
    const createEnvMock = vi.spyOn(envMod, 'createEnv').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'create-env', 'proj'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(createEnvMock).toHaveBeenCalledWith('proj');
  });
});

describe('initProject', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock('../src/commands/initProject');
    vi.unmock('../src/commands/createEnv');
  });

  afterEach(async () => {
    const { setSpawn } = await import('../src/commands/initProject');
    const { spawn } = await import('child_process');
    setSpawn(spawn);
    vi.clearAllMocks();
    vi.unmock('../src/commands/createEnv');
  });

  it('executes git clone with branch', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock as any);
    await initProject('proj', { branch: 'feature' });

    expect(spawnMock).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://github.com/AudioGenius-ai/launchapp.dev.git', 'proj', '-b', 'feature'],
      { stdio: 'inherit' }
    );
  });
});

describe('createEnv', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes .env file', async () => {
    const fs = await import('fs');
    const writeSpy = fs.default.writeFileSync as any;
    const { createEnv } = await import('../src/commands/createEnv');

    createEnv('proj');

    expect(writeSpy).toHaveBeenCalledWith(
      require('path').join('proj', '.env'),
      expect.stringContaining('MY_ENV_VAR=123')
    );
  });
});
