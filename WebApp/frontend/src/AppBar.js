import React, { useState } from 'react';
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Container, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Menu, 
  MenuItem 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AppBarComponent = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const openMenu = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleAccountMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('logged');
    window.location.assign('/');
  };

  const handleDrawerNavigation = async (section) => {
    if (section === 'borrow' || section === 'return') {
      try {
        const response = await axios.post('/select-action', { action: section });
        console.log(`Action set to ${section}:`, response.data.message);
      } catch (error) {
        console.error('Error setting action:', error.response?.data || error);
        alert(
          error.response?.data?.message || 'Failed to set action. Please try again.'
        );
        return;
      }
    }

    // Navigate to the respective route
    switch (section) {
      case 'home':
        navigate('/');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'borrow':
        navigate('/borrow-book');
        break;
      case 'return':
        navigate('/return-book');
        break;
      default:
        console.error('Invalid section');
    }

    setDrawerOpen(false); // Close the drawer after navigation
  };

  return (
    <Box>
      {/* Main AppBar */}
      <MuiAppBar position="sticky" sx={{ backgroundColor: '#455a64', borderRadius: '10px' }}>
        <Toolbar>
          {/* Menu Icon to open Drawer */}
          <IconButton 
            edge="start" 
            style={{ color: '#ffe393' }} 
            aria-label="menu" 
            sx={{ mr: 2 }} 
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#ffe393' }}>
            <b>NFC LIBRARY CATALOG</b>
          </Typography>

          {/* Account Icon */}
          <IconButton style={{ color: '#ffe393' }} onClick={handleAccountMenuOpen}>
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </MuiAppBar>

      {/* Drawer for navigation */}
      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <Box sx={{ width: 250, backgroundColor: '#455a64', height: '100%', color: '#ffe393' }} role="presentation">
          <List>
            <ListItem button onClick={() => handleDrawerNavigation('home')}>
              <HomeIcon sx={{ mr: 2, color: '#ffe393' }} />
              <ListItemText primary="Home" sx={{ color: '#ffe393' }} />
            </ListItem>
            <ListItem button onClick={() => handleDrawerNavigation('attendance')}>
              <CheckCircleIcon sx={{ mr: 2, color: '#ffe393' }} />
              <ListItemText primary="Attendance" sx={{ color: '#ffe393' }} />
            </ListItem>
            <ListItem button onClick={() => handleDrawerNavigation('borrow')}>
              <LibraryBooksIcon sx={{ mr: 2, color: '#ffe393' }} />
              <ListItemText primary="Borrow Book" sx={{ color: '#ffe393' }} />
            </ListItem>
            <ListItem button onClick={() => handleDrawerNavigation('return')}>
              <ImportContactsIcon sx={{ mr: 2, color: '#ffe393' }} />
              <ListItemText primary="Return Book" sx={{ color: '#ffe393' }} />
            </ListItem>
          </List>
          <Divider sx={{ backgroundColor: '#ffe393' }} />
        </Box>
      </Drawer>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleAccountMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            backgroundColor: '#455a64',
            color: '#ffe393',
          },
        }}
      >
        <MenuItem
          onClick={() => console.log('Viewing Profile')}
          sx={{
            '&:hover': { backgroundColor: '#607d8b' },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PersonIcon sx={{ color: '#ffe393', width: 24, height: 24 }} />
          Profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            '&:hover': { backgroundColor: '#607d8b' },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LogoutRoundedIcon sx={{ color: '#ffe393', width: 24, height: 24 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Content of the page */}
      <Container sx={{ marginTop: 4 }}>
        {/* Place content here (e.g., Attendance Display, Borrow Book, etc.) */}
      </Container>
    </Box>
  );
};

export default AppBarComponent;
