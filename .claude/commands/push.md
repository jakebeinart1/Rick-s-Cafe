# Push to GitHub

Stage every changed file, write a commit message that briefly describes what was updated, and push everything to the main branch on GitHub (https://github.com/jakebeinart1/Rick-s-Cafe.git).

## Steps to follow

1. Run `git status` to see what files have changed.
2. Run `git add -A` to stage all changes (new files, edits, and deletions).
3. Run `git diff --staged --stat` to get a summary of what is being committed.
4. Write a short, clear commit message based on what actually changed. Use plain language — not developer jargon.
5. Run `git commit` with that message.
6. Run `git push origin main` to send everything to GitHub.
7. Confirm success and tell Rick in plain English what was just pushed and where it went.

## Rules

- Never skip any of the steps above.
- If there is nothing to commit, tell Rick clearly: "Everything is already up to date — nothing new to send to GitHub."
- If the push fails for any reason, explain what went wrong in plain English and suggest a fix.
- Do not force-push. Do not use --no-verify. Do not amend previous commits.
