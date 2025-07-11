#!/bin/bash

# Lady's Essence Dashboard API Test Script
echo "🧪 Lady's Essence Dashboard API Test"
echo "=" | sed 's/./=/g'
echo ""

BASE_URL="http://localhost:5000"
TOKEN=""

# Function to test basic connectivity
test_connectivity() {
    echo "🔗 Testing basic connectivity..."
    response=$(curl -s --max-time 5 "${BASE_URL}/")
    if [[ $? -eq 0 && "$response" == "The Lady's Essence API is running!" ]]; then
        echo "✅ Server is running"
        return 0
    else
        echo "❌ Server connectivity failed"
        return 1
    fi
}

# Function to test authentication
test_auth() {
    echo ""
    echo "🔐 Testing authentication..."
    
    # Test parent login
    echo "  Testing parent login..."
    response=$(curl -s --max-time 10 -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"phone_number": "1111111111", "password": "testpass"}')
    
    if [[ $? -eq 0 ]]; then
        TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
        if [[ -n "$TOKEN" && "$TOKEN" != "None" ]]; then
            echo "    ✅ Parent login successful"
            echo "    📝 Token: ${TOKEN:0:20}..."
            return 0
        else
            echo "    ❌ Parent login failed - no token received"
            echo "    📝 Response: $response"
            return 1
        fi
    else
        echo "    ❌ Parent login failed - request timeout/error"
        return 1
    fi
}

# Function to test dashboard endpoints
test_dashboard() {
    echo ""
    echo "📊 Testing dashboard endpoints..."
    
    if [[ -z "$TOKEN" ]]; then
        echo "❌ No token available, skipping dashboard tests"
        return 1
    fi
    
    # Array of endpoints to test
    declare -a endpoints=(
        "/api/auth/profile:User Profile"
        "/api/cycle-logs/stats:Cycle Stats"
        "/api/cycle-logs/:Cycle Logs"
        "/api/meal-logs/:Meal Logs"
        "/api/appointments/:Appointments"
        "/api/notifications/:Notifications"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        echo "  Testing $name..."
        
        response=$(curl -s --max-time 10 -X GET "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer $TOKEN")
        
        if [[ $? -eq 0 ]]; then
            # Check if response is valid JSON
            if echo "$response" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
                echo "    ✅ $name working"
                # Show first 100 chars of response
                echo "    📝 Response: $(echo "$response" | cut -c1-100)..."
            else
                echo "    ❌ $name failed - invalid JSON response"
                echo "    📝 Response: $response"
            fi
        else
            echo "    ❌ $name failed - request timeout/error"
        fi
    done
}

# Main execution
main() {
    # Test connectivity
    if ! test_connectivity; then
        echo "❌ Basic connectivity failed. Exiting."
        exit 1
    fi
    
    # Test authentication
    if ! test_auth; then
        echo "❌ Authentication failed. Exiting."
        exit 1
    fi
    
    # Test dashboard endpoints
    test_dashboard
    
    echo ""
    echo "✅ Dashboard API test completed!"
}

# Run the main function
main
