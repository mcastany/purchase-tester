import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ConfigForm from './components/ConfigForm';
import UserIdForm from './components/UserIdForm';
import Main from './components/Main';
import Offering from './components/Offerings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
            Purchase Tester
          </h1>
          <Routes>
            <Route path="/" element={<ConfigForm />} />
            <Route path="/user" element={
              <ProtectedRoute>
                <UserIdForm />
              </ProtectedRoute>
            } />
            <Route path="/main" element={
              <ProtectedRoute>
                <Main />
              </ProtectedRoute>
            } />
            <Route path="/offerings/:id" element={
              <ProtectedRoute>
                <Offering />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
