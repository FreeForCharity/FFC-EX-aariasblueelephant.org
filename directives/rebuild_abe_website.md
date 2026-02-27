# Rebuild Aaria's Blue Elephant Website Directive

## Goal
To programmatically generate a new website for Aaria's Blue Elephant (ABE) by copying the layout files (CSS, JS, Fonts) from the imported `www.hoperisecharity.org` site, converting its green color scheme to a new blue color scheme, copying ABE's logo, and serving the result.

## Target Execution Tool
`execution/rebuild_abe_website.py`

## Expected Inputs
- A manually authored `www_abe_rebuilt/index.html` file containing the ABE content structured in the Hoperise HTML classes.

## Expected Outputs
- **Intermediate:** Modifies `www_abe_rebuilt/css/style.css` in place to swap colors. Copies `logo.png` into `www_abe_rebuilt/img/logo.png`.
- **Deliverable:** Fully functional rebuilt website in `www_abe_rebuilt/` and a spawned local server running on port 8001.

## Edge Cases and Error Handling
1. **Target Directory Missing**
   - *Condition:* The Python script cannot find `www_abe_rebuilt/` which holds the new index file.
   - *Action:* Abort. Instruct the orchestrator to author the directory and `index.html` first.

2. **Source Assets Missing**
   - *Condition:* `www/` or `aaria's-blue-elephant/logo.png` does not exist.
   - *Action:* The script fails. Orchestrator must ensure all upstream workflows completed.
