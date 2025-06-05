import React from 'react';
import { Container, Typography } from '@mui/material';

const CreateListing: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" align="center">
        Create Listing
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Create listing form will be implemented here
      </Typography>
    </Container>
  );
};

export default CreateListing; 