import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Box,
  Link,
  Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FormField from '../components/common/FormField';
import { UserLogin } from '../types';

const Login: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const { control, handleSubmit, formState: { errors } } = useForm<UserLogin>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: UserLogin) => {
    try {
      setIsLoading(true);
      setError('');
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to your StayHub account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email',
                },
              }}
              label="Email Address"
              type="email"
              fullWidth
              autoComplete="email"
              sx={{ mb: 3 }}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <FormField
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              label="Password"
              type="password"
              fullWidth
              autoComplete="current-password"
              sx={{ mb: 3 }}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 3 }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?
            </Typography>
          </Divider>

          <Box textAlign="center">
            <Link component={RouterLink} to="/register" variant="body1" underline="hover">
              Create your StayHub account
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login; 