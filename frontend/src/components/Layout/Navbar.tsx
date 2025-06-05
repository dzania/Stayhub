import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import { Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  return (
    <AppBar position="static" color="transparent" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="primary"
          aria-label="home"
          onClick={() => navigate('/')}
        >
          <Home />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
          StayHub
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user.is_host && (
              <Button color="primary" onClick={() => navigate('/create-listing')}>
                Add Listing
              </Button>
            )}
            <Button color="primary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="primary"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.first_name[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="primary" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 