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
    mkdtempSync: vi.fn().mockReturnValue('/tmp/mock-repo'),
    rmSync: vi.fn()
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

    expect(initProjectMock).toHaveBeenCalledWith(
      'myapp',
      expect.objectContaining({ branch: 'dev', install: true, worktree: false })
    );
  });

  it('parses --worktree flag', async () => {
    const mod = await import('../src/commands/initProject');
    const initProjectMock = vi.spyOn(mod, 'initProject').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'app', '--worktree'];
    await import('../src/index');

    expect(initProjectMock).toHaveBeenCalledWith(
      'app',
      expect.objectContaining({ worktree: true })
    );
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

  it('uses git worktree when enabled', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    const fsMod = await import('fs');

    await initProject('proj', { branch: 'dev', worktree: true });

    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'git',
      ['clone', '--bare', 'https://github.com/launchapp/launchapp.git', '/tmp/mock-repo'],
      { stdio: 'inherit' }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'git',
      ['worktree', 'add', require('path').resolve('proj'), 'dev'],
      { stdio: 'inherit', cwd: '/tmp/mock-repo' }
    );
    expect(fsMod.default.rmSync).toHaveBeenCalledWith('/tmp/mock-repo', { recursive: true, force: true });
  });
});
