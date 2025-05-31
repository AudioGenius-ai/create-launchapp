# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CLI tool called `create-launchapp` that bootstraps Launchapp projects by cloning from https://github.com/AudioGenius-ai/launchapp.dev.git. The tool supports branch selection and automatic dependency installation.

## Development Commands

- **Build**: `pnpm run build` or `pnpm run prepare` - Uses tsup to compile TypeScript to CommonJS in dist/
- **Test**: `pnpm test` - Runs Vitest test suite
- **Release**: `pnpm run release` - Uses release-it for publishing

For running single test files: `pnpm test <test-file-path>`

## Architecture

The CLI has a simple command structure:
- `src/index.ts` - Main entry point that parses CLI arguments and delegates to commands
- `src/commands/initProject.ts` - Core logic for git cloning and dependency installation
- `src/commands/createEnv.ts` - Environment variable setup utility (contains predefined Launchapp env vars)

The build process uses tsup to create an executable CLI script with a shebang header in dist/index.js.

## Testing Patterns

Tests use Vitest with extensive mocking:
- Mock child_process.spawn for git operations using `setSpawn()` function
- Mock fs operations to avoid filesystem side effects
- Mock inquirer for interactive prompts
- Tests validate both CLI argument parsing and core functionality

The codebase uses dependency injection patterns for testability (e.g., `setSpawn` function allows replacing spawn in tests).

## Key Dependencies

- inquirer: Interactive command-line prompts
- open: Opening URLs/files from CLI
- tsup: TypeScript bundler for CLI executable
- vitest: Testing framework