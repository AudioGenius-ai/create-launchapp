import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

const answers: Record<string, string> = {};
const promptMock = vi.fn().mockImplementation(() => Promise.resolve(answers));

vi.mock('inquirer', () => ({
  default: {
    prompt: promptMock
  }
}));

const writeFileMock = vi.fn().mockResolvedValue(undefined);
vi.mock('fs', () => ({
  default: {
    promises: { writeFile: writeFileMock }
  }
}));

describe('createEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.BETTER_AUTH_URL;
  });

  it('uses defaults and writes env file', async () => {
    process.env.BETTER_AUTH_URL = 'http://env';
    const mod = await import('../src/commands/createEnv');

    mod.ENV_VARS.forEach(v => {
      answers[v] = `${v}_VAL`;
    });

    await mod.createEnv('/proj');

    const questions = promptMock.mock.calls[0][0] as Array<any>;
    const betterAuth = questions.find(q => q.name === 'BETTER_AUTH_URL');
    const pushProvider = questions.find(q => q.name === 'PUSH_PROVIDER');
    expect(betterAuth.default).toBe('http://env');
    expect(pushProvider.default).toBe('expo');

    const envPath = path.join('/proj', '.env');
    const expectedContent = mod.ENV_VARS.map(v => `${v}=${answers[v]}`).join('\n');
    expect(writeFileMock).toHaveBeenCalledWith(envPath, expectedContent);
  });
});
