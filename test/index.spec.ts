import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
    existsSync: vi.fn().mockReturnValue(false),
    promises: {
      rm: vi.fn().mockResolvedValue(undefined)
    }
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

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: 'dev', install: true });
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

  it('executes git clone and reinitializes repository', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', { branch: 'feature' });

    expect(spawnMock).toHaveBeenNthCalledWith(1,
      'git',
      ['clone', 'https://github.com/launchapp/launchapp.git', 'proj', '-b', 'feature'],
      { stdio: 'inherit' }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(2,
      'git',
      ['init'],
      { stdio: 'inherit', cwd: expect.stringContaining('proj') }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(3,
      'git',
      ['add', '.'],
      { stdio: 'inherit', cwd: expect.stringContaining('proj') }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(4,
      'git',
      ['commit', '-m', 'Initial commit'],
      { stdio: 'inherit', cwd: expect.stringContaining('proj') }
    );
  });

  it('installs dependencies with pnpm when requested', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', { install: true });

    expect(spawnMock).toHaveBeenLastCalledWith(
      'pnpm',
      ['install'],
      { stdio: 'inherit', cwd: expect.stringContaining('proj') }
    );
  });
});
