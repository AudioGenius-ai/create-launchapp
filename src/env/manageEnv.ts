import fs from 'fs';
import path from 'path';
import { ENV_VARIABLES } from './variables';

export function generateEnvExample(projectDir: string) {
  const lines = ENV_VARIABLES.map(v => `# ${v.description}\n${v.name}=${v.default ?? ''}`);
  fs.writeFileSync(path.join(projectDir, '.env.example'), lines.join('\n') + '\n');
}

export async function promptAndWriteEnv(projectDir: string) {
  const { default: inquirer } = await import('inquirer');
  const questions = ENV_VARIABLES.map(v => ({
    type: 'input',
    name: v.name,
    message: `${v.name} (${v.description})`,
    default: v.default
  }));
  const answers = await inquirer.prompt<Record<string, string>>(questions);
  const lines = ENV_VARIABLES.map(v => `${v.name}=${answers[v.name] ?? ''}`);
  fs.writeFileSync(path.join(projectDir, '.env'), lines.join('\n') + '\n');
}
