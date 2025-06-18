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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';

const XLSX = require('xlsx');
const FileSaver = require('file-saver');

const Inventory = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    threshold: '',
    location: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAllItems();
      
      // Filter items based on user role
      let filteredItems = data;
      if (currentUser?.role === 'front_packer') {
        filteredItems = data.filter(item => item.location === 'Front Warehouse');
      } else if (currentUser?.role === 'back_packer') {
        filteredItems = data.filter(item => item.location === 'Back Warehouse');
      }
      
      setItems(filteredItems);
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Failed to load inventory. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        threshold: item.threshold,
        location: item.location,
        price: item.price || '',
        description: item.description || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '',
        threshold: '',
        location: currentUser?.role === 'front_packer' ? 'Front Warehouse' : 
                 currentUser?.role === 'back_packer' ? 'Back Warehouse' : '',
        price: '',
        description: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: '',
      threshold: '',
      location: '',
      price: '',
      description: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        threshold: parseInt(formData.threshold),
        price: parseFloat(formData.price) || 0
      };

      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, itemData);
      } else {
        await inventoryService.addItem(itemData);
      }

      handleClose();
      loadInventory();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item. Please try again later.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryService.deleteItem(id);
        loadInventory();
      } catch (err) {
        console.error('Error deleting item:', err);
        setError('Failed to delete item. Please try again later.');
      }
    }
  };

  const downloadInventoryReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data for report
      const reportData = items.map(item => ({
        'Item Name': item.name,
        'Location': item.location,
        'Quantity': item.quantity,
        'Price per Unit': `R${item.price?.toFixed(2) || '0.00'}`,
        'Total Value': `R${(item.quantity * (item.price || 0)).toFixed(2)}`,
        'Status': item.quantity <= 200 ? 'Low Stock' : 'In Stock',
        'Description': item.description || ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save the file
      FileSaver.saveAs(blob, 'inventory_report.xlsx');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={downloadInventoryReport}
            sx={{ mr: 2 }}
          >
            Download Report
          </Button>
          {currentUser?.role === 'manager' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Add Item
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Threshold</TableCell>
              <TableCell>Price per Unit</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Status</TableCell>
              {currentUser?.role === 'manager' && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.threshold}</TableCell>
                <TableCell>R{item.price?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>R{(item.quantity * (item.price || 0)).toFixed(2)}</TableCell>
                <TableCell>
                  {item.quantity <= item.threshold ? (
                    <Typography color="warning.main">Low Stock</Typography>
                  ) : (
                    <Typography color="success.main">In Stock</Typography>
                  )}
                </TableCell>
                {currentUser?.role === 'manager' && (
                  <TableCell>
                    <IconButton onClick={() => handleOpen(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
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
            <TextField
              fullWidth
              label="Threshold"
              name="threshold"
              type="number"
              value={formData.threshold}
              onChange={handleChange}
              margin="normal"
              required
            />
            {currentUser?.role === 'manager' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Location</InputLabel>
                <Select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  label="Location"
                  required
                >
                  <MenuItem value="Front Warehouse">Front Warehouse</MenuItem>
                  <MenuItem value="Back Warehouse">Back Warehouse</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              label="Price per Unit (R)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Inventory; 