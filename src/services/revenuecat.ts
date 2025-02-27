import { getProductsByIds, initializePaddle } from "./paddle";
import { Config } from "../types";

const getBaseUrl = (config: Config) => {
  if (config.proxyUrl) {
    return config.proxyUrl.endsWith('/') ? config.proxyUrl.slice(0, -1) : `${config.proxyUrl}/v1`;
  }
  return 'https://api.revenuecat.com/v1';
};

export const getOfferings = async (apiKey: string, userId: string) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
  const baseUrl = getBaseUrl(config);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Platform': 'web'
    };

    const response = await fetch(`${baseUrl}/subscribers/${userId}/offerings`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Initialize Paddle before getting products
    const config = JSON.parse(localStorage.getItem('config') || '{}');
    await initializePaddle(config.paddleApiKey);

    // use paddle to get the products
    // flatten the array
    const products: string[] = data.offerings.flatMap((o: any) => o.packages.map((p: any) => p.platform_product_identifier));
    let paddleProducts: any;
    if (products.length > 0) {
      const response = await getProductsByIds(products);
      paddleProducts = response.data.details.lineItems;
    }

    // Transform the response to match RevenueCat's structure
    const all = data.offerings.reduce((acc: any, offering: any) => {
      acc[offering.identifier] = {
        availablePackages: offering.packages.map((p: any) => {
          const product = paddleProducts.find((pp: any) => pp.price.id === p.platform_product_identifier)

          if (!product) {
            console.log('Product not found on Paddle', p.platform_product_identifier);
            return null;
          }

          // Product is Line item
          product.type = product?.price.billingCycle ? 'SUBSCRIPTION' : 'ONE TIME PURCHASE';
          
          return {
            identifier: p.identifier,
            packageType: '',
            product: product
          };
        })
      };
      return acc;
    }, {});

    const transformedData = {
      current: all[data.current_offering_id],
      all: all
    };

    console.log(transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    throw error;
  }
};

export const getSubscriber = async (apiKey: string, userId: string) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
  const baseUrl = getBaseUrl(config);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Platform': 'web'
    };

    const response = await fetch(`${baseUrl}/subscribers/${userId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    throw error;
  }
};

export const setSubscriberAttribute = async (apiKey: string, userId: string, key: string, value: string) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
  const baseUrl = getBaseUrl(config);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Platform': 'web'
    };

    const response = await fetch(`${baseUrl}/subscribers/${userId}/attributes/${key}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error setting subscriber attribute:', error);
    throw error;
  }
};

export const postReceipt = async (apiKey: string, userId: string, paddleTransactionId: string, offeringId: string) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
  const baseUrl = getBaseUrl(config);

  const RETRYABLE_STATUS_CODES = [425, 429, 502, 503, 504];
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  const makeRequest = async (retryCount: number): Promise<any> => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Platform': 'web',
        'X-Application': 'Purchase tester'
      };

      const response = await fetch(`${baseUrl}/receipts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          app_user_id: userId,
          fetch_token: paddleTransactionId,
          presented_offering_identifier: offeringId
        })
      });

      if (!response.ok) {
        if (retryCount < MAX_RETRIES && RETRYABLE_STATUS_CODES.includes(response.status)) {
          // Calculate exponential backoff delay with jitter
          const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
          console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(retryCount + 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes('fetch')) {
        // Also retry on network errors
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
        console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(retryCount + 1);
      }
      throw error;
    }
  };

  try {
    return await makeRequest(0);
  } catch (error) {
    console.error('Error posting receipt:', error);
    throw error;
  }
}; 






