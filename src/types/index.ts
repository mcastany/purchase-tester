export interface Config {
  revenueCatApiKey: string;
  paddleApiKey: string;
  noCodeIntegration?: boolean;
  proxyUrl?: string;
}

export interface UserConfig {
  userId?: string;
  isAnonymous: boolean;
}