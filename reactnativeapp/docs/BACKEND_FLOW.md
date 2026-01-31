# AWS Backend Flow: Cognito + DynamoDB with React Native

This doc explains how the **AWS backend** (Cognito + DynamoDB via Amplify) is set up and how the **flow** works with the React Native app.

---

## 1. What’s in the backend

| Piece | Role |
|-------|------|
| **Cognito (Amplify Auth)** | User identity: sign up, sign in, sign out. Issues JWT tokens. |
| **DynamoDB** | Persistence. Tables are created from the Amplify Data schema (Product, Pledge, BulkOrder, UserProfile). |
| **AppSync (GraphQL)** | API in front of DynamoDB. The app talks to AppSync; AppSync reads/writes DynamoDB. |

All of this is defined in the **Amplify backend** (`amplify/`) and deployed with **Amplify Sandbox** (`npx ampx sandbox`). There are no separate manual DynamoDB or Cognito projects; Amplify generates them from the schema and auth config.

---

## 2. End-to-end flow (how it works with React Native)

### 2.1 App startup

1. **React Native** starts → root layout runs (`app/_layout.tsx`).
2. **`configureAmplify()`** runs (from `lib/amplify.ts`):
   - Tries to load `reactnativeapp/amplify_outputs.json`.
   - If the file exists and has `auth` + `data`, it calls **`Amplify.configure(outputs)`**.
   - After that, **Cognito** and **AppSync** URLs/keys are known by the Amplify client; the app is “backend configured”.
3. If there is **no** valid `amplify_outputs.json`, the app stays in **mock mode** (existing mock API and mock user).

So:

- **With** `amplify_outputs.json` → app uses **Cognito + DynamoDB (via AppSync)**.
- **Without** it → app uses **mock data** only.

### 2.2 Auth flow (Cognito)

1. **Sign up / Sign in**  
   The app calls **Amplify Auth** (in our code, via `services/backend.ts`):
   - `signUpBackend(email, password, name)` → **Cognito** `SignUp`.
   - `signInBackend(email, password)` → **Cognito** `InitiateAuth` (username + password).
   - Cognito returns **JWT tokens** (id token, access token); Amplify stores them (e.g. in AsyncStorage) and attaches them to later API requests.

2. **“Who is logged in?”**  
   - `getCurrentAuthUserFromBackend()` uses **Auth.getCurrentUser()** (and optionally **UserProfile** in DynamoDB) to get the current user.
   - `api.ts`’s **fetchCurrentUser()** uses this when the backend is configured.

3. **Sign out**  
   - `signOutBackend()` → **Auth.signOut()** → tokens cleared; next API call is unauthenticated.

So the **flow** is: **React Native → Amplify Auth (JS) → Cognito**; Cognito holds identities and issues JWTs; the app never talks to Cognito’s HTTP API directly.

### 2.3 Data flow (DynamoDB via AppSync)

1. **App wants data** (e.g. list products, list pledges).  
   - Code in **`api.ts`** checks **`isBackendConfigured()`**.
   - If true, it calls the corresponding **backend** functions in **`services/backend.ts`**.

2. **Backend** uses the **Amplify Data client** (AppSync GraphQL):
   - **`getDataClient()`** (from `lib/amplify.ts`) returns a **typed client** generated from the Amplify schema (`amplify/data/resource.ts`).
   - That client talks **HTTPS → AppSync** (URL and auth come from `amplify_outputs.json`).
   - AppSync resolves GraphQL to **DynamoDB** (tables created by Amplify for each `a.model()`).

3. **Auth on every request**  
   - The Data client is created with **`authMode: 'userPool'`**.
   - So every AppSync request is signed with the **Cognito JWT** (id or access token). AppSync validates the token with Cognito and then runs the resolver against DynamoDB.

So the **flow** is: **React Native → api.ts → backend.ts → Amplify Data client (AppSync) → DynamoDB**. Cognito is only used to **authenticate** those requests; it does not store products/pledges.

