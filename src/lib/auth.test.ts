import { sanitizeNextUrl } from './auth';

describe('Security: sanitizeNextUrl (Open Redirect Prevention)', () => {
  it('should return fallback for null or empty values', () => {
    expect(sanitizeNextUrl(null)).toBe('/account/dashboard');
    expect(sanitizeNextUrl('')).toBe('/account/dashboard');
  });

  it('should return fallback for absolute URL phishing attempt', () => {
    expect(sanitizeNextUrl('https://evil.com')).toBe('/account/dashboard');
  });

  it('should return fallback for protocol-relative URL phishing attempt', () => {
    expect(sanitizeNextUrl('//evil.com')).toBe('/account/dashboard');
  });

  it('should return the path for a valid relative URL', () => {
    expect(sanitizeNextUrl('/account/settings')).toBe('/account/settings');
    expect(sanitizeNextUrl('/tour/some-slug-123')).toBe('/tour/some-slug-123');
  });

  it('should return fallback if URL contains schema indicators anywhere', () => {
    expect(sanitizeNextUrl('/some/path?url=https://evil.com')).toBe('/account/dashboard');
  });

  it('should return the path for root relative URL', () => {
    expect(sanitizeNextUrl('/')).toBe('/');
  });
});
