import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to your account.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.response?.data?.message || 'Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="mt-2"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <h3 className="font-medium text-secondary-foreground mb-2">Demo Credentials</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Username:</strong> demo</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;