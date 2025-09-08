import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Simple Home component
const Home = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-4xl font-bold text-blue-600 mb-6">MyStudySwaps</h1>
    <p className="text-lg text-gray-700 mb-4">
      Frontend successfully deployed and ready to connect to backend!
    </p>
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      ✅ Frontend deployment successful
    </div>
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
      🔗 Backend URL: {import.meta.env.VITE_API_URL || 'Not configured yet'}
    </div>
  </div>
);

// Simple About component for testing routing
const About = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-3xl font-bold text-blue-600 mb-6">About MyStudySwaps</h1>
    <p className="text-lg text-gray-700">
      A platform for students to swap study materials and resources.
    </p>
    <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
      ← Back to Home
    </Link>
  </div>
);

// Simple Navigation component
const Navigation = () => (
  <nav className="bg-blue-600 text-white p-4">
    <div className="max-w-4xl mx-auto flex space-x-4">
      <Link to="/" className="hover:underline">Home</Link>
      <Link to="/about" className="hover:underline">About</Link>
    </div>
  </nav>
);

// Main App component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={
            <div className="max-w-4xl mx-auto p-8">
              <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
              <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
