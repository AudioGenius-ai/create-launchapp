import fs from 'fs';
import path from 'path';

export function createEnv(projectName: string) {
  const envPath = path.join(projectName, '.env');
  const content = 'MY_ENV_VAR=123';
  fs.writeFileSync(envPath, content);
}
