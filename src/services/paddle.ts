import { getPaddleInstance as getPaddle, initializePaddle as initPaddle, Paddle } from '@paddle/paddle-js';

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
  const request = {
    items: productIds.map((priceId) => ({
      quantity: 1,
      priceId
    })),
    address: {
      countryCode: 'US'
    }
  };
  
  const paddle = getPaddleInstance();
  const products = await paddle.PricePreview(request);

  return products;
};