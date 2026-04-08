# Contributing to Hop

Thank you for your interest in contributing to Hop!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/hop.git`
3. Install dependencies: `bun install`
4. Create a new branch: `git checkout -b feature/your-feature`

## Development Workflow

```bash
# Run type check
bun run prepare

# Run tests
bun test

# Run CLI locally
bun run dev --help
```

## Code Style

- Use TypeScript
- Run `bun run prepare` before committing
- Keep imports clean (use barrel exports from `src/index.ts`)

## Pull Request Process

1. Ensure all tests pass: `bun test`
2. Ensure type check passes: `bun run prepare`
3. Update documentation if needed
4. Submit PR with clear description

## Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org):

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: code restructuring
test: add tests
chore: maintenance
```

## Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage
```

## Questions?

Open an issue for bugs or feature requests.
