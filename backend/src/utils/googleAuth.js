import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const verifyGoogleToken = async (idToken) => {
  if (!idToken) {
    throw new Error("Google ID token is required");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token payload");
  }

  return payload;
};

export { verifyGoogleToken };