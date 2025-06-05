import React from 'react';
import { Container, Typography } from '@mui/material';

const Register: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center">
        Register Page
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Registration functionality will be implemented here
      </Typography>
    </Container>
  );
};

export default Register; 