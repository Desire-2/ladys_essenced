#!/bin/bash
set -e

cd /home/desire/My_Project/ladys_essenced/backend
source venv/bin/activate

# Start backend in background
python3 run.py > test_backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend started with PID $BACKEND_PID"
echo "Waiting for backend to be ready..."
sleep 15

echo "Testing login..."
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"9999999999","password":"TestPass123"}'

echo ""
echo "Killing backend..."
kill $BACKEND_PID

echo "Showing backend log:"
tail -50 test_backend.log
