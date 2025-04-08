#!/bin/bash

# Start Flask backend
cd backend
source venv/bin/activate
export FLASK_APP=run.py
export FLASK_ENV=development
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
python run.py &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start Next.js frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend running with PID: $BACKEND_PID"
echo "Frontend running with PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
