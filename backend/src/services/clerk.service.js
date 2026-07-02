const { createClerkClient } = require('@clerk/backend');

// Initialize the Clerk client using the Secret Key from environment variables.
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

/**
 * Verify the Clerk session token (JWT) sent by the frontend.
 * Returns the decoded token payload if valid.
 */
async function verifyClerkToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }
  // verifyToken decodes and validates the Clerk session JWT signature and expiration.
  return await clerkClient.verifyToken(token);
}

module.exports = {
  clerkClient,
  verifyClerkToken,
};
