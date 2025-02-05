import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Config } from '../types';

const ConfigForm: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<Config>({
    revenueCatApiKey: '',
    paddleApiKey: '',
    noCodeIntegration: false,
    proxyUrl: '',
    postDelay: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isPaddleKey = (key: string) => key.startsWith('pdl_') || key.startsWith('pdl_');

  useEffect(() => {
    const savedConfig = localStorage.getItem('config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig) as Config;
        setConfig(parsedConfig);
        if (parsedConfig.proxyUrl || parsedConfig.noCodeIntegration) {
          setShowAdvanced(true);
        }
      } catch (err) {
        console.error('Error parsing saved config:', err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    if (isPaddleKey(config.revenueCatApiKey) && !config.paddleApiKey) {
      setError('Paddle API key is required for Paddle integration');
      setIsValidating(false);
      return;
    }

    localStorage.setItem('config', JSON.stringify(config));
    navigate('/user');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            RevenueCat API Key
          </label>
          <input
            type="text"
            value={config.revenueCatApiKey}
            onChange={(e) => setConfig({ ...config, revenueCatApiKey: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter RevenueCat API key"
            required
          />
        </div>

        {isPaddleKey(config.revenueCatApiKey) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paddle API Key
            </label>
            <input
              type="text"
              value={config.paddleApiKey}
              onChange={(e) => setConfig({ ...config, paddleApiKey: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Paddle API key"
              required={isPaddleKey(config.revenueCatApiKey)}
            />
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            {showAdvanced ? '- Hide' : '+ Show'} Advanced Settings
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Proxy URL
              </label>
              <input
                type="url"
                value={config.proxyUrl}
                onChange={(e) => setConfig({ ...config, proxyUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter proxy URL (optional)"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="noCodeIntegration"
                checked={config.noCodeIntegration}
                onChange={(e) => setConfig({ ...config, noCodeIntegration: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="noCodeIntegration" className="ml-2 block text-sm text-gray-900">
                No Code Integration
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Post Receipt Delay (ms)
              </label>
              <input
                type="number"
                value={config.postDelay}
                onChange={(e) => setConfig({ ...config, postDelay: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter delay in milliseconds"
                min="0"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isValidating}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default ConfigForm; 