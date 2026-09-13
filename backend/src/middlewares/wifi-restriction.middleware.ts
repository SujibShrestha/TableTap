import type { Request, Response, NextFunction } from 'express';
import { getClientIp } from 'request-ip';

export function restrictToRestaurantWifi(req: Request, res: Response, next: NextFunction) {
  const allowedIpsEnv = process.env.RESTAURANT_ALLOWED_IPS;

  // if not configured, skip restriction entirely (useful for local dev)
  if (!allowedIpsEnv) {
    return next();
  }
  const allowedIps = allowedIpsEnv.split(",").map((ip) => ip.trim());
  const clientIp = getClientIp(req);

  if (!clientIp || !allowedIps.includes(clientIp)) {
    return res.status(403).json({
      error: "Please connect to the restaurant WiFi to use this feature.",
    });
  }

  next();
}