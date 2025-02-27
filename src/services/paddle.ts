import { getPaddleInstance as getPaddle, initializePaddle as initPaddle, Paddle } from '@paddle/paddle-js';
import { Config } from '../types';

let paddleInstance: Paddle | undefined;

export const initializePaddle = async (apiKey: string) => {
  try {
    await initPaddle({
      token: apiKey,
      environment: 'sandbox'
    });
    paddleInstance = getPaddle();
  } catch (error) {
    console.error('Error initializing Paddle:', error);
    throw error;
  }
};

export const getPaddleInstance = () => {
  
  if (!paddleInstance) {
    throw new Error('Paddle not initialized');
  }
  return paddleInstance;
};


export const getProductsByIds = async (productIds: string[]) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;

  const request = {
    items: productIds.map((priceId) => ({
      quantity: 1,
      priceId
    })),
    address: config.country ? {
      countryCode: config.country
    } : undefined
  };
  
  const paddle = getPaddleInstance();

  return await paddle.PricePreview(request);
};