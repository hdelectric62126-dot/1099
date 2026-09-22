# Offline upgrade package

This branch is intentionally separate from `main`. It prepares improvements without changing the live 1099 Field Ledger until you choose to merge it.

## Included

- Dashboard and Reports use the tax year saved in Settings instead of mixing every year together.
- CSV exports accept the selected tax year.
- Reports includes a downloadable business-data backup in JSON format.
- `PREP-WINDOWS.cmd` uses the installed Python runtime to verify Node.js, install dependencies, run tests, run the production build, and create a clean ZIP.

## At home

1. Get this branch onto the PC.
2. Double-click `PREP-WINDOWS.cmd`.
3. Do not merge into `main` unless the script finishes with `READY`.
4. The script creates `1099-field-ledger-ready.zip` one folder above the project.

The Python helper does not replace Node.js; this app is still a TypeScript/React application. Python is only being used to automate the repetitive preparation/check/package steps.
