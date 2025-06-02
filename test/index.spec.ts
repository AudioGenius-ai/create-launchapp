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
    existsSync: vi.fn().mockReturnValue(false),
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

    process.argv = ['node', 'create-launchapp', 'myapp', '--branch', 'dev', '--install', '--keep-git'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: 'dev', install: true, keepGit: true });
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

  it('removes .git when keepGit is false', async () => {
    const fsMod = await import('fs');
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);

    const existsMock = fsMod.default.existsSync as any;
    existsMock.mockReset();
    existsMock.mockReturnValueOnce(false).mockReturnValueOnce(true);

    const rmMock = fsMod.default.rmSync as any;

    await initProject('proj', {});

    expect(rmMock).toHaveBeenCalledWith(
      path.join(path.resolve('proj'), '.git'),
      { recursive: true, force: true }
    );
  });

  it('keeps .git when keepGit is true', async () => {
    const fsMod = await import('fs');
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);

    const existsMock = fsMod.default.existsSync as any;
    existsMock.mockReset();
    existsMock.mockReturnValueOnce(false).mockReturnValueOnce(true);

    const rmMock = fsMod.default.rmSync as any;

    await initProject('proj', { keepGit: true });

    expect(rmMock).not.toHaveBeenCalled();
  });
});
