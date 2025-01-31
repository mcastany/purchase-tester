import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOfferings, postReceipt } from '../services/revenuecat';
import { UserConfig, Config } from '../types';
import { getPaddleInstance } from '../services/paddle';

const Offering: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offering, setOffering] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffering = async () => {
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
      } catch (err) {
        setError('Failed to fetch offering details');
      }
    };

    fetchOffering();
  }, [id]);

  const handlePurchase = async (pkg: any) => {
    try {
      const paddle = getPaddleInstance();
      const checkoutData = {
        items: [{
          priceId: pkg.product.price.id,
          quantity: 1
        }]
      };

      const userConfig = JSON.parse(localStorage.getItem('userConfig') || '{}') as UserConfig;
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
      
      paddle.Update({
        eventCallback: async (data: any) => {
          if (data.name === "checkout.completed") {
            await postReceipt(
              config.revenueCatApiKey, 
              userConfig.userId!, 
              data.data.transaction_id,
              id!
            );
            paddle.Checkout.close();
            navigate('/main');
          }
        }
      })

      await paddle.Checkout.open(checkoutData);
    } catch (error) {
      console.error('Error opening Paddle checkout:', error);
      // You might want to show an error message to the user here
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
                <h3 className="text-xl font-bold">{pkg.product.product.name}</h3>
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
                </div>
            )}

            <button
              onClick={() => handlePurchase(pkg)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Offering; 