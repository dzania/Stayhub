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
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FormField from '../components/common/FormField';
import { UserCreate } from '../types';

interface RegisterFormData extends UserCreate {
  confirmPassword: string;
  acceptTerms: boolean;
}

const Register: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      phone: '',
      is_host: false,
      acceptTerms: false,
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');

      // Form validation will handle acceptTerms requirement

      const { confirmPassword: _confirmPassword, acceptTerms: _acceptTerms, ...userData } = data;
      await registerUser(userData);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Join StayHub
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create your account to start booking amazing stays
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormField
                  name="first_name"
                  control={control}
                  rules={{
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters',
                    },
                  }}
                  label="First Name"
                  fullWidth
                  autoComplete="given-name"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormField
                  name="last_name"
                  control={control}
                  rules={{
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters',
                    },
                  }}
                  label="Last Name"
                  fullWidth
                  autoComplete="family-name"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                />
              </Grid>

              <Grid item xs={12}>
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
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormField
                  name="username"
                  control={control}
                  rules={{
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores',
                    },
                  }}
                  label="Username"
                  fullWidth
                  autoComplete="username"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormField
                  name="phone"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[+]?[\d\s\-()]+$/,
                      message: 'Please enter a valid phone number',
                    },
                  }}
                  label="Phone Number (Optional)"
                  type="tel"
                  fullWidth
                  autoComplete="tel"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormField
                  name="confirmPassword"
                  control={control}
                  rules={{
                    required: 'Please confirm your password',
                    validate: (value: string) =>
                      value === watchPassword || 'Passwords do not match',
                  }}
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="is_host"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="I want to list my property as a host"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="acceptTerms"
                  control={control}
                  rules={{ required: 'Please accept the terms and conditions' }}
                  render={({ field }) => (
                    <FormControlLabel
                      required
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I agree to the{' '}
                          <Link href="#" underline="hover">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="#" underline="hover">
                            Privacy Policy
                          </Link>
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
          </Divider>

          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body1" underline="hover">
              Sign in to your account
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register; 