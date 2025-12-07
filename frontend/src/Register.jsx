import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
        role: 'USER' // Hardcoded because you shouldnt be able to register as admin
      });
      alert("Registration Successful. Please Login.");
      navigate('/');
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    // Main Container
    <div className="min-h-screen flex items-center justify-center bg-[#050914] px-4">

      {/* Card Container */}
      <div className="w-full max-w-md bg-[#0F1629] rounded-[2rem] p-8 shadow-2xl border border-gray-800">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/smartparklogo.png"
            alt="SmartPark Logo"
            className="w-24 h-24 mx-auto mb-2 object-contain"
          />
          <h1 className="text-3xl font-bold text-white tracking-wide">SmartPark</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">

          {/* Email */}
          <div className="space-y-1">
            <label className="text-gray-300 text-sm ml-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#1A233A] border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-gray-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-gray-300 text-sm ml-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-[#1A233A] border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-gray-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Link */}
          <div className="pt-2 space-y-3"></div>
          <div className="text-center text-gray-400 text-sm">
            Already have an Account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline hover:text-indigo-400 transition-colors">
              Login here
            </Link>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-[#564DEA] hover:bg-[#463DCA] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;