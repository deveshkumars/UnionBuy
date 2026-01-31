# Backend Setup – Metropolis Bulk Buy (Nathan)

## 1. App structure: frontend vs backend

### Frontend (React Native – already in repo)

| Area | What it is |
|------|------------|
| **App shell** | `app/_layout.tsx` – root layout, role-based routing (customer vs runner) |
| **Customer screens** | `app/(customer)/` – index (home/tickers), pledges, operations, wallet, account |
| **Runner screens** | `app/(runner)/` – job board, mission, checklist, scanner |
| **Item detail** | `app/item/[id].tsx` – product modal, add to cart, create pledge |
| **UI components** | `components/metro/` – MetroCard, DataTicker, ProgressRing, etc. |
| **State** | `context/AppContext.tsx` – user, role, cart, pledges, activeMission |
| **Data layer** | `services/api.ts` – all “API” calls (currently mock) |
| **Agent layer** | `services/agents.ts` – bulk decision, price comparison, security (mock; other person wires to real agents) |
| **Types** | `types/index.ts` – User, Product, Pledge, BulkOrder, Mission, Wallet, etc. |

So: **everything in `reactnativeapp/` is frontend.** There is no backend yet; `api.ts` and `mockData.ts` are in-memory only.

### Backend (your job)

- **Auth** – who the user is (and optionally runner vs customer).
- **Storing data** – users, products/item lists, pledges, bulk orders, missions, wallet/transactions (so the app can load/save real data instead of mocks).

The app already assumes these operations (see `api.ts`): fetch products, create/cancel pledge, fetch user pledges, fetch bulk orders, missions, distributions, wallet, etc. Your backend will back those with real persistence and auth.

---

## 2. DynamoDB vs Firebase (recommendation)

Plan says “Backend: firebase”; you asked DynamoDB vs something else. Short answer:

- **Use Firebase (Firestore + Auth)** if the main goal is to get auth + item lists (and pledges/orders) working quickly and the written plan is fixed.
- **Use AWS (DynamoDB + Cognito, optionally AppSync)** if you want a single AWS stack (hosting, auth, security features) and are okay with a bit more setup.

### Option A: Firebase (matches current plan)

| Pros | Cons |
|------|------|
| Fast to add Auth + Firestore | Not AWS (separate from Bedrock/location later) |
| Real-time listeners (pledges, orders) | Less “everything in AWS” for awards |
| Fits “auth and storing item lists” literally | |
| Good SDK for React Native | |

**You’d use:** Firebase Auth (email/phone/social) + Firestore (users, products, pledges, bulk_orders, missions, etc.). Keep calling the same logical API from the app; swap `api.ts` to use Firebase SDK instead of mock arrays.

### Option B: AWS – DynamoDB + Cognito (and optionally AppSync)

| Pros | Cons |
|------|------|
| One AWS stack (Cognito, DynamoDB, later Bedrock, Location) | More initial setup than Firebase |
| Aligns with “AWS: hosting + security features” | You design tables and access patterns |
| Fine-grained security, IAM, attestation later | |
| AppSync (GraphQL) can sit on top if you want a single API | |

**You’d use:** Cognito (auth) + DynamoDB (tables below) + either REST (API Gateway + Lambda) or AppSync (GraphQL) so the app keeps the same mental “API” (fetch products, create pledge, etc.).

### Recommendation

- **If the team is set on “Backend: firebase” and you want to move fast:** use **Firebase (Firestore + Auth)** for auth and storing item lists/pledges/orders. Easiest and matches the doc.
- **If you want to go all-in on AWS for the award track:** use **DynamoDB + Cognito** (and optionally AppSync). Then “backend” = Cognito + DynamoDB + API layer; you’re not wrong to use DynamoDB for user/data storage—it’s a good fit.

So: **you don’t have to use DynamoDB** (Firebase is valid and planned), but **if you choose AWS, DynamoDB is the right place for storing user/data stuff** (not “a different thing”)—Cognito for auth, DynamoDB for everything else.

---

## 3. What to store (same for Firebase or DynamoDB)

Your job is “auth + storing item lists.” The app’s types already define the rest. Minimal set:

| Entity | Purpose |
|--------|---------|
| **Users** | Auth identity + profile (name, role, location, trustScore). Auth system (Cognito/Firebase) gives identity; you store extra profile in DB. |
| **Products** | Catalog: name, category, unit, retailPrice, bulkPrice, bulkMinimum, store. “Item lists” = product catalog + user-specific lists if needed. |
| **Pledges** | User X pledged quantity Y of product Z (amounts, status, timestamps). Core for “storing item lists” in the sense of “what users committed to.” |
| **Bulk orders** | One per product/round: product, target quantity, pledged quantities, status, cutoff, runner, drop zone. |
| **Missions** (optional for v1) | Runner missions (orders, route, status). Can add once runner flow is wired. |

So: **auth** (Cognito or Firebase Auth) + **these tables/collections** for users, products, pledges, bulk_orders (and missions when needed). That’s enough to “get setup with the data” and replace mocks in `api.ts`.

---

## 4. Minimal next steps (you)

1. **Pick one:** Firebase (Firestore + Auth) **or** AWS (Cognito + DynamoDB).
2. **Auth:**  
   - Firebase: enable Auth (e.g. email), get `userId` for every request.  
   - AWS: create User Pool, get `sub` (and optional username) for every request.
3. **Data:**  
   - Firebase: create Firestore collections mirroring the table names above; secure by `userId` where needed.  
   - AWS: create DynamoDB tables (e.g. `users`, `products`, `pledges`, `bulk_orders`), define partition/sort keys (e.g. pledge by `userId` + `createdAt`, or by `bulkOrderId` + `userId`).
4. **API layer:**  
   - Add a thin backend (Cloud Functions for Firebase, or Lambda + API Gateway / AppSync for AWS) that:  
     - Checks auth.  
     - Reads/writes users, products, pledges, bulk_orders.  
   - In the app, replace the mock implementations in `services/api.ts` with calls to this backend (same function names: `fetchProducts`, `createPledge`, `fetchUserPledges`, etc.).

Once that’s in place, the other person can “connect to agent” by having the backend (or the app) call Agent #1/#2 with data loaded from your DB (e.g. item name, count, lat/long from pledges and users).

If you tell me “we’re going Firebase” or “we’re going DynamoDB,” I can outline exact table/collection schemas and example `api.ts` calls next.
