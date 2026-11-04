export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
} as const;

export const videoConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;
