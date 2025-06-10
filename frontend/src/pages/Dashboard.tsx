import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  Skeleton,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookings';
import { listingsApi } from '../api/listings';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useAuth } from '../hooks/useAuth';
import BookingCard from '../components/common/BookingCard';
import ListingCard from '../components/common/ListingCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <Box>
    {Array.from({ length: 3 }).map((_, index) => (
      <Paper key={index} sx={{ p: 3, mb: 2 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={40} />
      </Paper>
    ))}
  </Box>
);

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: myBookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: QUERY_KEYS.BOOKINGS.MY_BOOKINGS,
    queryFn: bookingsApi.getMyBookings,
    enabled: !!user && !user.is_host,
  });

  const { data: incomingBookings, isLoading: incomingLoading, error: incomingError } = useQuery({
    queryKey: QUERY_KEYS.BOOKINGS.INCOMING,
    queryFn: bookingsApi.getIncomingBookings,
    enabled: !!user?.is_host,
  });

  const { data: myListings, isLoading: listingsLoading, error: listingsError } = useQuery({
    queryKey: QUERY_KEYS.LISTINGS.MY_LISTINGS,
    queryFn: listingsApi.getMyListings,
    enabled: !!user?.is_host,
  });

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to view your dashboard.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user.first_name}!
      </Typography>

      <Box sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {!user.is_host && <Tab label="MY BOOKINGS" />}
          {user.is_host && <Tab label="INCOMING BOOKINGS" />}
          {user.is_host && <Tab label="MY LISTINGS" />}
        </Tabs>

        {/* Customer Bookings Tab */}
        {!user.is_host && (
          <TabPanel value={tabValue} index={0}>
            
            {bookingsLoading && <LoadingSkeleton />}
            
            {bookingsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load your bookings. Please try again.
              </Alert>
            )}
            
            {!bookingsLoading && !bookingsError && myBookings && (
              <>
                {myBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No bookings yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Start exploring and book your first stay!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/')}
                    >
                      Browse Listings
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {myBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        isHost={false}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </TabPanel>
        )}

        {/* Host Incoming Bookings Tab */}
        {user.is_host && (
          <TabPanel value={tabValue} index={0}>
            
            {incomingLoading && <LoadingSkeleton />}
            
            {incomingError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load incoming bookings. Please try again.
              </Alert>
            )}
            
            {!incomingLoading && !incomingError && incomingBookings && (
              <>
                {incomingBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No incoming bookings
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      When guests book your listings, they'll appear here.
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {incomingBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        isHost={true}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </TabPanel>
        )}

        {/* Host Listings Tab */}
        {user.is_host && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/create-listing')}
              >
                Add New Listing
              </Button>
            </Box>
            
            {listingsLoading && <LoadingSkeleton />}
            
            {listingsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load your listings. Please try again.
              </Alert>
            )}
            
            {!listingsLoading && !listingsError && myListings && (
              <>
                {myListings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No listings yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first listing to start hosting guests!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/create-listing')}
                    >
                      Create First Listing
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: 3,
                    }}
                  >
                    {myListings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        onClick={() => navigate(`/listings/${listing.id}`)}
                        showEditButton={true}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard; 