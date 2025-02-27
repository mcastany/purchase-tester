import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOfferings, postReceipt } from '../services/revenuecat';
import { UserConfig, Config } from '../types';
import { getPaddleInstance, initializePaddle } from '../services/paddle';
import { getSubscriber } from '../services/revenuecat';

const Offering: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offering, setOffering] = useState<any>(null);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaddleInitialized, setIsPaddleInitialized] = useState(false);

  useEffect(() => {
    const initializePaddleFirst = async () => {
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
      if (config.paddleApiKey) {
        try {
          await initializePaddle(config.paddleApiKey);
          setIsPaddleInitialized(true);
        } catch (err) {
          setError('Failed to initialize payment processor');
          return;
        }
      } else {
        setIsPaddleInitialized(true);
      }
    };

    initializePaddleFirst();
  }, []);

  useEffect(() => {
    if (!isPaddleInitialized) return;

    console.log('isPaddleInitialized', isPaddleInitialized);

    const fetchData = async () => {
      const userConfig = JSON.parse(localStorage.getItem('userConfig') || '{}') as UserConfig;
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
      
      try {
        const offeringsData = await getOfferings(config.revenueCatApiKey, userConfig.userId!);
        const selectedOffering = offeringsData.all[id!];
        
        if (!selectedOffering) {
          setError('Offering not found');
          return;
        }
        
        setOffering(selectedOffering);
        const subscriberData = await getSubscriber(config.revenueCatApiKey, userConfig.userId!);
        setSubscriber(subscriberData);
      } catch (err: any) {
        setError(err?.error?.detail || 'Failed to fetch offering details');
      }
    };

    fetchData();
  }, [id, isPaddleInitialized]);

  const isProductPurchased = (productId: string) => {
    return [
      ...Object.keys(subscriber?.subscriber?.subscriptions || {}),
      ...Object.keys(subscriber?.subscriber?.non_subscriptions || {}),
      ...Object.keys(subscriber?.subscriber?.other_purchases || {})
    ].some(
      (pid: string) => pid === productId
    );
  };

  const handlePurchase = async (pkg: any) => {
    try {
      const paddle = getPaddleInstance();
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
      const userConfig = JSON.parse(localStorage.getItem('userConfig') || '{}') as UserConfig;
      

      const checkoutData = {
        items: [{
          priceId: pkg.product.price.id,
          quantity: 1
        }],
        address: config.country ? {
          countryCode: config.country
        } : undefined,
        customData: {
          app_user_id: userConfig.userId
        },
      };
      
      paddle.Update({
        eventCallback: async (data: any) => {
          if (data.name === "checkout.completed") {
            if (!config.noCodeIntegration) {
              if (config.postDelay && config.postDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, config.postDelay));
              }
              await postReceipt(
                config.revenueCatApiKey, 
                userConfig.userId!, 
                data.data.transaction_id,
                id!
              );
            }
            paddle.Checkout.close();
            navigate('/main');
          }
        }
      });

      await paddle.Checkout.open(checkoutData);
    } catch (error) {
      console.error('Error opening Paddle checkout:', error);
    }
  };

  if (error) return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-red-500 mb-4">{error}</div>
      <button
        onClick={() => navigate('/main')}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
      >
        Back to Offerings
      </button>
    </div>
  );

  if (!offering) return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center">Loading...</div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{offering.identifier}</h2>
        <button
          onClick={() => navigate('/main')}
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
        >
          Back
        </button>
      </div>

      <div className="space-y-6">
        {offering.availablePackages.map((pkg: any) => (
          <div key={pkg.identifier} className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{pkg.product.product.name}</h3>
                  {isProductPurchased(pkg.product.price.id) && (
                    <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
                      Purchased
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{pkg.product.product.description}</p>
                <p className="text-gray-600">{pkg.product.type}</p>
              </div>
              <span className="text-2xl font-bold">{pkg.product.formattedTotals.total}</span>
            </div>

            {pkg.product.type === 'SUBSCRIPTION' && (
              <div className="space-y-2">
                <h4 className="font-semibold">Package Details:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Interval: {pkg.product.price.billingCycle.frequency} {pkg.product.price.billingCycle.interval}</li>
                </ul>
                {pkg.product.price.trialPeriod && (
                  <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                    {pkg.product.price.trialPeriod.frequency} {pkg.product.price.trialPeriod.interval} Free Trial
                  </span>
                )}
                {/* Add discount details if there's any */}
                {pkg.discounts && pkg.discounts.length > 0 && (
                  <span className="px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
                    {pkg.discounts[0].type} {pkg.discounts[0].amount}
                  </span>
                )}
                </div>
            )}

            <button
              onClick={() => handlePurchase(pkg)}
              disabled={isProductPurchased(pkg.product.price.id)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProductPurchased(pkg.product.price.id) ? 'Already Purchased' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Offering; 