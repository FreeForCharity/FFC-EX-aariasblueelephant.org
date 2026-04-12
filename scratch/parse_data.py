import csv
import json
import os
import sys

# Increase CSV field size limit for large descriptions
csv.field_size_limit(sys.maxsize)

def parse_csv(filename):
    if not os.path.exists(filename):
        print(f"File {filename} not found.")
        return []
    with open(filename, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def format_event(e):
    # Mapping CSV to TypeScript Event interface
    return {
        "id": e.get("id"),
        "title": e.get("title", ""),
        "date": e.get("date", ""),
        "time": e.get("time", ""),
        "location": e.get("location", ""),
        "description": e.get("description", ""),
        "capacity": int(e.get("capacity", 0)) if e.get("capacity") else 0,
        "registered": int(e.get("registered", 0)) if e.get("registered") else 0,
        "type": e.get("type", "Event"),
        "image": e.get("image") if e.get("image") else None,
        "initialLikes": int(e.get("initial_likes", 0)) if e.get("initial_likes") else 0,
        "mediaLink": e.get("media_link") if e.get("media_link") else None,
        "hours": int(e.get("duration", 0)) if e.get("duration") else (int(e.get("hours", 0)) if e.get("hours") else 0)
    }

def format_registration(r):
    return {
        "id": r.get("id"),
        "eventId": r.get("event_id"),
        "userId": r.get("user_id"),
        "userName": r.get("user_name", ""),
        "userEmail": r.get("user_email", ""),
        "specialNeeds": r.get("special_needs") == 'true',
        "status": r.get("status", "Pending"),
        "date": r.get("date") or r.get("created_at", "").split(' ')[0]
    }

def format_testimonial(t):
    return {
        "id": t.get("id"),
        "author": t.get("author", ""),
        "authorEmail": t.get("author_email"),
        "role": t.get("role", ""),
        "title": t.get("title", ""),
        "content": t.get("content", ""),
        "date": t.get("date") or t.get("created_at", "").split(' ')[0],
        "avatar": t.get("avatar") if t.get("avatar") else None,
        "status": t.get("status", "Pending"),
        "rating": int(t.get("rating", 5)) if t.get("rating") else 5,
        "rank": int(t.get("rank", 0)) if t.get("rank") else 0,
        "media": t.get("media") if t.get("media") else None,
        "userId": t.get("user_id")
    }

events = [format_event(e) for e in parse_csv("events_rows.csv")]
registrations = [format_registration(r) for r in parse_csv("event_registrations_rows.csv")]
testimonials = [format_testimonial(t) for t in parse_csv("testimonials_rows.csv")]

output = {
    "events": events,
    "registrations": registrations,
    "testimonials": testimonials
}

with open("restored_data.json", "w") as f:
    json.dump(output, f, indent=2)

print("Data parsed to restored_data.json")
