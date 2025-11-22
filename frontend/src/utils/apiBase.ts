const LOCAL_DEV_BACKEND_TARGETS = [
  'http://localhost:5001',
  'https://localhost:5001',
  'http://127.0.0.1:5001',
  'https://127.0.0.1:5001'
];

const DEFAULT_FALLBACK_BACKEND = 'http://localhost:5001';
const isBrowser = typeof window !== 'undefined';

type GetApiBaseUrlOptions = {
  /**
   * When true, prefer using a relative URL so Next.js rewrites can proxy requests
   * through the same origin (helpful in development to avoid CORS issues).
   */
  preferProxy?: boolean;
};

const getEnvValue = (key: string): string | undefined =>
  typeof process !== 'undefined' ? process.env[key]?.trim() : undefined;

const isLocalDevTarget = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }
  return LOCAL_DEV_BACKEND_TARGETS.some((target) => url.startsWith(target));
};

export const getApiBaseUrl = (options: GetApiBaseUrlOptions = {}): string => {
  const preferProxy = options.preferProxy ?? isBrowser;
  const envBaseUrl = getEnvValue('NEXT_PUBLIC_API_URL');
  const disableProxy = getEnvValue('NEXT_PUBLIC_DISABLE_PROXY') === 'true';
  const fallbackBackend = getEnvValue('BACKEND_URL') || DEFAULT_FALLBACK_BACKEND;

  if (!preferProxy || disableProxy) {
    return envBaseUrl || fallbackBackend;
  }

  // No env configured, rely on same-origin relative URLs
  if (!envBaseUrl) {
    return '';
  }

  // When pointing to a local dev backend, use relative URLs so Next.js rewrites proxy requests
  if (isLocalDevTarget(envBaseUrl)) {
    return '';
  }

  // Otherwise, honor the configured absolute URL (e.g., staging/production)
  return envBaseUrl;
};

export default getApiBaseUrl;
