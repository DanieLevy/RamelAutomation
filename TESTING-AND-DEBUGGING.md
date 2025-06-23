# 🧪 Testing & Debugging Guide for Netlify Functions

## 🚀 **Quick Start Testing**

### **1. Local Development Testing**

```bash
# Start local development server
npm run dev:netlify

# In another terminal, run tests
npm run test:functions

# Test individual functions
curl http://localhost:8888/.netlify/functions/get-cached-result
curl http://localhost:8888/.netlify/functions/auto-check
curl http://localhost:8888/.netlify/functions/scheduled-check
```

### **2. Production Testing**

```bash
# First, update the production URL in debug-production.js
# Change: const PRODUCTION_URL = 'https://your-actual-site.netlify.app'

# Quick health check
npm run debug:health

# Interactive debugging menu
npm run debug:prod

# Specific tests
npm run debug:cache    # Check cache status
npm run debug:trigger  # Trigger manual check
```

---

## 🔧 **Local Testing Commands**

### **Test All Functions**
```bash
node test-functions.js
```

### **Individual Function Tests**
```bash
# Cache function
curl -X GET http://localhost:8888/.netlify/functions/get-cached-result

# Auto-check function (GET)
curl -X GET http://localhost:8888/.netlify/functions/auto-check

# Auto-check function (POST)
curl -X POST http://localhost:8888/.netlify/functions/auto-check \
  -H "Content-Type: application/json" \
  -d '{"trigger":"manual-test","timestamp":1234567890}'

# Scheduled function (will show test message locally)
curl -X GET http://localhost:8888/.netlify/functions/scheduled-check
```

### **Expected Local Results**
- ✅ `get-cached-result`: Status 200, JSON response with cache data
- ✅ `auto-check`: Status 200, JSON response with appointment results
- ✅ `scheduled-check`: Status 200, but shows local test message

---

## 🌐 **Production Testing**

### **1. Update Configuration**
First, edit `debug-production.js` and `test-functions.js`:
```javascript
// Change this line in both files:
const PRODUCTION_URL = 'https://your-actual-site.netlify.app'
```

### **2. Production Health Check**
```bash
# Quick health check of all functions
node debug-production.js health

# Output should show:
# get-cached-result: ✅ 200 (XXXms)
# auto-check: ✅ 200 (XXXms)  
# scheduled-check: ✅ 200 (XXXms)
```

### **3. Cache Monitoring**
```bash
# Check current cache status
node debug-production.js cache

# Monitor cache updates (1 min intervals, 10 min duration)
node debug-production.js monitor

# Custom monitoring (2 min intervals, 20 min duration)
node debug-production.js monitor 2 20
```

### **4. Manual Trigger Testing**
```bash
# Trigger manual appointment check
node debug-production.js trigger

# Expected output:
# Status: 200 ✅
# Success: ✅
# Found: ✅/❌ (depending on availability)
```

---

## 🐛 **Debugging Production Issues**

### **Common Issues & Solutions**

#### **1. Function Returns 404**
```bash
# Check if function exists
curl -I https://your-site.netlify.app/.netlify/functions/get-cached-result

# Solutions:
# - Verify function is deployed: check Netlify dashboard
# - Check function name matches file name
# - Ensure .mts extension is used
```

#### **2. Function Returns 500**
```bash
# Check function logs in Netlify dashboard
# Or use CLI to stream logs
netlify logs:function get-cached-result

# Common causes:
# - Environment variables not set
# - File permission issues (/tmp access)
# - Import/dependency errors
```

#### **3. Cache Not Updating**
```bash
# Check if scheduled function is running
node debug-production.js cache

# Verify in Netlify dashboard:
# 1. Go to Functions tab
# 2. Check scheduled-check logs
# 3. Verify cron schedule is active
```

#### **4. CORS Issues**
```bash
# Test CORS headers
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-site.netlify.app/.netlify/functions/get-cached-result

# Should return CORS headers
```

---

## 📊 **Monitoring & Analytics**

### **1. Real-time Monitoring**
```bash
# Interactive monitoring session
node debug-production.js

# Select option 4: Monitor Cache
# Watch for cache updates every minute
```

### **2. Function Performance**
```bash
# Test response times
time curl https://your-site.netlify.app/.netlify/functions/auto-check

# Typical response times:
# - get-cached-result: < 200ms
# - auto-check: 5-30 seconds (depends on appointment availability)
# - scheduled-check: < 500ms
```

### **3. Cache Health Indicators**
```bash
node debug-production.js cache

# Healthy cache shows:
# Cached: ✅ Yes
# Cache Age: < 30 minutes
# Last Check: Recent timestamp
# Found Appointments: ✅/❌
```

---

## 🔍 **Advanced Debugging**

### **1. Environment Variables Check**
```bash
# In Netlify dashboard, verify these are set:
# USER_ID=4481
# CODE_AUTH=Sa1W2GjL
# URL=https://your-site.netlify.app
```

### **2. Function Logs Analysis**
```bash
# Stream live logs
netlify logs:function auto-check --live

# Check for errors:
# - "Failed to write cache file" → File permission issue
# - "Netlify.env.get is not a function" → Environment variable issue
# - "ENOTFOUND" → Network/DNS issue
```

### **3. Cache File Debugging**
```bash
# The cache file is stored at:
# Production: /tmp/cache.json
# Local: ./cache.json

# In production, it's recreated on each function invocation
# Check cache write/read operations in logs
```

---

## ✅ **Testing Checklist**

### **Before Deployment**
- [ ] Local functions return 200 status
- [ ] All functions have proper CORS headers
- [ ] Cache function returns JSON data
- [ ] Auto-check function completes appointment search
- [ ] Environment variables are set locally

### **After Deployment**
- [ ] All production functions return 200 status
- [ ] Cache updates every 5 minutes
- [ ] Manual triggers work correctly
- [ ] Function logs show no errors
- [ ] Frontend loads cached results

### **Ongoing Monitoring**
- [ ] Cache age stays under 30 minutes
- [ ] Auto-check finds appointments when available
- [ ] No 500 errors in function logs
- [ ] Response times remain reasonable
- [ ] Scheduled function runs every 5 minutes

---

## 🚨 **Emergency Debugging**

### **If Functions Stop Working**
1. **Check Netlify Status**: https://status.netlify.com
2. **Verify Environment Variables**: Netlify dashboard → Site settings → Environment variables
3. **Check Function Logs**: Netlify dashboard → Functions → View logs
4. **Test Manually**: `node debug-production.js health`
5. **Redeploy if Needed**: `npm run deploy:prod`

### **If Cache Stops Updating**
1. **Check Scheduled Function**: `node debug-production.js cache`
2. **Trigger Manual Update**: `node debug-production.js trigger`
3. **Verify Cron Schedule**: Check `netlify.toml` for `*/5 * * * *`
4. **Check Function Timeout**: Ensure 900s timeout is sufficient

---

## 📞 **Getting Help**

### **Useful Commands for Support**
```bash
# Generate comprehensive test report
node test-functions.js > test-report.txt

# Get function health status
node debug-production.js health > health-report.txt

# Monitor cache for issues
node debug-production.js monitor 1 5 > cache-monitor.txt
```

### **Information to Provide**
- Netlify site URL
- Function names and endpoints
- Error messages from logs
- Test report output
- Expected vs actual behavior

---

This guide should help you thoroughly test and debug your Netlify Functions both locally and in production! 🎯 