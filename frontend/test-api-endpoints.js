// Test script to verify API endpoints are working correctly
const testAPIEndpoints = async () => {
  console.log('Testing API endpoints...');
  
  // Test the correct endpoint
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: 'test',
        password: 'test'
      })
    });
    
    console.log('Correct endpoint (/api/auth/login):', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error with correct endpoint:', error);
  }
  
  // Test the double API endpoint (should fail)
  try {
    const response = await fetch('http://localhost:5000/api/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: 'test',
        password: 'test'
      })
    });
    
    console.log('Double API endpoint (/api/api/auth/login):', response.status);
  } catch (error) {
    console.error('Error with double API endpoint:', error);
  }
};

// Run the test
testAPIEndpoints();
