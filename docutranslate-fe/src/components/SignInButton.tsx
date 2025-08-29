import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface SignInButtonProps {
  className?: string;
}

export const SignInButton: React.FC<SignInButtonProps> = ({ className }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleButtonClick = () => {
    console.log('Button clicked, showSignIn will be:', !showSignIn); // Debug log
    setShowSignIn(true);
    setError('');
  };

  const handleClose = () => {
    console.log('Closing modal'); // Debug log
    setShowSignIn(false);
    setFormData({ email: '', password: '' });
    setError('');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close modal when clicking outside the card
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call for testing (remove this and add your real API)
    setTimeout(() => {
      console.log('Form submitted with:', formData);
      alert('Form submitted! (This is just a test)');
      setIsLoading(false);
      handleClose();
    }, 1000);

    // Uncomment below for real API call
    /*
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        handleClose();
        alert('Sign in successful!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Sign in failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
    */
  };

  // Debug: log the current state
  console.log('Current showSignIn state:', showSignIn);

  return (
    <div>
      {/* Sign In Button */}
      <Button 
        variant="outline"
        className={className}
        onClick={handleButtonClick}
      >
        Sign In
      </Button>

      {/* Debug text (remove this after testing) */}
      <div className="text-xs text-gray-500 mt-1">
        Modal state: {showSignIn ? 'OPEN' : 'CLOSED'}
      </div>

      {/* Modal Overlay */}
      {showSignIn && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={handleOverlayClick}
          style={{ zIndex: 9999 }} // Inline style as backup
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* Sign In Form Card */}
            <Card className="w-[400px] max-w-[90vw] bg-white shadow-2xl">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0 z-10"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                      {error}
                    </div>
                  )}
                  
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  {/* Cancel Button */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

