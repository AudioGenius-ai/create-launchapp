import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CreateEnvOptions {
  projectRoot: string;
}

export async function createEnv(options: CreateEnvOptions): Promise<void> {
  const answers = await inquirer.prompt<Record<string, string>>([
    {
      type: 'list',
      name: 'pushProvider',
      message: 'Choose your push provider:',
      choices: [
        { name: 'Expo', value: 'expo' },
        { name: 'Firebase', value: 'firebase' },
        { name: 'Web Push', value: 'web' },
        { name: 'None', value: 'none' }
      ]
    },
    {
      type: 'input',
      name: 'expoToken',
      message: 'Expo access token:',
      when: (a) => a.pushProvider === 'expo'
    },
    {
      type: 'input',
      name: 'firebaseKey',
      message: 'Firebase server key:',
      when: (a) => a.pushProvider === 'firebase'
    },
    {
      type: 'input',
      name: 'webPushPublicKey',
      message: 'Web push public key:',
      when: (a) => a.pushProvider === 'web'
    },
    {
      type: 'input',
      name: 'webPushPrivateKey',
      message: 'Web push private key:',
      when: (a) => a.pushProvider === 'web'
    },
    {
      type: 'input',
      name: 'stripePublicKey',
      message: 'Stripe publishable key:'
    },
    {
      type: 'input',
      name: 'stripeSecretKey',
      message: 'Stripe secret key:'
    }
  ]);

  const env: Record<string, string> = {
    BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    STRIPE_PUBLIC_KEY: answers.stripePublicKey,
    STRIPE_SECRET_KEY: answers.stripeSecretKey,
    PUSH_PROVIDER: answers.pushProvider
  };

  if (answers.pushProvider === 'expo') {
    env.EXPO_ACCESS_TOKEN = answers.expoToken;
  } else if (answers.pushProvider === 'firebase') {
    env.FIREBASE_SERVER_KEY = answers.firebaseKey;
  } else if (answers.pushProvider === 'web') {
    env.WEB_PUSH_PUBLIC_KEY = answers.webPushPublicKey;
    env.WEB_PUSH_PRIVATE_KEY = answers.webPushPrivateKey;
  }

  let content = '';
  for (const [key, value] of Object.entries(env)) {
    if (value) {
      content += `${key}=${value}\n`;
    }
  }

  const envPath = path.join(options.projectRoot, '.env');
  fs.writeFileSync(envPath, content);

  const mobilePath = path.join(options.projectRoot, 'mobile');
  if (fs.existsSync(mobilePath)) {
    fs.writeFileSync(path.join(mobilePath, '.env'), content);
  }
}
