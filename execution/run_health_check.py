#!/usr/bin/env python3
import json
import os
import sys
from datetime import datetime

TMP_DIR = ".tmp"
OUTPUT_FILE = os.path.join(TMP_DIR, "health_check_status.json")

def main():
    print("Starting System Health Check...")
    
    # Check if .tmp directory exists
    if not os.path.exists(TMP_DIR):
        print(f"Error: Directory '{TMP_DIR}' does not exist. Ensure the workspace is initialized.")
        sys.exit(1)
        
    try:
        diagnostics = {
            "status": "Healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": "3-layer architecture execution tool ran successfully.",
            "execution_layer": True
        }
        
        with open(OUTPUT_FILE, "w") as f:
            json.dump(diagnostics, f, indent=4)
            
        print(f"SUCCESS: System is healthy. Wrote diagnostic data to {OUTPUT_FILE}")
        sys.exit(0)
        
    except PermissionError:
        print(f"Error: Permission denied when attempting to write to '{TMP_DIR}'. Check file permissions.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: An unexpected error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
