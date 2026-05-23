import os
import glob

files_to_check = glob.glob('/Users/aj/Desktop/ABE_Website/**/*.tsx', recursive=True)

replacements = [
    ("pending 501(c)(3)", "501(c)(3)"),
    ("501(c)(3) status pending", "501(c)(3) Nonprofit"),
    ("501(c)(3) Status Pending", "501(c)(3) Nonprofit"),
    ("501(c)(3) Pending", "501(c)(3) Nonprofit"),
    ("its 501(c)(3) tax-exempt status pending", "its 501(c)(3) tax-exempt status"),
    ("pending 501(c)(3) nonprofit entity", "501(c)(3) nonprofit entity")
]

for filepath in files_to_check:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        pass

print("Done replacing.")
