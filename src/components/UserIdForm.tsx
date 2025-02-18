import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserConfig } from '../types';

const UserIdForm: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');

  const generateAnonymousId = () => {
    const uuid = crypto.randomUUID();
    return `$RCAnonymousID:${uuid}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userConfig: UserConfig = {
      userId: userId || generateAnonymousId(),
      isAnonymous: !userId
    };
    localStorage.setItem('userConfig', JSON.stringify(userConfig));
    navigate('/main');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">User Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            App User ID (optional)
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your user ID"
          />
        </div>
        <div className="flex flex-col space-y-4 pt-4">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
          >
            Continue with User ID
          </button>
          <button
            type="button"
            onClick={() => {
              setUserId('');
              handleSubmit(new Event('submit') as any);
            }}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition duration-150 ease-in-out shadow-sm"
          >
            Continue with Anonymous ID
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserIdForm; 