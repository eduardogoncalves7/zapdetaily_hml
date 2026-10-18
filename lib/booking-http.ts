import { AttemptRateLimiter } from "./auth-rate-limit";

export const CUSTOMER_COOKIE = "zd_customer_key";
export const bookingRateLimiter = new AttemptRateLimiter(20, 60_000);
export const bookingReadRateLimiter = new AttemptRateLimiter(60, 60_000);
