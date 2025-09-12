# Selective Merge Strategy

This document outlines the strategy for merging changes from one branch to another while preserving specific components or files that should not be deleted or overwritten.

## Use Case
When you need to merge changes from `quark-1` into `kiosk-version` but want to preserve the keyboard component (or any other specific files) that exists in `kiosk-version` but was deleted in `quark-1`.

## Step-by-Step Process

### 1. Check Current Status
```bash
git status
```
Ensure you're on the target branch (`kiosk-version`) and commit any current changes.

### 2. Identify Changes in Source Branch
```bash
git checkout quark-1
git log --oneline -5
git show --name-only [latest-commit-hash]
```
This shows exactly which files were changed in the latest commit of the source branch.

### 3. Return to Target Branch
```bash
git checkout kiosk-version
```

### 4. Selective File Checkout
Instead of doing a full merge, use selective checkout to bring only specific files:
```bash
git checkout quark-1 -- [file1] [file2] [file3] ...
```

### 5. Verify Preserved Files
Check that the files you want to preserve are still intact:
```bash
ls -la [path-to-preserved-file]
```

### 6. Commit and Push
```bash
git add .
git commit -m "Merge changes from quark-1 while preserving [component-name]"
git push origin kiosk-version
```

## Example Commands (from our recent merge)

```bash
# Check what files were changed in quark-1
git show --name-only 2bd5a74

# Selective checkout of specific files
git checkout quark-1 -- .env.development public/locales/ar/common.json public/locales/en/common.json public/video/answer.mp4 src/components/New\ pages/NewLayout.tsx src/components/client-assessment.tsx src/components/condition-questionnaire.tsx src/components/questionnaire-summary.tsx

# Verify keyboard component is preserved
ls -la src/components/keyboard.tsx

# Commit and push
git commit -m "Merge changes from quark-1 while preserving keyboard component"
git push origin kiosk-version
```

## Alternative Approaches

### Option 1: Cherry-pick Specific Commits
If you want to bring specific commits:
```bash
git cherry-pick [commit-hash]
```

### Option 2: Merge with Conflict Resolution
If you do a regular merge but resolve conflicts manually:
```bash
git merge quark-1
# Resolve conflicts manually, keeping the files you want to preserve
```

### Option 3: Stash and Apply
```bash
git stash
git merge quark-1
git stash pop
# Manually restore any files that were overwritten
```

## When to Use This Strategy

- ✅ When source branch deletes files that target branch needs
- ✅ When you want to merge only specific changes
- ✅ When you want to avoid merge conflicts
- ✅ When you need to preserve branch-specific functionality

## Files to Always Preserve in kiosk-version

Based on our current setup, these files should typically be preserved:
- `src/components/keyboard.tsx`
- `src/styles/keyboard.css`
- Any other kiosk-specific components

## Troubleshooting

### If files are missing after merge:
```bash
git checkout [branch-name] -- [missing-file-path]
```

### If you need to revert a merge:
```bash
git reset --hard [previous-commit-hash]
git push --force origin [branch-name]
```

### If you need to see what files were deleted:
```bash
git diff [branch1]..[branch2] --name-status
```

## Notes

- Always commit your current changes before starting the merge process
- Test the application after merging to ensure everything works correctly
- Consider creating a backup branch before major merges
- Document any special considerations for future reference

## Quick Reference

**To merge quark-1 changes while preserving keyboard:**
1. `git status` (commit if needed)
2. `git checkout quark-1 && git show --name-only HEAD`
3. `git checkout kiosk-version`
4. `git checkout quark-1 -- [list-of-files]`
5. `ls -la src/components/keyboard.tsx` (verify preservation)
6. `git commit -m "Merge changes while preserving keyboard"`
7. `git push origin kiosk-version`
