import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

# Change state
old_state = "const [expandedCategory, setExpandedCategory] = useState<string | null>(null);"
new_state = """  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };"""

code = code.replace(old_state, new_state)

# Change isExpanded check
code = code.replace("const isExpanded = expandedCategory === award.id;", "const isExpanded = expandedCategories.includes(award.id);")

# Change onClick
code = code.replace("onClick={() => setExpandedCategory(isExpanded ? null : award.id)}", "onClick={() => toggleCategory(award.id)}")

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

