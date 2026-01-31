import { defineAuth } from '@aws-amplify/backend';

/**
 * Cognito User Pool for Metropolis Bulk Buy
 * - Email + password sign-in (required for pre-auth / card holds later)
 * - Frontend uses this for Auth.signIn / Auth.signUp / Auth.currentAuthenticatedUser
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    password: true,
  },
});
