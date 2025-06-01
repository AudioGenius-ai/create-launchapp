import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import inquirer from 'inquirer';
import webPush from 'web-push';

export interface CreateEnvOptions {
  cwd?: string;
}

export async function createEnv(options: CreateEnvOptions = {}) {
  const cwd = options.cwd || process.cwd();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'authUrl',
      message: 'Better Auth base URL',
      default: 'http://localhost:5173'
    },
    {
      type: 'list',
      name: 'pushProvider',
      message: 'Select push notification provider',
      choices: [
        { name: 'None', value: 'none' },
        { name: 'Expo', value: 'expo' },
        { name: 'Firebase', value: 'firebase' },
        { name: 'Web Push', value: 'web' }
      ],
      default: 'expo'
    },
    {
      type: 'confirm',
      name: 'payments',
      message: 'Enable payments?',
      default: false
    },
    {
      type: 'confirm',
      name: 'mobile',
      message: 'Configure mobile app?',
      default: false
    }
  ]);

  const env: Record<string, string> = {
    BETTER_AUTH_URL: answers.authUrl,
    BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    EMAIL_FROM: 'no-reply@yourdomain.com',
    RESEND_API_KEY: '',
    DATABASE_URL: '',
    S3_ENDPOINT: '',
    S3_ACCESS_KEY: '',
    S3_SECRET_KEY: '',
    S3_BUCKET: '',
    S3_REGION: '',
    PUSH_PROVIDER: answers.pushProvider,
    EXPO_ACCESS_TOKEN: '',
    FIREBASE_SERVICE_ACCOUNT_PATH: '',
    FIREBASE_DATABASE_URL: '',
    WEB_PUSH_PUBLIC_KEY: '',
    WEB_PUSH_PRIVATE_KEY: '',
    WEB_PUSH_SUBJECT: 'mailto:your-email@example.com',
    S3_BLOG_ASSETS_BUCKET: 'blog-assets',
    STRIPE_WEBHOOK_SECRET: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_PUBLIC_KEY: '',
    BASE_API_PATH: 'http://localhost:5173/',
    APPLE_ISSUER_ID: '',
    APPLE_KEY_ID: '',
    APPLE_PRIVATE_KEY: '',
    GOOGLE_SERVICE_ACCOUNT_JSON: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    OPEN_ROUTER_KEY: '',
    PAYMENTS_ENABLED: answers.payments ? 'true' : 'false'
  };

  if (answers.pushProvider === 'web') {
    const { publicKey, privateKey } = webPush.generateVAPIDKeys();
    env.WEB_PUSH_PUBLIC_KEY = publicKey;
    env.WEB_PUSH_PRIVATE_KEY = privateKey;
  }

  const envLines = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(cwd, '.env');
  fs.writeFileSync(envPath, envLines, { encoding: 'utf8' });

  if (answers.mobile) {
    const mobileDir = path.join(cwd, 'mobile');
    fs.mkdirSync(mobileDir, { recursive: true });
    const mobileEnvPath = path.join(mobileDir, '.env');
    fs.writeFileSync(mobileEnvPath, envLines, { encoding: 'utf8' });
  }
}
