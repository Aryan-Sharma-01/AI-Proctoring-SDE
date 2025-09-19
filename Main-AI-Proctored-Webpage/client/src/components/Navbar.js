import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  VideoCall,
  Assessment,
  Dashboard,
  Logout,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <VideoCall sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Video Proctoring System
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Dashboard
          </Button>
          
          <Button
            color="inherit"
            startIcon={<VideoCall />}
            onClick={() => navigate('/interview')}
            sx={{
              backgroundColor: isActive('/interview') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Interview
          </Button>
          
          <Button
            color="inherit"
            startIcon={<Assessment />}
            onClick={() => navigate('/reports')}
            sx={{
              backgroundColor: isActive('/reports') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Reports
          </Button>
        </Box>

        <Box sx={{ ml: 2 }}>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            aria-label="account menu"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.username || 'User'}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
