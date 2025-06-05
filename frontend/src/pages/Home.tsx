import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listingsApi } from '../api/listings';
import { ListingSearch } from '../types';
import SearchForm from '../components/common/SearchForm';
import ListingCard from '../components/common/ListingCard';
import { QUERY_KEYS } from '../constants/queryKeys';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<ListingSearch>({});

  const { data: listings = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.LISTINGS.LIST(searchParams),
    queryFn: () => listingsApi.getListings(searchParams),
  });

  const handleSearch = (data: ListingSearch) => {
    setSearchParams(data);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary" sx={{ mb: 4 }}>
        Find Your Perfect Stay
      </Typography>

      {/* Search Section */}
      <Box sx={{ mb: 4 }}>
        <SearchForm onSearch={handleSearch} initialValues={searchParams} />
      </Box>

      {/* Listings Grid */}
      <Grid container spacing={3}>
        {listings.map((listing) => (
          <Grid item xs={12} sm={6} md={4} key={listing.id}>
            <ListingCard
              listing={listing}
              onClick={() => navigate(`/listings/${listing.id}`)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {listings.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary">
            No listings found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search criteria
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Home; 