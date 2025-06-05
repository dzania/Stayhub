#!/bin/bash

echo "🚀 Starting StayHub Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
python -c "
import subprocess
import sys
try:
    result = subprocess.run(['alembic', 'upgrade', 'head'], check=True, capture_output=True, text=True)
    print('✅ Migrations completed!')
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print('❌ Migration failed!')
    print(e.stderr)
    sys.exit(1)
"

# Start the application
echo "🎯 Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 