### 2.4 Flow summary diagram (text)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        React Native App                                  │
│  app/_layout.tsx → configureAmplify()                                    │
│  Screens → api.ts (fetchProducts, createPledge, fetchCurrentUser, …)     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │ isBackendConfigured() ?        │
                └───────────────┬───────────────┘
                    │                       │
           No (no outputs)            Yes (has outputs)
                    │                       │
                    ▼                       ▼
         ┌──────────────────┐   ┌──────────────────────────────────────┐
         │ Mock API          │   │ services/backend.ts                    │
         │ (mockData.ts)     │   │ → getDataClient() / Auth (lib/amplify) │
         └──────────────────┘   └──────────────────┬───────────────────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                                    ▼                           ▼
                         ┌──────────────────┐       ┌──────────────────┐
                         │ Cognito           │       │ AppSync (GraphQL)  │
                         │ (Auth)            │       │ (Data API)         │
                         │ signIn, signUp,   │       │ list/get/create   │
                         │ getCurrentUser,   │       │ Product, Pledge,  │
                         │ signOut           │       │ BulkOrder,        │
                         │                   │       │ UserProfile       │
                         └──────────────────┘       └─────────┬──────────┘
                                                               │
                                                               ▼
                                                    ┌──────────────────┐
                                                    │ DynamoDB         │
                                                    │ (tables per model)│
                                                    └──────────────────┘
```

---

## 3. Where things live in the repo

| What | Where |
|------|--------|
| **Backend definition** | `amplify/` (auth + data schema + backend.ts). |
| **Amplify config in app** | `reactnativeapp/lib/amplify.ts` (configure, getDataClient, Auth). |
| **Backend service (App + Auth)** | `reactnativeapp/services/backend.ts` (fetch products/pledges, create pledge, sign in/out, get current user). |
| **App-facing API** | `reactnativeapp/services/api.ts` (uses backend when configured, else mock). |
| **Generated config** | `reactnativeapp/amplify_outputs.json` (created by `ampx sandbox`; do not commit real one if it contains secrets; use placeholder until you run sandbox). |

---

## 4. How to get “backend configured” (Cognito + DynamoDB)

1. **Install and run Amplify Sandbox** (from repo root):
   ```bash
   cd amplify
   npm install
   npx ampx sandbox
   ```
   When sandbox finishes, it prints/creates **amplify_outputs.json**.  
If you see **"Failed to load default AWS credentials"**, configure an Amplify profile first: see **[AMPLIFY_PROFILE_SETUP.md](./AMPLIFY_PROFILE_SETUP.md)**.

3. **Point the app at the outputs**  
   Copy the generated **amplify_outputs.json** into **`reactnativeapp/`** (or configure sandbox to output there). The app’s `configureAmplify()` reads from **`reactnativeapp/amplify_outputs.json`**.

4. **Install app deps and run the app** (from repo root):
   ```bash
   cd reactnativeapp
   npm install
   npx expo start
   ```
   With a valid `amplify_outputs.json`, the app will use **Cognito + DynamoDB** (via AppSync) instead of mocks.

---

## 6. Using auth in the UI (e.g. Account screen)

When the backend is configured:

- **Sign in**: `import { signInBackend } from '@/services/backend';` then `await signInBackend(email, password)`.
- **Sign up**: `import { signUpBackend } from '@/services/backend';` then `await signUpBackend(email, password, name)`.
- **Sign out**: `import { signOutBackend } from '@/services/backend';` then `await signOutBackend()`.
- **Current user**: `fetchCurrentUser()` from `api.ts` already uses `getCurrentAuthUserFromBackend()` when the backend is configured.

You can gate the Account (or login) screen on **`isBackendConfigured()`** and show email/password + Sign in / Sign up / Sign out only when the backend is in use.

---

## 7. Short answers

- **“How does the flow work with React Native?”**  
  App starts → `configureAmplify()` loads `amplify_outputs.json` → all API calls go through `api.ts` → when configured, `api.ts` delegates to `backend.ts` → Auth goes to **Cognito**, Data goes to **AppSync → DynamoDB**.

- **“Where is DynamoDB?”**  
  Tables are created and managed by **Amplify** from **`amplify/data/resource.ts`**. You don’t create DynamoDB tables by hand; Amplify creates them when you run **`npx ampx sandbox`**.

- **“Where is Cognito?”**  
  The **User Pool** is created by Amplify from **`amplify/auth/resource.ts`**. Same sandbox command; no separate Cognito project.

- **“How does React Native talk to DynamoDB?”**  
  It doesn’t talk to DynamoDB directly. It talks to **AppSync (GraphQL)** using the Amplify Data client. AppSync then reads/writes DynamoDB. So the flow is **React Native → AppSync → DynamoDB**.
