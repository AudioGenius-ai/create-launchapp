import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import inquirer from 'inquirer';
import webPush from 'web-push';

export interface CreateEnvOptions {
  cwd?: string;
}

export const ENV_VARS = [
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
  'EMAIL_FROM',
  'RESEND_API_KEY',
  'DATABASE_URL',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET',
  'S3_REGION',
  'PUSH_PROVIDER',
  'EXPO_ACCESS_TOKEN',
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'FIREBASE_DATABASE_URL',
  'WEB_PUSH_PUBLIC_KEY',
  'WEB_PUSH_PRIVATE_KEY',
  'WEB_PUSH_SUBJECT',
  'S3_BLOG_ASSETS_BUCKET',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'BASE_API_PATH',
  'APPLE_ISSUER_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPEN_ROUTER_KEY',
  'PAYMENTS_ENABLED'
] as const;

export const DEFAULT_VALUES: Record<string, string> = {
  BETTER_AUTH_URL: 'http://localhost:5173',
  BETTER_AUTH_SECRET: 'YOUR_SECURE_RANDOM_SECRET',
  EMAIL_FROM: 'no-reply@yourdomain.com',
  RESEND_API_KEY: 'YOUR_RESEND_API_KEY',
  DATABASE_URL: 'postgresql://user:password@host:port/database',
  S3_ENDPOINT: 'YOUR_S3_ENDPOINT_URL',
  S3_ACCESS_KEY: 'YOUR_S3_ACCESS_KEY',
  S3_SECRET_KEY: 'YOUR_S3_SECRET_KEY',
  S3_BUCKET: 'your-bucket-name',
  S3_REGION: 'your-s3-region',
  PUSH_PROVIDER: 'expo',
  EXPO_ACCESS_TOKEN: 'your_expo_access_token',
  FIREBASE_SERVICE_ACCOUNT_PATH: 'path/to/service-account.json',
  FIREBASE_DATABASE_URL: 'https://your-project.firebaseio.com',
  WEB_PUSH_PUBLIC_KEY: 'your_vapid_public_key',
  WEB_PUSH_PRIVATE_KEY: 'your_vapid_private_key',
  WEB_PUSH_SUBJECT: 'mailto:your-email@example.com',
  S3_BLOG_ASSETS_BUCKET: 'blog-assets',
  STRIPE_WEBHOOK_SECRET: 'whsec_YOUR_STRIPE_WEBHOOK_SECRET',
  STRIPE_SECRET_KEY: 'sk_test_YOUR_STRIPE_SECRET_KEY',
  STRIPE_PUBLIC_KEY: 'pk_test_YOUR_STRIPE_PUBLIC_KEY',
  BASE_API_PATH: 'http://localhost:5173/',
  APPLE_ISSUER_ID: 'YOUR_APPLE_ISSUER_ID',
  APPLE_KEY_ID: 'YOUR_APPLE_KEY_ID',
  APPLE_PRIVATE_KEY: 'YOUR_APPLE_PRIVATE_KEY',
  GOOGLE_SERVICE_ACCOUNT_JSON: 'YOUR_GOOGLE_SERVICE_ACCOUNT_JSON',
  GOOGLE_CLIENT_ID: 'your-google-client-id',
  GOOGLE_CLIENT_SECRET: 'your-google-client-secret',
  GITHUB_CLIENT_ID: 'your-github-client-id',
  GITHUB_CLIENT_SECRET: 'your-github-client-secret',
  OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_API_KEY',
  OPEN_ROUTER_KEY: 'YOUR_OPEN_ROUTER_KEY',
  PAYMENTS_ENABLED: 'false'
};

export async function createEnv(projectPath: string): Promise<void> {
  const questions = ENV_VARS.map((name) => ({
    type: 'input',
    name,
    message: `${name}:`,
    default: process.env[name] ?? DEFAULT_VALUES[name]
  }));

  const answers = await inquirer.prompt(questions) as Record<string, string>;

  const env: Record<string, string> = {};
  
  for (const key of ENV_VARS) {
    if (key === 'BETTER_AUTH_SECRET' && answers[key] === DEFAULT_VALUES[key]) {
      env[key] = crypto.randomBytes(32).toString('hex');
    } else if (key === 'PUSH_PROVIDER' && answers[key] === 'web') {
      const { publicKey, privateKey } = webPush.generateVAPIDKeys();
      env.WEB_PUSH_PUBLIC_KEY = publicKey;
      env.WEB_PUSH_PRIVATE_KEY = privateKey;
      env[key] = answers[key];
    } else {
      env[key] = answers[key] ?? '';
    }
  }

  const envContent = ENV_VARS.map((k) => `${k}=${env[k] ?? answers[k] ?? ''}`).join('\n');

  const envPath = path.join(projectPath, '.env');
  await fs.promises.writeFile(envPath, envContent);
}