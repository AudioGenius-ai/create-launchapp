import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to simulate successful spawn
const spawnMock = vi.fn((command: string, args: string[], options?: any) => ({
  on: (event: string, cb: (arg?: any) => void) => {
    if (event === 'close') {
      cb(0);
    }
  },
  stdin: null,
  stdout: null,
  stderr: null,
  stdio: null,
  killed: false,
  pid: 1234,
  connected: false,
  exitCode: null,
  signalCode: null,
  spawnargs: args,
  spawnfile: command,
  kill: () => true,
  send: () => true,
  disconnect: () => {},
  unref: () => {},
  ref: () => {},
  addListener: () => null,
  emit: () => false,
  eventNames: () => [],
  getMaxListeners: () => 10,
  listenerCount: () => 0,
  listeners: () => [],
  off: () => null,
  once: () => null,
  prependListener: () => null,
  prependOnceListener: () => null,
  removeAllListeners: () => null,
  removeListener: () => null,
  setMaxListeners: () => null,
  rawListeners: () => [],
  [Symbol.for('nodejs.rejection')]: () => {}
}));

// Mock fs methods to avoid filesystem side effects
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    mkdtempSync: vi.fn().mockReturnValue('/tmp/mock-repo'),
    rmSync: vi.fn(),
    writeFileSync: vi.fn(),
    promises: {
      rm: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined)
    }
  }
}));

// Mock inquirer to avoid hanging on prompts
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockImplementation(async (questions: any[]) => {
      const answers: Record<string, string> = {};
      questions.forEach(q => {
        answers[q.name] = q.default || '';
      });
      return answers;
    })
  }
}));

describe('CLI argument parsing', () => {
  const originalArgv = process.argv.slice();
  let exitSpy: ReturnType<typeof vi.spyOn>;

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

    expect(initProjectMock).toHaveBeenCalledWith(
      'myapp',
      expect.objectContaining({ branch: 'dev', install: true, worktree: false })
    );
    expect(createEnvMock).toHaveBeenCalledWith('myapp');
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

  it('passes repo option to initProject', async () => {
    const mod = await import('../src/commands/initProject');
    const initProjectMock = vi.spyOn(mod, 'initProject').mockResolvedValue(undefined);

    process.argv = ['node', 'create-launchapp', 'myapp', '--repo', 'https://example.com/repo.git'];
    try {
      await import('../src/index');
    } catch (e) {
      // process.exit throws
    }

    expect(initProjectMock).toHaveBeenCalledWith('myapp', { branch: undefined, repoUrl: 'https://example.com/repo.git', install: false, worktree: false });
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
    spawnMock.mockClear();
    vi.unmock('../src/commands/createEnv');
  });

  it('executes git clone and reinitializes repository', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', { branch: 'feature' });

    expect(spawnMock).toHaveBeenNthCalledWith(1,
      'git',
      ['clone', 'https://github.com/AudioGenius-ai/launchapp.dev.git', 'proj', '-b', 'feature'],
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

  it('uses main branch by default', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', {});

    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'git',
      ['clone', 'https://github.com/AudioGenius-ai/launchapp.dev.git', 'proj', '-b', 'main'],
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
      ['clone', '--bare', 'https://github.com/AudioGenius-ai/launchapp.dev.git', expect.stringContaining('/tmp/')],
      { stdio: 'inherit' }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'git',
      ['worktree', 'add', require('path').resolve('proj'), 'dev'],
      { stdio: 'inherit', cwd: expect.stringContaining('/tmp/') }
    );
    expect(fsMod.default.rmSync).toHaveBeenCalledWith(expect.stringContaining('/tmp/'), { recursive: true, force: true });
  });

  it('defaults to main branch when using worktree', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    const fsMod = await import('fs');

    await initProject('proj', { worktree: true });

    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'git',
      ['clone', '--bare', 'https://github.com/AudioGenius-ai/launchapp.dev.git', expect.stringContaining('/tmp/')],
      { stdio: 'inherit' }
    );
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'git',
      ['worktree', 'add', require('path').resolve('proj'), 'main'],
      { stdio: 'inherit', cwd: expect.stringContaining('/tmp/') }
    );
    expect(fsMod.default.rmSync).toHaveBeenCalledWith(expect.stringContaining('/tmp/'), { recursive: true, force: true });
  });
});

describe('createEnv', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes .env file', async () => {
    const fs = await import('fs');
    const writeSpy = fs.default.promises.writeFile;
    const { createEnv } = await import('../src/commands/createEnv');

    await createEnv('proj');

    expect(writeSpy).toHaveBeenCalledWith(
      require('path').join('proj', '.env'),
      expect.stringContaining('BETTER_AUTH_URL=http://localhost:5173')
    );
  });

  it('executes git clone with custom repo', async () => {
    const { initProject, setSpawn } = await import('../src/commands/initProject');
    setSpawn(spawnMock);
    await initProject('proj', { repoUrl: 'https://example.com/custom.git' });

    expect(spawnMock).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://example.com/custom.git', 'proj', '-b', 'main'],
      { stdio: 'inherit' }
    );
  });
});
