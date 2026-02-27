# Integrate React Layout Directive

## Goal
To programmatically apply the structural layout styling (including Navbar structure, Hero Carousel layout, multi-card focus areas, and footer layout) from the Hoperise Charity template directly into the actual components of the `aaria's-blue-elephant` React app. We will accomplish this by replacing existing React components with new ones that output HTML classes derived from our Hoperise-integrated mockups, but built leveraging React router and Lucide icons.

## Target Execution Tool
`execution/integrate_react_layout.py`

## Expected Outputs
- Modifies `aaria's-blue-elephant/index.html` to add required Google Fonts and icons.
- Backs up and overwrites `aaria's-blue-elephant/components/Navbar.tsx`.
- Backs up and overwrites `aaria's-blue-elephant/pages/Home.tsx`.
- Creates or overwrites `aaria's-blue-elephant/components/Footer.tsx`.
- Updates `aaria's-blue-elephant/App.tsx` if necessary to ensure `Footer.tsx` is included if it was previously absent.

## Edge Cases and Error Handling
1. **Target Directory Missing**
   - *Condition:* The Python script cannot find the `aaria's-blue-elephant/` directory.
   - *Action:* Abort.

2. **React Components Missing**
   - *Condition:* The files `Navbar.tsx` or `Home.tsx` are not where they are expected.
   - *Action:* The script will abort instead of blindly writing.
