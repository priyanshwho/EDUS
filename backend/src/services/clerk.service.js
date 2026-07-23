const { createClerkClient, verifyToken } = require('@clerk/backend');

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
  // authorizedParties: allowed origins for the 'azp' (Authorized Party) JWT claim.
  return await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
    authorizedParties: [
      'https://www.edusphere.live',
      'https://edusphere.live',
      'http://www.edusphere.live',
      'http://edusphere.live',
      'https://edus-tau.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  });
}

module.exports = {
  clerkClient,
  verifyClerkToken,
};
