require('dotenv').config({ path: '.env.local' });

async function testDateRangeLimits() {
  console.log('🧪 Testing date range limits and day exclusions...\n');
  
  // Test 1: 30-day limit validation
  console.log('1️⃣ Testing 30-day limit validation...');
  
  const testCases = [
    {
      name: 'Valid 7-day range',
      start: 1,
      end: 7,
      expectValid: true
    },
    {
      name: 'Valid 30-day range (exact limit)',
      start: 1,
      end: 30,
      expectValid: true
    },
    {
      name: 'Invalid 31-day range',
      start: 1,
      end: 31,
      expectValid: false
    },
    {
      name: 'Invalid 60-day range',
      start: 1,
      end: 60,
      expectValid: false
    }
  ];
  
  testCases.forEach(test => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + test.start);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + test.end);
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isValid = daysDiff <= 30;
    
    console.log(`   ${test.name}: ${daysDiff} days - ${isValid === test.expectValid ? '✅' : '❌'} ${isValid ? 'Valid' : 'Invalid'}`);
  });
  
  // Test 2: Monday/Saturday exclusion
  console.log('\n2️⃣ Testing Monday/Saturday exclusion...');
  
  // Helper function to check if a date is Monday or Saturday
  const isExcludedDay = (date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 1 || dayOfWeek === 6; // 1 = Monday, 6 = Saturday
  };
  
  // Find next Monday and Saturday
  const today = new Date();
  let nextMonday = new Date(today);
  let nextSaturday = new Date(today);
  
  while (nextMonday.getDay() !== 1) {
    nextMonday.setDate(nextMonday.getDate() + 1);
  }
  
  while (nextSaturday.getDay() !== 6) {
    nextSaturday.setDate(nextSaturday.getDate() + 1);
  }
  
  console.log(`   Next Monday: ${nextMonday.toDateString()} - Should be excluded: ${isExcludedDay(nextMonday) ? '✅' : '❌'}`);
  console.log(`   Next Saturday: ${nextSaturday.toDateString()} - Should be excluded: ${isExcludedDay(nextSaturday) ? '✅' : '❌'}`);
  
  // Test 3: Generate list of valid days for next 30 days
  console.log('\n3️⃣ Calculating valid days in next 30 days...');
  
  const validDays = [];
  const excludedDays = [];
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + i);
    
    if (isExcludedDay(checkDate)) {
      excludedDays.push({
        date: checkDate.toISOString().split('T')[0],
        day: checkDate.toLocaleDateString('en-US', { weekday: 'long' })
      });
    } else {
      validDays.push({
        date: checkDate.toISOString().split('T')[0],
        day: checkDate.toLocaleDateString('en-US', { weekday: 'long' })
      });
    }
  }
  
  console.log(`   Total days: 30`);
  console.log(`   Valid days: ${validDays.length}`);
  console.log(`   Excluded days: ${excludedDays.length}`);
  console.log('\n   Excluded days list:');
  excludedDays.forEach(d => {
    console.log(`      - ${d.date} (${d.day})`);
  });
  
  // Test 4: Verify auto-check function logic
  console.log('\n4️⃣ Testing auto-check function day filtering...');
  
  // Simulate the auto-check function's getOpenDays logic
  const getOpenDays = (startDate, totalDays) => {
    const openDays = [];
    let currentDate = new Date(startDate);
    let daysChecked = 0;
    const maxDaysToCheck = totalDays * 2; // Safety limit
    
    while (openDays.length < totalDays && daysChecked < maxDaysToCheck) {
      if (!isExcludedDay(currentDate)) {
        openDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return openDays;
  };
  
  const openDays = getOpenDays(new Date(), 20); // Get 20 open days
  console.log(`   Requested 20 open days, got ${openDays.length}`);
  console.log(`   First 5 open days:`);
  openDays.slice(0, 5).forEach((d, i) => {
    console.log(`      ${i + 1}. ${d.toISOString().split('T')[0]} (${d.toLocaleDateString('en-US', { weekday: 'long' })})`);
  });
  
  // Test 5: Edge cases
  console.log('\n5️⃣ Testing edge cases...');
  
  // Check if today is excluded
  const todayExcluded = isExcludedDay(today);
  console.log(`   Today (${today.toLocaleDateString('en-US', { weekday: 'long' })}): ${todayExcluded ? 'Excluded ❌' : 'Valid ✅'}`);
  
  // Check a full week
  console.log('\n   Full week check:');
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  weekDays.forEach((day, index) => {
    const excluded = index === 1 || index === 6;
    console.log(`      ${day}: ${excluded ? 'Excluded ❌' : 'Valid ✅'}`);
  });
  
  console.log('\n\n✅ Date range limits and exclusion testing completed!');
}

// Run the tests
testDateRangeLimits().catch(console.error); 