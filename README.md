# create-launchapp

CLI script to bootstrap a Launchapp project from the command line.

## Getting Started

Install the package globally or use `npx` to run it without installation.

```bash
npx create-launchapp my-app --install
```

The above command clones the Launchapp repository into `my-app` and runs `pnpm install` inside the created directory.

### Options

- `--branch <branch>`: clone a specific branch from the Launchapp repository.
- `--install`: automatically run `npm install` after cloning.
- `--repo <url>`: specify an alternative git repository to clone.
- `--worktree`: create the project using `git worktree` instead of a normal clone.
- `--create-env`: generate a basic `.env` file after cloning.
- If `--branch` is not provided, the `main` branch is used by default.

You can also run the environment setup separately:

```bash
npx create-launchapp create-env my-app
```

### Environment Setup

Once the project is created you can generate a `.env` file by running the
`createEnv` command:

```ts
import { createEnv } from 'create-launchapp';

await createEnv();
```

The script asks about push provider, payments and mobile configuration then
creates a `.env` file (and optional `mobile/.env`).

## Future Extensibility

The CLI is designed to be extended with additional commands. A planned feature is `add-plugin` to easily install and configure Launchapp plugins within an existing project.

Contributions and ideas for new commands are welcome!
