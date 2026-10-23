/**
 * Auth0 Action: Post Login — MI SML
 * Add to the Login flow for the Mi SML Web application.
 * These namespaced claims are read only from the signed access token on the server.
 */
exports.onExecutePostLogin = async (event, api) => {
  const email = typeof event.user.email === 'string'
    ? event.user.email.trim().toLowerCase()
    : '';
  const verified = event.user.email_verified === true;

  if (email) {
    api.accessToken.setCustomClaim('https://strikingmotionlab.com/email', email);
    api.accessToken.setCustomClaim('https://strikingmotionlab.com/email_verified', verified);
  }
};
