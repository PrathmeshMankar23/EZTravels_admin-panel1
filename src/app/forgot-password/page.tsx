'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.forgotPassword(email);
      setSuccess('OTP has been sent to your email.');
      setSavedEmail(email);
      setShowOtpStep(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    router.push('/reset-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            {showOtpStep ? 'OTP Sent' : 'Forgot Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            {showOtpStep 
              ? 'Check your email for the OTP and use it to reset your password'
              : 'Enter your email address and we\'ll send you an OTP to reset your password'
            }
          </p>
        </div>
        
        {!showOtpStep ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input rounded-md"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-4 rounded-md">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">OTP Sent Successfully!</p>
                  <p className="text-sm mt-1">Check {savedEmail} for the OTP</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                The OTP will expire in 10 minutes.
              </p>
              
              <button
                onClick={handleResetPassword}
                className="btn btn-primary w-full"
              >
                Enter OTP & Reset Password
              </button>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpStep(false);
                    setSuccess('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500 block"
                >
                  Send OTP to different email
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-600 hover:text-gray-500 block"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
