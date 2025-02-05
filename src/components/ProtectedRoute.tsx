import { Navigate } from 'react-router-dom';
import { Config } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const config = JSON.parse(localStorage.getItem('config') || '{}') as Config;
  const isPaddleKey = (key: string) => key.startsWith('pdl_') || key.startsWith('pdl_');
  
  if (!config.revenueCatApiKey || (isPaddleKey(config.revenueCatApiKey) && !config.paddleApiKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 