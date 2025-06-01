import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

var writeFileMock: any;
var existsSyncMock: any;
vi.mock('fs', () => {
  writeFileMock = vi.fn();
  existsSyncMock = vi.fn();
  return {
    default: {
      writeFileSync: writeFileMock,
      existsSync: existsSyncMock,
    },
  };
});

var promptMock: any;
vi.mock('inquirer', () => {
  promptMock = vi.fn();
  return { default: { prompt: promptMock } };
});

import crypto from 'crypto';

import { createEnv } from '../src/commands/createEnv';

describe('createEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.from('12345678901234567890123456789012'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes env files for expo provider and mobile app', async () => {
    promptMock.mockResolvedValue({
      pushProvider: 'expo',
      expoToken: 'token',
      stripePublicKey: 'pub',
      stripeSecretKey: 'sec'
    });
    existsSyncMock.mockImplementation((p: string) => p.includes('mobile'));

    await createEnv({ projectRoot: '/app' });

    const expected =
      'BETTER_AUTH_SECRET=3132333435363738393031323334353637383930313233343536373839303132\n' +
      'STRIPE_PUBLIC_KEY=pub\n' +
      'STRIPE_SECRET_KEY=sec\n' +
      'PUSH_PROVIDER=expo\n' +
      'EXPO_ACCESS_TOKEN=token\n';

    expect(writeFileMock).toHaveBeenCalledWith('/app/.env', expected);
    expect(writeFileMock).toHaveBeenCalledWith('/app/mobile/.env', expected);
  });

  it('skips expo variables when firebase is chosen', async () => {
    promptMock.mockResolvedValue({
      pushProvider: 'firebase',
      firebaseKey: 'fkey',
      stripePublicKey: 'pub',
      stripeSecretKey: 'sec'
    });
    existsSyncMock.mockReturnValue(false);

    await createEnv({ projectRoot: '/app' });

    const result = writeFileMock.mock.calls[0][1] as string;
    expect(result).toContain('PUSH_PROVIDER=firebase');
    expect(result).toContain('FIREBASE_SERVER_KEY=fkey');
    expect(result).not.toContain('EXPO_ACCESS_TOKEN');
  });
});
