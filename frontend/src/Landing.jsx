import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  // I'm defining the button styles here once, since they are used twice.
  const buttonStyle = "w-full block text-center bg-[#564DEA] hover:bg-[#463DCA] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0";

  return (
    // Main Background: Same deep navy as other pages
    <div className="min-h-screen flex items-center justify-center bg-[#050914] px-4 font-sans">

      {/* Card Container: Same style as Login/Register cards */}
      <div className="w-full max-w-md bg-[#0F1629] rounded-[2rem] p-8 shadow-2xl border border-gray-800">

        {/* Logo Section */}
        <div className="text-center mb-10">
          <img
            src="/smartparklogo.png"
            alt="SmartPark Logo"
            className="w-24 h-24 mx-auto mb-2 object-contain"
          />
          <h1 className="text-3xl font-bold text-white tracking-wide">SmartPark</h1>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Register Button (/register) */}
          <Link to="/register" className={buttonStyle}>
            Register
          </Link>

          {/* Login Button (/login) */}
          <Link to="/login" className={buttonStyle}>
            Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Landing;