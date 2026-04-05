import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace("Playgroups", "Events")
    new_content = new_content.replace("playgroups", "events")
    new_content = new_content.replace("Playgroup", "Event")
    new_content = new_content.replace("playgroup", "event")
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

dirs = ['pages', 'components', 'app', 'context', 'lib', 'constants.ts', 'types.ts']
for root_dir in dirs:
    if os.path.isfile(root_dir):
        replace_in_file(root_dir)
        continue
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                replace_in_file(os.path.join(root, file))
