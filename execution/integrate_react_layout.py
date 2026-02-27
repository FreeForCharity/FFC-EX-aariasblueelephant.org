#!/usr/bin/env python3
import os
import shutil
import sys
import re

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REACT_APP_DIR = os.path.join(BASE_DIR, "aaria's-blue-elephant")
TEMPLATES_DIR = os.path.join(BASE_DIR, ".tmp", "react_templates")

# Target Files
INDEX_HTML = os.path.join(REACT_APP_DIR, "index.html")
NAVBAR_TSX = os.path.join(REACT_APP_DIR, "components", "Navbar.tsx")
FOOTER_TSX = os.path.join(REACT_APP_DIR, "components", "Footer.tsx")
HOME_TSX = os.path.join(REACT_APP_DIR, "pages", "Home.tsx")

# Source Templates
TMP_NAVBAR = os.path.join(TEMPLATES_DIR, "Navbar.tsx")
TMP_FOOTER = os.path.join(TEMPLATES_DIR, "Footer.tsx")
TMP_HOME = os.path.join(TEMPLATES_DIR, "Home.tsx")

# Fonts to inject
FONTS_HTML = """
    <!-- Hoperise Charity Layout Fonts -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900" rel="stylesheet">
    <link href='https://fonts.googleapis.com/css?family=Oxygen:400,300,700' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>
"""

def update_index_html():
    print(f"Updating {INDEX_HTML} with Google Fonts...")
    if not os.path.exists(INDEX_HTML):
        print(f"Error: Could not find {INDEX_HTML}")
        return False
        
    with open(INDEX_HTML, 'r') as f:
        content = f.read()
        
    # Check if we already injected it
    if "Material+Icons" in content:
        print("Fonts already present in index.html. Skipping.")
        return True
        
    # Inject right before </head>
    content = content.replace("</head>", f"{FONTS_HTML}</head>")
    
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    return True

def copy_template(src, dest):
    print(f"Applying template to {dest}...")
    if not os.path.exists(src):
        print(f"Error: Source template {src} not found.")
        return False
        
    # Ensure destination directory exists (e.g., if Footer.tsx didn't exist)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    
    shutil.copy2(src, dest)
    return True

def main():
    print("Starting React layout integration process...")
    
    if not os.path.exists(REACT_APP_DIR):
        print(f"Error: Target React app directory '{REACT_APP_DIR}' does not exist.")
        sys.exit(1)
        
    if not os.path.exists(TEMPLATES_DIR):
        print(f"Error: Templates directory '{TEMPLATES_DIR}' does not exist.")
        sys.exit(1)

    # 1. Update index.html
    if not update_index_html():
        sys.exit(1)
        
    # 2. Map templates to their destination
    files_to_update = [
        (TMP_NAVBAR, NAVBAR_TSX),
        (TMP_FOOTER, FOOTER_TSX),
        (TMP_HOME, HOME_TSX)
    ]
    
    for src, dest in files_to_update:
        if not copy_template(src, dest):
            sys.exit(1)
            
    print("React layout integration successfully completed.")

if __name__ == "__main__":
    main()
