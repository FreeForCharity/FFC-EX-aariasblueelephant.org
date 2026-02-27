#!/usr/bin/env python3
import os
import sys
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

TARGET_DIR = "www_abe_rebuilt"
CSS_FILE = os.path.join(TARGET_DIR, "css", "style.css")
START_PORT = 8001

# Mapping Hoperise Green colors to Aaria's Blue Elephant colors
COLOR_MAP = {
    "#057152": "#0369a1",  # Primary Dark Green -> Sky 700
    "#01d262": "#38bdf8",  # Highlight Green -> Sky 400
    "#003425": "#082f49"   # Very Dark Green -> Sky 900
}

def get_open_port(start_port):
    port = start_port
    while port < 9000:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
        port += 1
    return None

def replace_colors_in_file(filepath, color_map):
    if not os.path.exists(filepath):
        print(f"Error: Could not find CSS file at {filepath}")
        return False
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    for old_color, new_color in color_map.items():
        # Case insensitive replacement for hex codes
        content = content.replace(old_color, new_color)
        content = content.replace(old_color.upper(), new_color)
        
    with open(filepath, 'w') as f:
        f.write(content)
        
    return True

def main():
    print("Starting Aaria's Blue Elephant rebuild process...")
    
    if not os.path.exists(TARGET_DIR):
        print(f"Error: Target directory '{TARGET_DIR}' does not exist.")
        sys.exit(1)
        
    print("Replacing Hoperise color theme with ABE blue theme in CSS...")
    if not replace_colors_in_file(CSS_FILE, COLOR_MAP):
        sys.exit(1)
        
    print("Color replacement successful.")
    
    # Switch to the target directory to serve from there
    os.chdir(TARGET_DIR)
    
    port = get_open_port(START_PORT)
    if not port:
        print("Error: Could not find an open port between 8000 and 9000.")
        sys.exit(1)
        
    print(f"\nStarting local web server on port {port}...")
    print(f"Preview the rebuilt ABE site at: http://localhost:{port}")
    
    try:
        httpd = HTTPServer(('localhost', port), SimpleHTTPRequestHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)
    except Exception as e:
        print(f"Error: Failed to start server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
