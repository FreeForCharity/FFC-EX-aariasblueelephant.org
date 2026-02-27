#!/usr/bin/env python3
import os
import shutil
import sys
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

SOURCE_DIR = "www.hoperisecharity.org/www.hoperisecharity.org"
TARGET_DIR = "www"
START_PORT = 8000

def get_open_port(start_port):
    port = start_port
    while port < 9000:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
        port += 1
    return None

def main():
    print("Starting import and local run process...")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Source directory '{SOURCE_DIR}' not found.")
        sys.exit(1)
        
    print(f"Importing website from {SOURCE_DIR} to {TARGET_DIR}...")
    
    # If target dir exists, we remove it to ensure a clean import
    if os.path.exists(TARGET_DIR):
        print(f"Cleaning existing '{TARGET_DIR}' directory...")
        shutil.rmtree(TARGET_DIR)
        
    shutil.copytree(SOURCE_DIR, TARGET_DIR)
    print("Import successful.")
    
    # Switch to the target directory to serve from there
    os.chdir(TARGET_DIR)
    
    port = get_open_port(START_PORT)
    if not port:
        print("Error: Could not find an open port between 8000 and 9000.")
        sys.exit(1)
        
    print(f"\nStarting local web server on port {port}...")
    print(f"Preview the site at: http://localhost:{port}")
    
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
