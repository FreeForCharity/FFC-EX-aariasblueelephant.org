# System Health Check Directive

## Goal
Validate that the 3-layer architecture (Directives, Orchestration, Execution) works end-to-end. This workflow ensures that directives are properly interpreted by the Orchestrator, deterministic execution tools are successfully invoked, and standard outputs are produced reliably.

## Target Execution Tool
`execution/run_health_check.py`

## Expected Inputs
None required.

## Expected Outputs
- **Intermediate:** Raw diagnostic data or logs written to `.tmp/health_check_status.json` (or `.txt`).
- **Deliverable:** A clear, deterministic success or failure summary returned to the user, confirming that the execution layer successfully processed the request and produced an output.

## Edge Cases and Error Handling

1. **Tool Not Found**
   - *Condition:* The `execution/run_health_check.py` script does not exist.
   - *Action:* The Orchestration layer should detect this missing script, surface the error to the user, and halt execution. Do not attempt to dynamically guess or write the script without explicit instruction, as it violates the separation of concerns.

2. **Missing Directories or Files**
   - *Condition:* The execution script fails because `.tmp/` or `.env` is missing.
   - *Action:* Read the error message. Ensure the workspace is properly initialized according to standard operating procedures. Retry the execution after correcting the environment.

3. **File Write Errors**
   - *Condition:* The script fails with a permission denied error when attempting to write to `.tmp/`.
   - *Action:* Verify that the `.tmp/` directory exists and has the correct permissions. If missing, create it and retry. Update this directive with any newly discovered setup prerequisites.
