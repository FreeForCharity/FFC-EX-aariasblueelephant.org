import urllib.request
import re
with open('vite.config.ts', 'r') as f:
    content = f.read()

# Add envPrefix: ['VITE_', 'NEXT_PUBLIC_'] to defineConfig
if 'envPrefix' not in content:
    content = content.replace('plugins: [react()],', "envPrefix: ['VITE_', 'NEXT_PUBLIC_'],\n    plugins: [react()],")

with open('vite.config.ts', 'w') as f:
    f.write(content)
