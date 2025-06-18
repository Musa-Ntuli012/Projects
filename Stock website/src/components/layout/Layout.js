import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';

const drawerWidth = 240;

const Layout = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Stock Movements', icon: <SwapHorizIcon />, path: '/stock-movements' },
    ...(currentUser?.role === 'manager' ? [
      { text: 'Users', icon: <PeopleIcon />, path: '/users' }
    ] : [])
  ];

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: '#ffffff' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ 
          fontWeight: 600,
          color: '#1a237e',
          fontSize: '1.2rem'
        }}>
          Stock Manager
        </Typography>
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#757575' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
              '&.Mui-selected': {
                bgcolor: '#e3f2fd',
                '&:hover': {
                  bgcolor: '#e3f2fd',
                },
                '& .MuiListItemIcon-root': {
                  color: '#1a237e',
                },
                '& .MuiListItemText-primary': {
                  color: '#1a237e',
                  fontWeight: 600,
                },
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: '#757575',
              minWidth: 40,
              '& .MuiSvgIcon-root': {
                fontSize: '1.5rem',
              }
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                }
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            color: '#d32f2f',
            '&:hover': {
              bgcolor: '#ffebee',
            },
          }}
        >
          <ListItemIcon sx={{ 
            color: '#d32f2f',
            minWidth: 40,
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem',
            }
          }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
                fontWeight: 500,
              }
            }}
          />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar sx={{ 
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: '#757575',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ 
              color: '#1a237e',
              fontWeight: 600,
              fontSize: '1.2rem'
            }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'Stock Manager'}
            </Typography>
          </Box>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuClick}
              sx={{ 
                color: '#757575',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32,
                bgcolor: '#1a237e',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: 1,
              }
            }}
          >
            <MenuItem 
              onClick={handleMenuClose}
              sx={{ 
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ 
                  color: '#1a237e',
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {currentUser?.name}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: '#757575',
                  textTransform: 'capitalize'
                }}>
                  {currentUser?.role}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => {
                handleMenuClose();
                handleLogout();
              }}
              sx={{ 
                color: '#d32f2f',
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: '#ffebee',
                }
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid #e0e0e0',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid #e0e0e0',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout; 