# Configure Amplify Profile (AWS Credentials)

If **`npx ampx sandbox`** fails with:

```text
[InvalidCredentialError] Failed to load default AWS credentials
  ∟ Caused by: [CredentialsProviderError] Could not load credentials from any providers
Resolution: To configure a new Amplify profile, use npx ampx configure profile.
```

you need to configure an Amplify profile so the sandbox can deploy to your AWS account.

---

## Step 1: Run the configure wizard

From the **amplify** folder (same place you run `npx ampx sandbox`):

```bash
cd amplify
npx ampx configure profile
```

- Optional: use **`--name default`** to create/update the default profile, or **`--name YOUR_PROFILE_NAME`** for a named profile.
- The wizard will prompt you to set up AWS credentials.

---

## Step 2: What the wizard may ask for

The wizard may:

1. **Open a browser** for **IAM Identity Center (SSO)** sign-in — you sign in with your AWS SSO user and authorize the CLI.
2. **Ask for an AWS Access Key ID and Secret Access Key** — you create these in the AWS Console: IAM → Users → your user → Security credentials → Create access key. The user needs permission to deploy Amplify (e.g. **AmplifyBackendDeployFullAccess**).
3. **Use an existing AWS CLI profile** — if you already ran `aws configure` or `aws configure sso`, you may be able to link that profile.

Follow the prompts. When it finishes, your local Amplify/AWS profile is ready.

---

## Step 3: Run the sandbox again

From the **amplify** folder:

```bash
npx ampx sandbox
```

If you used a **named profile** (not default), run:

```bash
npx ampx sandbox --profile YOUR_PROFILE_NAME
```

The sandbox will use the credentials you configured and can create Cognito, DynamoDB, and AppSync.

---

## If you already have AWS CLI configured

If you already have an AWS profile (e.g. from `aws configure` or `aws configure sso` in `~/.aws/config`):

1. That profile must have permissions to deploy Amplify backends (e.g. **AmplifyBackendDeployFullAccess**).
2. Run the sandbox with that profile:
   ```bash
   npx ampx sandbox --profile YOUR_PROFILE_NAME
   ```
   No need to run `npx ampx configure profile` unless you want to create a new profile.

---

## Full AWS account setup (no account or SSO yet)

If you don’t have an AWS account or IAM Identity Center (SSO) set up yet, follow the official guide:

**[Configure AWS for local development](https://docs.amplify.aws/react/start/account-setup)**

It walks through:

- Enabling IAM Identity Center
- Creating a user with Amplify permissions
- Setting a password
- Configuring a local AWS profile (e.g. `aws configure sso`)
- Bootstrapping the account for CDK/Amplify

After that, run **`npx ampx sandbox`** (or **`npx ampx sandbox --profile YOUR_PROFILE_NAME`**).
