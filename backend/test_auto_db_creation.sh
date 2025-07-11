#!/bin/bash

echo "🧪 Testing Lady's Essence Backend Database Auto-Creation"
echo "=================================================="

# Test basic API
echo "1. Testing basic API..."
curl -s http://localhost:5000/ && echo ""

# Test admin login
echo -e "\n2. Testing admin login..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567890", "password": "admin123"}')

if echo "$ADMIN_RESPONSE" | grep -q "Login successful"; then
    echo "✅ Admin login successful"
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ Admin login failed"
    echo "$ADMIN_RESPONSE"
fi

# Test adolescent login
echo -e "\n3. Testing adolescent user login..."
USER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567894", "password": "user123"}')

if echo "$USER_RESPONSE" | grep -q "Login successful"; then
    echo "✅ Adolescent user login successful"
    USER_TOKEN=$(echo "$USER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ Adolescent user login failed"
    echo "$USER_RESPONSE"
fi

# Test health provider login
echo -e "\n4. Testing health provider login..."
PROVIDER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567892", "password": "provider123"}')

if echo "$PROVIDER_RESPONSE" | grep -q "Login successful"; then
    echo "✅ Health provider login successful"
else
    echo "❌ Health provider login failed"
    echo "$PROVIDER_RESPONSE"
fi

# Test appointments endpoint (this was previously failing)
if [ ! -z "$USER_TOKEN" ]; then
    echo -e "\n5. Testing appointments endpoint..."
    APPOINTMENTS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/appointments \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$APPOINTMENTS_RESPONSE" | grep -q "appointments\|items"; then
        echo "✅ Appointments endpoint working"
    else
        echo "❌ Appointments endpoint failed"
        echo "$APPOINTMENTS_RESPONSE"
    fi
fi

# Test cycle logs endpoint
if [ ! -z "$USER_TOKEN" ]; then
    echo -e "\n6. Testing cycle logs endpoint..."
    CYCLES_RESPONSE=$(curl -s -X GET http://localhost:5000/api/cycle-logs \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$CYCLES_RESPONSE" | grep -q "cycle_logs\|items"; then
        echo "✅ Cycle logs endpoint working"
    else
        echo "❌ Cycle logs endpoint failed"
        echo "$CYCLES_RESPONSE"
    fi
fi

# Test meal logs endpoint
if [ ! -z "$USER_TOKEN" ]; then
    echo -e "\n7. Testing meal logs endpoint..."
    MEALS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/meal-logs \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$MEALS_RESPONSE" | grep -q "meal_logs\|items"; then
        echo "✅ Meal logs endpoint working"
    else
        echo "❌ Meal logs endpoint failed"
        echo "$MEALS_RESPONSE"
    fi
fi

echo -e "\n🎉 Database auto-creation and initialization test completed!"
echo "=================================================="
