import fs from 'fs';
import path from 'path';

export async function createEnv(projectDir: string) {
  const envPath = path.resolve(projectDir, '.env');
  if (fs.existsSync(envPath)) {
    throw new Error(`.env already exists in ${projectDir}`);
  }
  await fs.promises.writeFile(envPath, 'NODE_ENV=development\n');
  console.log(`Created .env at ${envPath}`);
}
