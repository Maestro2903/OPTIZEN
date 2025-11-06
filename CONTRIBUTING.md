# Contributing to Eye Care Hospital CRM

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach
   - Mock-ups or examples if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

3. **Make your changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   \`\`\`bash
   npm run lint
   npm run type-check
   npm run build
   \`\`\`

5. **Commit your changes**
   \`\`\`bash
   git commit -m "feat: add amazing feature"
   \`\`\`

   Use conventional commit messages:
   - \`feat:\` New feature
   - \`fix:\` Bug fix
   - \`docs:\` Documentation changes
   - \`style:\` Code style changes
   - \`refactor:\` Code refactoring
   - \`test:\` Test additions or changes
   - \`chore:\` Build process or auxiliary tool changes

6. **Push to your fork**
   \`\`\`bash
   git push origin feature/your-feature-name
   \`\`\`

7. **Create a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Wait for review

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types, avoid \`any\`
- Use interfaces for object shapes
- Export types when they might be reused

### React/Next.js

- Use functional components with hooks
- Prefer server components when possible
- Use \`"use client"\` directive only when needed
- Follow Next.js App Router conventions
- Keep components small and focused

### Styling

- Use Tailwind CSS utility classes
- Follow the design system defined in \`tailwind.config.ts\`
- Maintain responsive design (mobile-first)
- Use shadcn/ui components when available
- Keep custom CSS minimal

### File Organization

\`\`\`
- Use kebab-case for file names
- Co-locate related files
- Keep components focused and reusable
- Separate business logic from UI
\`\`\`

### Database

- Always use migrations for schema changes
- Test RLS policies thoroughly
- Include rollback migrations
- Document complex queries
- Use proper indexes

## Testing

- Write tests for critical functionality
- Test edge cases and error handling
- Ensure tests are deterministic
- Mock external dependencies
- Keep tests maintainable

## Documentation

- Update README.md for significant changes
- Document new features
- Add JSDoc comments for complex functions
- Update API documentation
- Include examples where helpful

## Review Process

1. **Automated checks** must pass (linting, type-checking, tests)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## Questions?

Feel free to:
- Open a discussion in GitHub Discussions
- Ask in pull request comments
- Contact maintainers directly

## Recognition

Contributors will be acknowledged in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing! 🙏

