# Metropolis Amplify Backend (Cognito + DynamoDB)

This folder defines the AWS backend used by the React Native app when `amplify_outputs.json` is present.

## What’s defined

- **Auth** (`auth/resource.ts`): Cognito User Pool — email + password sign-in.
- **Data** (`data/resource.ts`): AppSync + DynamoDB — models: `UserProfile`, `Product`, `Pledge`, `BulkOrder`.

## Deploy (create Cognito + DynamoDB + AppSync)

From this directory (requires `@aws-amplify/backend-cli`; it's in devDependencies):

```bash
npm install
npx ampx sandbox
```

If you see **"Failed to load default AWS credentials"**, run **`npx ampx configure profile`** first (see `reactnativeapp/docs/AMPLIFY_PROFILE_SETUP.md`).

When sandbox finishes, it generates **amplify_outputs.json**. Copy that file into **`reactnativeapp/`** so the app can connect (see `reactnativeapp/docs/BACKEND_FLOW.md`).

## Flow

React Native → `api.ts` → (when configured) `backend.ts` → Amplify Data/Auth → **AppSync** + **Cognito** → **DynamoDB**.
