import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">MyStudySwaps</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Frontend deployment successful!
        </div>
        <p className="text-lg text-gray-700 mb-4">
          Ready to connect to backend API.
        </p>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Backend URL: {import.meta.env.VITE_API_URL || 'Not configured yet'}
        </div>
      </div>
    </div>
  );
}

export default App;
