import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  NotificationsActive as AlertIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { inventoryService } from '../../services/inventoryService';
import { stockMovementService } from '../../services/stockMovementService';
import { useAuth } from '../../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const XLSX = require('xlsx');
const FileSaver = require('file-saver');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    itemsByLocation: {
      front: 0,
      back: 0
    },
    items: [],
    recentMovements: []
  });
  const [movements, setMovements] = useState([]);
  const [stockHistory, setStockHistory] = useState({
    labels: [],
    datasets: []
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load inventory items
      const itemsData = await inventoryService.getAllItems();
      setItems(itemsData);

      // Calculate statistics
      const totalItems = itemsData.length;
      const lowStockItems = itemsData.filter(item => item.quantity <= 200).length;
      const totalValue = itemsData.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      // Load recent movements using the new service method
      const recentMovements = await stockMovementService.getRecentMovements(5);

      setStats({
        totalItems,
        lowStockItems,
        totalValue,
        itemsByLocation: {
          front: itemsData.filter(item => item.location === 'Front Warehouse').length,
          back: itemsData.filter(item => item.location === 'Back Warehouse').length
        },
        items: itemsData,
        recentMovements
      });

      // Filter movements based on user role
      let filteredMovements = recentMovements;
      if (currentUser?.role === 'front_packer') {
        filteredMovements = recentMovements.filter(movement => {
          const item = itemsData.find(i => i.id === movement.itemId);
          return item?.location === 'Front Warehouse';
        });
      } else if (currentUser?.role === 'back_packer') {
        filteredMovements = recentMovements.filter(movement => {
          const item = itemsData.find(i => i.id === movement.itemId);
          return item?.location === 'Back Warehouse';
        });
      }
      setMovements(filteredMovements);

      // Prepare stock history data
      const lastThreeMonths = Array.from({ length: 3 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('default', { month: 'short' });
      }).reverse();

      // Get movements for the last 3 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();
      const movementsData = await stockMovementService.getMovementsByDateRange(startDate, endDate);

      const stockHistoryData = {
        labels: lastThreeMonths,
        datasets: [
          {
            label: 'Front Warehouse',
            data: lastThreeMonths.map(month => {
              const monthMovements = movementsData.filter(movement => {
                const movementDate = new Date(movement.timestamp?.toDate());
                const item = itemsData.find(i => i.id === movement.itemId);
                return movementDate.toLocaleString('default', { month: 'short' }) === month &&
                       item?.location === 'Front Warehouse';
              });
              return monthMovements.length;
            }),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Back Warehouse',
            data: lastThreeMonths.map(month => {
              const monthMovements = movementsData.filter(movement => {
                const movementDate = new Date(movement.timestamp?.toDate());
                const item = itemsData.find(i => i.id === movement.itemId);
                return movementDate.toLocaleString('default', { month: 'short' }) === month &&
                       item?.location === 'Back Warehouse';
              });
              return monthMovements.length;
            }),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      };
      setStockHistory(stockHistoryData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadDashboardReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create inventory summary sheet
      const inventoryData = items.map(item => ({
        'Item Name': item.name,
        'Location': item.location,
        'Quantity': item.quantity,
        'Price per Unit': `R${item.price.toFixed(2)}`,
        'Total Value': `R${(item.quantity * item.price).toFixed(2)}`,
        'Status': item.quantity <= 200 ? 'Low Stock' : 'In Stock',
        'Description': item.description || ''
      }));

      const inventoryWs = XLSX.utils.json_to_sheet(inventoryData);
      
      // Set column widths for inventory
      const inventoryColWidths = [
        { wch: 30 }, // Item Name
        { wch: 15 }, // Location
        { wch: 10 }, // Quantity
        { wch: 15 }, // Price per Unit
        { wch: 15 }, // Total Value
        { wch: 10 }, // Status
        { wch: 40 }  // Description
      ];
      inventoryWs['!cols'] = inventoryColWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory Summary');

      // Create stock movements sheet
      const movementsData = stats.recentMovements.map(movement => {
        const item = items.find(i => i.id === movement.itemId);
        return {
          'Date': new Date(movement.timestamp?.toDate()).toLocaleString(),
          'Item': item?.name || 'Unknown Item',
          'Type': movement.type === 'stock_in' ? 'Stock In' : 'Stock Sold',
          'Quantity': movement.quantity,
          'Notes': movement.notes || ''
        };
      });

      const movementsWs = XLSX.utils.json_to_sheet(movementsData);

      // Set column widths for movements
      const movementsColWidths = [
        { wch: 20 }, // Date
        { wch: 30 }, // Item
        { wch: 10 }, // Type
        { wch: 10 }, // Quantity
        { wch: 40 }  // Notes
      ];
      movementsWs['!cols'] = movementsColWidths;

      XLSX.utils.book_append_sheet(wb, movementsWs, 'Recent Movements');

      // Create statistics sheet
      const statsData = [{
        'Total Items': stats.totalItems,
        'Low Stock Items': stats.lowStockItems,
        'Total Inventory Value': `R${stats.totalValue.toFixed(2)}`,
        'Front Warehouse Items': stats.itemsByLocation.front,
        'Back Warehouse Items': stats.itemsByLocation.back
      }];

      const statsWs = XLSX.utils.json_to_sheet(statsData);
      
      // Set column widths for stats
      const statsColWidths = [
        { wch: 20 }, // Total Items
        { wch: 15 }, // Low Stock Items
        { wch: 20 }, // Total Inventory Value
        { wch: 20 }, // Front Warehouse Items
        { wch: 20 }  // Back Warehouse Items
      ];
      statsWs['!cols'] = statsColWidths;

      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');

      // Add frozen panes to all sheets
      inventoryWs['!view'] = { frozen: true, ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
      movementsWs['!view'] = { frozen: true, ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
      statsWs['!view'] = { frozen: true, ySplit: 1, xSplit: 0, topLeftCell: 'A2' };

      // Add styles to all sheets
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" }
      };

      // Apply styles to headers
      ['Inventory Summary', 'Recent Movements', 'Statistics'].forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
          if (!cell) continue;
          cell.s = headerStyle;
        }
      });

      // Save the file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'dashboard_report.xlsx');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again later.');
    } finally {
      setLoading(false);
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
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const lowStockItems = stats.items.filter(item => item.quantity <= 200);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={downloadDashboardReport}
        >
          Download Full Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Items</Typography>
              </Box>
              <Typography variant="h4">{stats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Low Stock Items</Typography>
              </Box>
              <Typography variant="h4">{stats.lowStockItems}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Value</Typography>
              </Box>
              <Typography variant="h4">R{stats.totalValue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Movement Analysis (Last 3 Months)
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line
                  data={stockHistory}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Monthly Stock Movements by Location'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Movements'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Stock Movements
              </Typography>
              <Box overflowX="auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentMovements.map((movement, index) => {
                      const item = items.find(i => i.id === movement.itemId);
                      return (
                        <tr key={index}>
                          <td style={{ padding: '8px' }}>
                            {new Date(movement.timestamp?.toDate()).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px' }}>{item?.name || 'Unknown Item'}</td>
                          <td style={{ padding: '8px' }}>
                            {movement.type === 'stock_in' ? 'Stock In' : 'Stock Sold'}
                          </td>
                          <td style={{ padding: '8px' }}>{movement.quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 