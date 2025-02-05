import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOfferings, getSubscriber } from '../services/revenuecat';
import { UserConfig, Config } from '../types';
import AttributeModal from './AttributeModal';

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState<any>(null);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [subscriberError, setSubscriberError] = useState<string | null>(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userConfig = JSON.parse(localStorage.getItem('userConfig') || '{}') as UserConfig;
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
      
      if (!config.revenueCatApiKey) {
        setOfferingsError('RevenueCat API key not found');
        setSubscriberError('RevenueCat API key not found');
        return;
      }

      // Fetch offerings
      try {
        const offeringsData = await getOfferings(config.revenueCatApiKey, userConfig.userId!);
        setOfferings(offeringsData);
      } catch (err) {
        setOfferingsError('Failed to fetch offerings');
      }

      // Fetch subscriber data
      try {
        const subscriberData = await getSubscriber(config.revenueCatApiKey, userConfig.userId!);
        setSubscriber(subscriberData);
      } catch (err) {
        setSubscriberError('Failed to fetch subscriber data');
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userConfig');
    navigate('/user');
  };

  const handleReset = () => {
    localStorage.removeItem('config');
    localStorage.removeItem('userConfig');
    navigate('/');
  };

  const handleOfferingClick = (id: string) => {
    navigate(`/offerings/${id}`);
  };

  const renderSubscriberInfo = () => {
    if (!subscriber) return null;

    if (showRawJson) {
      return (
        <textarea
          className="w-full h-96 p-4 font-mono text-sm bg-gray-50 border rounded-lg"
          value={JSON.stringify(subscriber, null, 2)}
          readOnly
        />
      );
    }

    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold whitespace-nowrap">User ID:</span>
            <span className="truncate">{subscriber.subscriber.original_app_user_id}</span>
          </div>
          <p><span className="font-semibold">First Seen:</span> {new Date(subscriber.subscriber.first_seen).toLocaleDateString()}</p>
          <p><span className="font-semibold">Management URL:</span> <a href={subscriber.subscriber.management_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Open</a></p>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Subscriber Info Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Customer Information</h2>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                {showRawJson ? 'Show Formatted' : 'Show Raw JSON'}
              </button>
            </div>
            {subscriberError ? (
              <div className="text-red-500">{subscriberError}</div>
            ) : (
              renderSubscriberInfo()
            )}
          </div>

          {/* Entitlements Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Active Entitlements</h2>
            {subscriberError ? (
              <div className="text-red-500">{subscriberError}</div>
            ) : !subscriber ? (
              <div>Loading entitlements...</div>
            ) : Object.keys(subscriber.subscriber.entitlements).length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No active entitlements
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(subscriber.subscriber.entitlements).map(([id, entitlement]: [string, any]) => (
                  <div key={id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{id}</h3>
                        <p className="text-sm text-gray-600">
                          Expires: {entitlement.expires_date ? new Date(entitlement.expires_date).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        entitlement.active || !entitlement.expires_date ?  'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entitlement.active || !entitlement.expires_date  ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Purchased Products Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Purchased Products</h2>
            {subscriberError ? (
              <div className="text-red-500">{subscriberError}</div>
            ) : !subscriber ? (
              <div>Loading purchases...</div>
            ) : (Object.keys(subscriber.subscriber.subscriptions).length === 0 && 
                Object.keys(subscriber.subscriber.non_subscriptions).length === 0 &&
                Object.keys(subscriber.subscriber.other_purchases).length === 0) ? (
              <div className="text-gray-500 text-center py-4">
                No purchased products
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subscriptions */}
                {Object.entries(subscriber.subscriber.subscriptions).map(([productId, subscription]: [string, any]) => (
                  <div key={productId} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{productId}</h3>
                          <span className="text-sm text-gray-600">Type: Subscription</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          subscription.unsubscribe_detected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {subscription.unsubscribe_detected ? 'Cancelled' : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Purchase Date: {new Date(subscription.purchase_date).toLocaleDateString()}
                      </p>
                      {subscription.expires_date && (
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(subscription.expires_date).toLocaleDateString()}
                        </p>
                      )}
                      {subscription.store && (
                        <p className="text-sm text-gray-600">
                          Store: {subscription.store}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Non-Subscriptions */}
                {Object.entries(subscriber.subscriber.non_subscriptions).map(([productId, purchases]) => (
                  Array.isArray(purchases) && purchases.map((purchase, index) => (
                    <div key={`${productId}-${index}`} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{productId}</h3>
                            <span className="text-sm text-gray-600">Type: One-time Purchase</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Purchase Date: {new Date(purchase.purchase_date).toLocaleDateString()}
                        </p>
                        {purchase.store && (
                          <p className="text-sm text-gray-600">
                            Store: {purchase.store}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ))}

                {/* Other Purchases */}
                {Object.entries(subscriber.subscriber.other_purchases).map(([productId, purchases]) => (
                  Array.isArray(purchases) && purchases.map((purchase, index) => (
                    <div key={`${productId}-${index}`} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{productId}</h3>
                            <span className="text-sm text-gray-600">Type: Other Purchase</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Purchase Date: {new Date(purchase.purchase_date).toLocaleDateString()}
                        </p>
                        {purchase.store && (
                          <p className="text-sm text-gray-600">
                            Store: {purchase.store}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            )}
          </div>

          {/* Offerings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Available Offerings</h2>
            {offeringsError ? (
              <div className="text-red-500">{offeringsError}</div>
            ) : !offerings ? (
              <div>Loading offerings...</div>
            ) : !offerings.all || Object.keys(offerings.all).length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No offerings available at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(offerings.all).map((key: string) => (
                  <div 
                    key={key} 
                    className="border p-4 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => handleOfferingClick(key)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{key}</h4>
                          <span className="text-sm text-gray-500">
                            ({offerings.all[key].availablePackages.length} package{offerings.all[key].availablePackages.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {/* {offering.description && (
                          <p className="text-gray-600">{offering.description}</p>
                        )} */}
                      </div>
                      {offerings.current?.identifier === key && (
                        <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {offerings.all[key].availablePackages.map((pkg: any) => (
                        <div key={pkg.identifier} className="border rounded p-3">
                          <p className="font-medium">{pkg.identifier}</p>
                          {pkg.identifier && (
                            <p className="text-sm text-gray-600">
                              Product ID: {pkg.identifier}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => setShowAttributeModal(true)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
        >
          Set Subscriber Attributes
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
        >
          Logout
        </button>
        <button
          onClick={handleReset}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
        >
          Reset Configuration
        </button>
      </div>

      {showAttributeModal && (
        <AttributeModal 
          onClose={() => setShowAttributeModal(false)} 
        />
      )}
    </div>
  );
};

export default Main; 