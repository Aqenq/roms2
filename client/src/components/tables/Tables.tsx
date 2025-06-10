import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

interface Table {
  id: number;
  table_number: number;
  capacity: number;
  status: string;
}

const Tables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const handleQrClick = (table: Table) => {
    setSelectedTable(table);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    setSelectedTable(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Restaurant Tables
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {tables.map((table) => (
          <Card key={table.id}>
            <CardContent>
              <Typography variant="h6">Table {table.table_number}</Typography>
              <Typography color="textSecondary">Capacity: {table.capacity}</Typography>
              <Typography
                color={table.status === 'available' ? 'success.main' : 'error.main'}
              >
                Status: {table.status}
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/customer-menu/${table.id}`)}
                  fullWidth
                  disabled={table.status !== 'available'}
                >
                  View Menu
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Table {selectedTable?.table_number} QR Code</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={2}>
            <QRCodeSVG
              value={`${window.location.origin}/customer-menu/${selectedTable?.id}`}
              size={256}
              level="H"
            />
            <Typography variant="body2" color="textSecondary" mt={2}>
              Scan this QR code to view the menu for Table {selectedTable?.table_number}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tables; 