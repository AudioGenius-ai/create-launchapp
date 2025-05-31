import fs from 'fs';
import path from 'path';

export async function createEnv(projectName: string) {
  const envPath = path.join(projectName, '.env');
  if (fs.existsSync(envPath)) {
    console.log(`Environment file already exists at ${envPath}`);
    return;
  }
  fs.writeFileSync(envPath, 'LAUNCHAPP_ENV=development\n');
  console.log(`Created environment file at ${envPath}`);
}
