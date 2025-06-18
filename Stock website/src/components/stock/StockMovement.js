import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { stockMovementService } from '../../services/stockMovementService';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';

const XLSX = require('xlsx');
const FileSaver = require('file-saver');

const StockMovement = () => {
  const { currentUser } = useAuth();
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'stock_in',
    quantity: '',
    location: '',
    notes: '',
    transferToLocation: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    let unsubscribeMovements;
    let unsubscribeInventory;
    
    const setupData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Subscribe to inventory updates first
        unsubscribeInventory = stockMovementService.subscribeToInventory((updatedItems) => {
          let filteredUpdatedItems = updatedItems;
          if (currentUser?.role === 'front_packer') {
            filteredUpdatedItems = updatedItems.filter(item => item.location === 'Front Warehouse');
          } else if (currentUser?.role === 'back_packer') {
            filteredUpdatedItems = updatedItems.filter(item => item.location === 'Back Warehouse');
          }
          setItems(filteredUpdatedItems);
        });

        // Load initial movements
        const initialMovements = await stockMovementService.getPaginatedMovements(ITEMS_PER_PAGE);
        setMovements(initialMovements.movements);
        setLastDoc(initialMovements.lastDoc);
        setHasMore(initialMovements.hasMore);

        // Subscribe to real-time updates for the first page
        unsubscribeMovements = stockMovementService.subscribeToMovements((updatedMovements) => {
          if (page === 1) {
            setMovements(updatedMovements);
          }
        }, ITEMS_PER_PAGE);
      } catch (err) {
        console.error('Error setting up data:', err);
        setError(err.message || 'Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    setupData();

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeMovements) {
        unsubscribeMovements();
      }
      if (unsubscribeInventory) {
        unsubscribeInventory();
      }
    };
  }, [currentUser?.role]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      setError(null);
      
      const result = await stockMovementService.getPaginatedMovements(ITEMS_PER_PAGE, lastDoc);
      setMovements(prev => [...prev, ...result.movements]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more movements:', err);
      setError(err.message || 'Failed to load more movements. Please try again later.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpen = (movement = null) => {
    if (movement) {
      setFormData({
        itemId: movement.itemId,
        type: movement.type,
        quantity: movement.quantity,
        location: movement.location || '',
        notes: movement.notes || '',
        transferToLocation: movement.transferToLocation || ''
      });
      setEditingId(movement.id);
    } else {
      setFormData({
        itemId: '',
        type: 'stock_in',
        quantity: '',
        location: '',
        notes: '',
        transferToLocation: ''
      });
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      itemId: '',
      type: 'stock_in',
      quantity: '',
      location: '',
      notes: '',
      transferToLocation: ''
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Automatically set transfer destination based on source location
      if (name === 'location' && prev.type === 'transfer') {
        newData.transferToLocation = value === 'Front Warehouse' ? 'Back Warehouse' : 'Front Warehouse';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.itemId || !formData.quantity) {
        throw new Error('Please fill in all required fields');
      }

      const quantity = Number(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      // For transfers, validate both locations
      if (formData.type === 'transfer' && (!formData.location || !formData.transferToLocation)) {
        throw new Error('Both source and destination locations are required for transfers');
      }

      if (formData.type === 'transfer' && formData.location === formData.transferToLocation) {
        throw new Error('Source and destination locations cannot be the same');
      }

      // Add user information to the movement
      const movementData = {
        ...formData,
        userId: currentUser?.uid
      };

      if (editingId) {
        await stockMovementService.updateMovement(editingId, movementData);
      } else {
        await stockMovementService.createMovement(movementData);
      }

      handleClose();
      // Reset to first page when adding/editing a movement
      setPage(1);
      setLastDoc(null);
    } catch (err) {
      console.error('Error saving movement:', err);
      setError(err.message || 'Failed to save movement. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movement?')) {
      try {
        setLoading(true);
        await stockMovementService.deleteMovement(id);
      } catch (err) {
        console.error('Error deleting movement:', err);
        setError(err.message || 'Failed to delete movement. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadMovementsReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const reportData = movements.map(movement => {
        const item = items.find(i => i.id === movement.itemId);
        return {
          'Date': movement.timestamp?.toDate().toLocaleString() || 'N/A',
          'Item': item?.name || 'Unknown Item',
          'Type': getMovementTypeLabel(movement.type),
          'Quantity': movement.quantity,
          'Location': movement.location || '-',
          'Transfer To': movement.transferToLocation || '-',
          'Notes': movement.notes || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Movements');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'stock_movements_report.xlsx');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeLabel = (type) => {
    switch (type) {
      case 'stock_in':
        return 'Stock In';
      case 'stock_sold':
        return 'Stock Sold';
      case 'transfer':
        return 'Transfer';
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'stock_in':
        return 'success';
      case 'stock_sold':
        return 'error';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Stock Movements
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={downloadMovementsReport}
            sx={{ mr: 2 }}
          >
            Download Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Movement
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Transfer To</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((movement) => {
                  const item = items.find(i => i.id === movement.itemId);
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {movement.timestamp?.toDate().toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>{item?.name || 'Unknown Item'}</TableCell>
                      <TableCell>
                        {getMovementTypeLabel(movement.type)}
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.location || '-'}</TableCell>
                      <TableCell>{movement.transferToLocation || '-'}</TableCell>
                      <TableCell>{movement.notes || '-'}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpen(movement)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(movement.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {hasMore && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Movement' : 'Add New Movement'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Item</InputLabel>
              <Select
                name="itemId"
                value={formData.itemId}
                onChange={handleChange}
                label="Item"
                required
              >
                {items.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} (Current Stock: {item.quantity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Type"
                required
                disabled={currentUser?.role === 'back_packer'}
              >
                <MenuItem value="stock_in">Stock In</MenuItem>
                {(currentUser?.role === 'manager' || currentUser?.role === 'front_packer') && (
                  <MenuItem value="stock_sold">Stock Sold</MenuItem>
                )}
                <MenuItem value="transfer">Transfer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              margin="normal"
              required
            />
            {formData.type === 'transfer' ? (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>From Location</InputLabel>
                  <Select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    label="From Location"
                    required
                  >
                    <MenuItem value="Front Warehouse">Front Warehouse</MenuItem>
                    <MenuItem value="Back Warehouse">Back Warehouse</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>To Location</InputLabel>
                  <Select
                    name="transferToLocation"
                    value={formData.transferToLocation}
                    onChange={handleChange}
                    label="To Location"
                    required
                    disabled
                  >
                    <MenuItem value="Front Warehouse">Front Warehouse</MenuItem>
                    <MenuItem value="Back Warehouse">Back Warehouse</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : (
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                margin="normal"
                required={formData.type === 'transfer'}
              />
            )}
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StockMovement; 