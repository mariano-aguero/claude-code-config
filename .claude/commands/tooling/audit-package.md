# Dependency Audit & Fix

Perform a comprehensive security audit and automatically fix vulnerabilities in the current project.

## Instructions

1. **Detect the project type** by looking for dependency manifest files:
   - Node.js: `package.json` (npm/yarn/pnpm)
   - Python: `requirements.txt`, `Pipfile`, `pyproject.toml`
   - Ruby: `Gemfile`
   - Go: `go.mod`
   - Rust: `Cargo.toml`
   - PHP: `composer.json`
   - Java: `pom.xml` (Maven) or `build.gradle` (Gradle)
   - .NET: `*.csproj` or `packages.config`

2. **Read the manifest file(s)** to identify all dependencies.

3. **Run security audit** using the appropriate tool:
   - npm: `npm audit`
   - yarn: `yarn audit`
   - pip: `pip-audit` or `safety check`
   - bundler: `bundle audit`
   - cargo: `cargo audit`
   - composer: `composer audit`
   - go: `govulncheck ./...`

4. **Automatically fix vulnerabilities**:

   **For Node.js (npm/yarn):**
   - Run `npm audit fix` to auto-fix compatible updates
   - If vulnerabilities remain, run `npm audit fix --force` for breaking changes (ask user first)
   - For unfixable issues, manually update the package version in package.json

   **For Python:**
   - Update vulnerable packages in requirements.txt/pyproject.toml to safe versions
   - Run `pip install -U <package>` or update version constraints

   **For Ruby:**
   - Run `bundle update <gem>` for vulnerable gems
   - Update Gemfile version constraints if needed

   **For Go:**
   - Run `go get -u <module>` to update vulnerable modules
   - Run `go mod tidy` after updates

   **For Rust:**
   - Update Cargo.toml with safe versions
   - Run `cargo update`

   **For PHP:**
   - Run `composer update <package>`
   - Update version constraints in composer.json

5. **Verify fixes** by re-running the audit command after applying fixes.

6. **Handle remaining issues:**
   - If some vulnerabilities cannot be auto-fixed, explain why
   - Suggest alternative packages if a dependency is abandoned
   - For breaking changes, show what code changes might be needed

7. **Generate a summary report:**

### Actions Taken
- List all packages that were updated
- Show version changes (from → to)
- Note any manual changes made to manifest files

### Remaining Issues
- Vulnerabilities that couldn't be fixed automatically
- Reason why (no patch available, requires major version, etc.)
- Suggested workarounds or alternatives

### Verification
- Confirm audit passes after fixes
- Note any new issues introduced by updates

8. **Run tests to verify nothing broke:**

   Detect and run the test command based on project type:
   - Node.js: Check `package.json` scripts for `test`, run `npm test` or `yarn test`
   - Python: Run `pytest` or `python -m unittest`
   - Ruby: Run `bundle exec rspec` or `rake test`
   - Go: Run `go test ./...`
   - Rust: Run `cargo test`
   - PHP: Run `composer test` or `./vendor/bin/phpunit`
   - Java: Run `mvn test` or `gradle test`

   If tests fail after fixes:
   - Identify which update caused the failure
   - Attempt to revert that specific update
   - Report the issue and suggest manual intervention

### Test Results
- Show test execution output
- Confirm all tests pass after fixes
- If tests fail, show which tests broke and likely cause

## Important
- Always create a backup awareness: remind user to commit current state before major updates
- For breaking changes (major versions), ask user for confirmation before proceeding
- If a fix breaks tests, revert the problematic update and report the issue

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Document the audit results in the "Security" section
2. List any packages that were updated with version changes
3. Note any unresolved vulnerabilities and their workarounds
4. Update the dependencies section if major changes were made
