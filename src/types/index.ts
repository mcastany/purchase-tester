export interface Config {
  revenueCatApiKey: string;
  paddleApiKey?: string;
  noCodeIntegration?: boolean;
  proxyUrl?: string;
  postDelay?: number;
  country?: string;
}

export interface UserConfig {
  userId?: string;
  isAnonymous: boolean;
}