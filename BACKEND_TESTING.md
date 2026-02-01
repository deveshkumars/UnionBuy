# Test Backend Setup

## ✅ Backend is LIVE!

**Endpoint:** https://xw7ig6wxe5bf3azu54knmj4z5q.appsync-api.us-east-1.amazonaws.com/graphql
**Region:** us-east-1
**Status:** ✅ Deployed

---


## 📱 How to Test

### 1. Start the App
```bash
cd reactnativeapp
npx expo start
```

### 2. Sign Up Flow
When the app starts, you'll see the **Sign In screen** (auth.tsx)

**To create a test account:**
1. Click "Don't have an account? Sign Up"
2. Enter email: `test@example.com`
3. Enter password: `TestPass123!` (min 8 chars)
4. Click **SIGN UP**
5. Check your email for confirmation code (from AWS Cognito)
6. Enter the 6-digit code
7. Click **CONFIRM**
8. Now **SIGN IN** with your credentials

### 3. What Works
Once signed in, the app will:
- ✅ Load products from DynamoDB (if any exist)
- ✅ Create pledges in the database
- ✅ Fetch your pledges
- ✅ Show real backend data instead of mocks

---

## 🧪 Quick Backend Test

Run this to verify backend works:
```bash
cd reactnativeapp
node test-backend.js
```

This will:
1. ✅ Sign up a user
2. ✅ Sign in
3. ✅ Create a product
4. ✅ Fetch products

---

## 🔍 How to Know Backend is Working

### In the App:
1. **Sign In screen appears** → Backend auth is active
2. **After sign in, if products page is empty** → Backend connected but no data yet
3. **Create a pledge** → Check the sandbox terminal for DynamoDB writes
4. **Check Pledge tab** → Should show your real pledges from DB

### In the Terminal (Sandbox):
Watch for logs like:
```
✔ Deployment in progress...
[Sandbox] Watching for file changes...
```

When you interact with the app, you'll see Lambda logs streaming.

### In AWS Console:
- Go to DynamoDB → Tables → See `UserProfile`, `Product`, `Pledge`, `BulkOrder`
- Go to Cognito → User Pools → See your registered users

---

## 📝 Add Sample Products

To populate the database with products, run:
```bash
cd reactnativeapp
node seed-products.js
```

(I can create this script if you need it)

---

## 🐛 Common Issues

### "No federated jwt" error
- **Cause:** Not signed in
- **Fix:** Sign in first via the auth screen

### "Products list is empty"
- **Cause:** No products in DynamoDB yet
- **Fix:** Add products manually or create a seed script

### App stuck on loading
- **Cause:** Backend misconfigured
- **Fix:** Check `amplify_outputs.json` exists in `reactnativeapp/`

---

## 🚀 Next Steps

1. **Seed data:** Add sample products to DynamoDB
2. **Test pledges:** Create a pledge and see it in the Pledges tab
3. **Test bulk orders:** Create bulk orders and assign to runners
4. **Add more users:** Sign up multiple accounts to test multi-user scenarios
