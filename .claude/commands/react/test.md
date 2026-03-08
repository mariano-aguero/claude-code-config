Write comprehensive tests for: $ARGUMENTS

Testing conventions:

- Use Vitest with React Testing Library
- Place test files in a **tests** directory in the same folder as the source file
- Name test files as [filename].test.ts(x)
- Use @/ prefix for imports
- Follow Martin Fowler's Given-When-Then convention:
  - Given: Set up the initial context/state (arrange)
  - When: Execute the action being tested (act)
  - Then: Assert the expected outcomes (assert)
- Structure test names using the pattern: "given [context], when [action], then [expected result]"

Coverage:

- Test happy paths
- Test edge cases
- Test error states

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the test file to the "Testing" section
2. Document any new testing patterns or utilities introduced
3. Update test coverage expectations if applicable
