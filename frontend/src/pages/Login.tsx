import React from 'react';
import { Container, Typography } from '@mui/material';

const Login: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center">
        Login Page
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Login functionality will be implemented here
      </Typography>
    </Container>
  );
};

export default Login; 