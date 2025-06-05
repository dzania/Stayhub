#!/usr/bin/env python3
"""
Database migration management script
Usage: python migrate.py [command]

Commands:
  upgrade      - Run all pending migrations
  downgrade    - Downgrade to previous migration
  current      - Show current migration
  history      - Show migration history
  revision     - Create new migration (auto-generate)
"""
import subprocess
import sys
import os

def run_command(cmd):
    """Run alembic command"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(e.stderr)
        return False

def main():
    if not os.path.exists('alembic.ini'):
        print("❌ No alembic.ini found. Run this script from the backend directory.")
        sys.exit(1)
    
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'upgrade':
        print("🔄 Running migrations...")
        run_command(['alembic', 'upgrade', 'head'])
        
    elif command == 'downgrade':
        print("⏪ Downgrading to previous migration...")
        run_command(['alembic', 'downgrade', '-1'])
        
    elif command == 'current':
        print("📍 Current migration:")
        run_command(['alembic', 'current', '-v'])
        
    elif command == 'history':
        print("📜 Migration history:")
        run_command(['alembic', 'history', '-v'])
        
    elif command == 'revision':
        message = input("Migration message: ").strip()
        if not message:
            message = "Auto-generated migration"
        print(f"📝 Creating new migration: {message}")
        run_command(['alembic', 'revision', '--autogenerate', '-m', message])
        
    else:
        print(f"❌ Unknown command: {command}")
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main() 