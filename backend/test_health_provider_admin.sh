#!/bin/bash

# Test Health Provider Management Endpoints
# Run this script to verify health provider admin functionality

API_URL="http://localhost:5001/api"

echo "=================================="
echo "Health Provider Management Tests"
echo "=================================="

# First, login as admin to get token
echo -e "\n1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1111111111",
    "password": "testpass"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token. Response:"
    echo $LOGIN_RESPONSE
    exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

# Test 1: Get all health providers
echo -e "\n2. Fetching all health providers..."
curl -s -X GET "${API_URL}/admin/health-providers?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to fetch providers"

# Test 2: Get health provider statistics
echo -e "\n3. Fetching health provider statistics..."
curl -s -X GET "${API_URL}/admin/health-providers/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to fetch statistics"

# Test 3: Create a new health provider
echo -e "\n4. Creating a new health provider..."
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/admin/health-providers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Provider",
    "email": "test.provider@example.com",
    "phone_number": "9999999999",
    "password": "testpassword",
    "specialization": "Gynecology",
    "license_number": "MED123456",
    "clinic_name": "Test Clinic",
    "clinic_address": "123 Test Street, Kigali",
    "is_verified": true
  }')

echo $CREATE_RESPONSE | jq '.' || echo $CREATE_RESPONSE

PROVIDER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$PROVIDER_ID" ]; then
    echo "✅ Provider created with ID: $PROVIDER_ID"
    
    # Test 4: Get provider details
    echo -e "\n5. Fetching provider details..."
    curl -s -X GET "${API_URL}/admin/health-providers/${PROVIDER_ID}" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to fetch details"
    
    # Test 5: Update provider
    echo -e "\n6. Updating provider information..."
    curl -s -X PUT "${API_URL}/admin/health-providers/${PROVIDER_ID}" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "specialization": "General Practice & Gynecology",
        "clinic_name": "Updated Test Clinic"
      }' | jq '.' || echo "❌ Failed to update provider"
    
    # Test 6: Verify/Unverify provider
    echo -e "\n7. Toggling provider verification status..."
    curl -s -X POST "${API_URL}/admin/health-providers/${PROVIDER_ID}/verify" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"verify": false}' | jq '.' || echo "❌ Failed to change verification"
    
    # Test 7: Get provider appointments
    echo -e "\n8. Fetching provider appointments..."
    curl -s -X GET "${API_URL}/admin/health-providers/${PROVIDER_ID}/appointments" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to fetch appointments"
    
    # Test 8: Delete provider (optional - uncomment to test)
    # echo -e "\n9. Deleting test provider..."
    # curl -s -X DELETE "${API_URL}/admin/health-providers/${PROVIDER_ID}?delete_user=true" \
    #   -H "Authorization: Bearer $TOKEN" \
    #   -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to delete provider"
    
else
    echo "⚠️ Provider ID not found in response, skipping detail tests"
fi

echo -e "\n=================================="
echo "Tests completed!"
echo "=================================="
