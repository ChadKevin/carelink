import React from 'react';
import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="app-container">
        <header>
          <h1>Rural MedTech</h1>
          <p>Telehealth & Emergency Medical Support for Rural Communities</p>
        </header>
        <main>
          {/* Main application components and routes */}
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
