export interface Config {
  revenueCatApiKey: string;
  paddleApiKey?: string;
  noCodeIntegration?: boolean;
  proxyUrl?: string;
  postDelay?: number;
}

export interface UserConfig {
  userId?: string;
  isAnonymous: boolean;
}