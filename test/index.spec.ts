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
  });

  it('passes options to initProject', async () => {
    const initProjectMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../src/commands/initProject', () => ({ initProject: initProjectMock }));

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
    vi.mock('child_process', () => ({ spawn: spawnMock }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('executes git clone with branch', async () => {
    const { initProject } = await import('../src/commands/initProject');
    await initProject('proj', { branch: 'feature' });

    expect(spawnMock).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://github.com/launchapp/launchapp.git', 'proj', '-b', 'feature'],
      { stdio: 'inherit' }
    );
  });
});
