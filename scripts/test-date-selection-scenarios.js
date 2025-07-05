const testDateSelection = async () => {
  console.log('🧪 Testing Date Selection Scenarios\n');

  const testCases = [
    {
      name: 'Single date - tomorrow',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 200
    },
    {
      name: 'Single date - future date',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 200
    },
    {
      name: 'Single date - past date (should fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 400
    },
    {
      name: 'Date range - valid range',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 200
    },
    {
      name: 'Date range - start date in past (should fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 400
    },
    {
      name: 'Date range - end before start (should fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 400
    },
    {
      name: 'Date range - exceeds 30 days (should fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 400
    },
    {
      name: 'Duplicate subscription - allowed',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectedStatus: 200,
      runTwice: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`Request: ${JSON.stringify(testCase.body, null, 2)}`);
    
    try {
      // First request
      const response = await fetch('http://localhost:3000/api/notify-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });

      const data = await response.json();
      console.log(`Response Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.status === testCase.expectedStatus) {
        console.log('✅ Test passed');
      } else {
        console.log(`❌ Test failed - Expected ${testCase.expectedStatus}, got ${response.status}`);
      }

      // Run second request if needed (for duplicate test)
      if (testCase.runTwice) {
        console.log('\n🔄 Running duplicate request...');
        const response2 = await fetch('http://localhost:3000/api/notify-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.body)
        });

        const data2 = await response2.json();
        console.log(`Second Response Status: ${response2.status}`);
        console.log(`Second Response: ${JSON.stringify(data2, null, 2)}`);
        
        if (response2.status === testCase.expectedStatus) {
          console.log('✅ Duplicate test passed - duplicates are allowed');
        } else {
          console.log(`❌ Duplicate test failed - Expected ${testCase.expectedStatus}, got ${response2.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Test error:', error.message);
    }
  }

  console.log('\n\n✨ Date selection tests completed!');
};

// Run tests
testDateSelection().catch(console.error); 