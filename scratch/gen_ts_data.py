import json
import os

def obfuscate_email(email):
    if not email or "@" not in email:
        return email
    parts = email.split("@")
    name = parts[0]
    domain = parts[1]
    if len(name) <= 2:
        return f"{name}***@{domain}"
    return f"{name[0]}***{name[-1]}@{domain}"

with open("restored_data.json", "r") as f:
    data = json.load(f)

# Obfuscate before exporting
for r in data['registrations']:
    r['userEmail'] = obfuscate_email(r['userEmail'])

for t in data['testimonials']:
    t['authorEmail'] = obfuscate_email(t.get('authorEmail'))

ts_content = f"""
import {{ Event, EventRegistration, Testimonial }} from '../types';

export const REAL_EVENTS: Event[] = {json.dumps(data['events'], indent=2)};

export const REAL_REGISTRATIONS: EventRegistration[] = {json.dumps(data['registrations'], indent=2)};

export const REAL_TESTIMONIALS: Testimonial[] = {json.dumps(data['testimonials'], indent=2)};
"""

os.makedirs("data", exist_ok=True)
with open("data/resilience_data.ts", "w") as f:
    f.write(ts_content)

print("Generated data/resilience_data.ts")
