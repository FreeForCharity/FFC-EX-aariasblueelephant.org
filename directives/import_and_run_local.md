# Import and Run Local Directive

## Goal
Import the locally mirrored hoperisecharity website and start a local web server so the user can interact with and test the website locally.

## Target Execution Tool
`execution/import_and_run_local.py`

## Expected Inputs
None required.

## Expected Outputs
- **Intermediate:** Website files will be copied/imported into a clean directory: `www/`.
- **Deliverable:** A local HTTP server running on port 8000 serving the imported files, and a printout indicating the local URL.

## Edge Cases and Error Handling
1. **Source Missing**
   - *Condition:* The source directory `www.hoperisecharity.org/www.hoperisecharity.org/` does not exist.
   - *Action:* Report the error to the user and halt.

2. **Web server port collision**
   - *Condition:* Port 8000 is already in use.
   - *Action:* The script will attempt to increment the port until an open port is found.
