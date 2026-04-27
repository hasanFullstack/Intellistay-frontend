import api from "./axios";

// Start Stripe Connect Express onboarding — returns { url, accountId }
export const startConnectOnboarding = () => api.post("/owners/stripe/connect/onboard");
// Get current Connect account status — returns { connected, accountId, onboardingComplete }
export const getConnectStatus = () => api.get("/owners/stripe/connect/status");
// Get a Stripe Express dashboard login link for the connected owner
export const createStripeDashboardLink = () => api.post("/owners/stripe/connect/dashboard-link");
// Disconnect Stripe Connect account
export const disconnectStripe = () => api.delete("/owners/stripe/connect");

export default { startConnectOnboarding, getConnectStatus, createStripeDashboardLink, disconnectStripe };
