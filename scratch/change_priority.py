import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

# Replace formData init
code = code.replace("priority: 1\n  });", "priority: 23\n  });")

# Replace setFormData reset
code = code.replace("priority: 1 });", "priority: 23 });")

# Replace edit default
code = code.replace("priority: entry.priority || 1", "priority: entry.priority || 23")

# Replace sort defaults
code = code.replace("const pA = a.priority || 1;", "const pA = a.priority || 23;")
code = code.replace("const pB = b.priority || 1;", "const pB = b.priority || 23;")

# Replace input fallback
code = code.replace("parseInt(e.target.value) || 1", "parseInt(e.target.value) || 23")

# Update label
code = code.replace("Display Priority (1 = First)", "Display Priority (1 = First, Default 23)")


with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

