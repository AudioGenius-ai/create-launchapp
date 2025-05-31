import readline from 'readline';
import open from 'open';

export async function createEnv() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question('Need help? Open documentation in your browser? (y/N) ', async (answer) => {
      rl.close();
      if (answer.trim().toLowerCase().startsWith('y')) {
        await open('https://launchapp.dev/docs');
      }
      resolve();
    });
  });
}
