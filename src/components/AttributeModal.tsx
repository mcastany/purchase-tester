import React, { useState } from 'react';
import { setSubscriberAttribute } from '../services/revenuecat';
import { UserConfig, Config } from '../types';

interface AttributeModalProps {
  onClose: () => void;
}

const AttributeModal: React.FC<AttributeModalProps> = ({ onClose }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const userConfig = JSON.parse(localStorage.getItem('userConfig') || '{}') as UserConfig;
      const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;

      await setSubscriberAttribute(config.revenueCatApiKey, userConfig.userId!, key, value);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError('Failed to set attribute');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Set Subscriber Attribute</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Attribute Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Attribute Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">Attribute set successfully!</p>}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Set Attribute
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttributeModal; 