#!/usr/bin/env node

/**
 * Test Date Validation
 * Debug date/timezone issues with the notification system
 */

console.log('🗓️ Date Validation Test\n');

// Test current date in different timezones
const now = new Date();
console.log('Current Date/Time:');
console.log('  Raw:', now);
console.log('  ISO:', now.toISOString());
console.log('  Local:', now.toLocaleString());
console.log('  Israel:', now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));
console.log('');

// Test date parsing
const testDate = '2025-07-08'; // July 8, 2025
console.log(`Testing date: ${testDate}`);

// Method 1: Simple parsing (can have timezone issues)
const [year, month, day] = testDate.split('-').map(Number);
const parsedDate1 = new Date(year, month - 1, day); // month is 0-indexed
console.log('Method 1 (new Date(year, month-1, day)):');
console.log('  Result:', parsedDate1);
console.log('  ISO:', parsedDate1.toISOString());
console.log('  Local:', parsedDate1.toLocaleDateString());

// Method 2: Direct ISO parsing (UTC midnight)
const parsedDate2 = new Date(testDate);
console.log('\nMethod 2 (new Date(string)):');
console.log('  Result:', parsedDate2);
console.log('  ISO:', parsedDate2.toISOString());
console.log('  Local:', parsedDate2.toLocaleDateString());

// Method 3: ISO with time (UTC)
const parsedDate3 = new Date(testDate + 'T00:00:00');
console.log('\nMethod 3 (new Date(string + "T00:00:00")):');
console.log('  Result:', parsedDate3);
console.log('  ISO:', parsedDate3.toISOString());
console.log('  Local:', parsedDate3.toLocaleDateString());

// Method 4: ISO with timezone
const parsedDate4 = new Date(testDate + 'T00:00:00+03:00'); // Israel timezone
console.log('\nMethod 4 (new Date(string + "T00:00:00+03:00")):');
console.log('  Result:', parsedDate4);
console.log('  ISO:', parsedDate4.toISOString());
console.log('  Local:', parsedDate4.toLocaleDateString());

// Compare dates
console.log('\n📊 Date Comparisons:');
const today = new Date();
today.setHours(0, 0, 0, 0);

console.log('Today (local midnight):', today);
console.log('Today ISO:', today.toISOString());

// Test each parsing method
console.log('\nIs July 8, 2025 in the past?');
console.log('  Method 1:', parsedDate1 < today, `(${parsedDate1.toLocaleDateString()})`);
console.log('  Method 2:', parsedDate2 < today, `(${parsedDate2.toLocaleDateString()})`);
console.log('  Method 3:', parsedDate3 < today, `(${parsedDate3.toLocaleDateString()})`);
console.log('  Method 4:', parsedDate4 < today, `(${parsedDate4.toLocaleDateString()})`);

// Test Israel timezone handling
console.log('\n🌍 Israel Timezone Test:');
const israelFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jerusalem',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const todayIsrael = israelFormatter.format(new Date());
console.log('Today in Israel:', todayIsrael);
console.log('Today in local:', new Date().toLocaleDateString('en-CA'));

// Simulate the bug
console.log('\n🐛 Simulating the Bug:');
const userSelectedDate = '2025-07-08';
const [y, m, d] = userSelectedDate.split('-').map(Number);
const selectedDate = new Date(y, m - 1, d);
const todayCheck = new Date();
todayCheck.setHours(0, 0, 0, 0);

console.log('User selected:', userSelectedDate);
console.log('Parsed as:', selectedDate);
console.log('Today check:', todayCheck);
console.log('Is past?', selectedDate < todayCheck);

// Correct way to compare dates
console.log('\n✅ Correct Date Comparison:');
const correctToday = new Date(todayIsrael + 'T00:00:00');
const correctSelected = new Date(userSelectedDate + 'T00:00:00');
console.log('Today (correct):', correctToday.toISOString().split('T')[0]);
console.log('Selected (correct):', correctSelected.toISOString().split('T')[0]);
console.log('Is past?', correctSelected < correctToday); 