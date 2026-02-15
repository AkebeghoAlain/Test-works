import crypto from 'crypto';

export const signQrPayload = (payload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

export const safeEqual = (a: string, b: string) => {
  const one = Buffer.from(a, 'utf8');
  const two = Buffer.from(b, 'utf8');
  if (one.length !== two.length) return false;
  return crypto.timingSafeEqual(one, two);
};
