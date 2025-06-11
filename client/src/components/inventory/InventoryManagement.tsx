import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
}

interface MenuItem {
  id: number;
  name: string;
  ingredients: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
  }[];
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openIngredientDialog, setOpenIngredientDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    minimum_quantity: '',
  });
  const [ingredientFormData, setIngredientFormData] = useState({
    inventory_id: '',
    quantity: '',
    unit: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const units = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup'];

  useEffect(() => {
    fetchInventory();
    fetchMenuItems();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      const response = await api.get('/inventory');
      console.log('Inventory response:', response.data);
      setInventory(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to fetch inventory items');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      setMenuItems(response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to fetch menu items');
    }
  };

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        minimum_quantity: item.minimum_quantity.toString(),
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        minimum_quantity: '',
      });
    }
    setOpenDialog(true);
  };

  const handleOpenIngredientDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIngredientFormData({
      inventory_id: '',
      quantity: '',
      unit: '',
    });
    setOpenIngredientDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: '',
      minimum_quantity: '',
    });
  };

  const handleCloseIngredientDialog = () => {
    setOpenIngredientDialog(false);
    setSelectedMenuItem(null);
    setIngredientFormData({
      inventory_id: '',
      quantity: '',
      unit: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/inventory/${selectedItem.id}`, {
          ...formData,
          quantity: parseFloat(formData.quantity),
          minimum_quantity: parseFloat(formData.minimum_quantity),
        });
        setSuccess('Inventory item updated successfully');
      } else {
        await api.post('/inventory', {
          ...formData,
          quantity: parseFloat(formData.quantity),
          minimum_quantity: parseFloat(formData.minimum_quantity),
        });
        setSuccess('Inventory item created successfully');
      }
      handleCloseDialog();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setError('Failed to save inventory item');
    }
  };

  const handleIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    try {
      await api.post(`/inventory/menu-item/${selectedMenuItem.id}/ingredient`, {
        ...ingredientFormData,
        quantity: parseFloat(ingredientFormData.quantity),
      });
      setSuccess('Ingredient added to menu item successfully');
      handleCloseIngredientDialog();
      fetchMenuItems();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      setError('Failed to add ingredient to menu item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/inventory/${id}`);
      setSuccess('Inventory item deleted successfully');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      setError('Failed to delete inventory item');
    }
  };

  const handleRemoveIngredient = async (menuItemId: number, ingredientId: number) => {
    if (!window.confirm('Are you sure you want to remove this ingredient?')) return;

    try {
      await api.delete(`/inventory/menu-item/${menuItemId}/ingredient/${ingredientId}`);
      setSuccess('Ingredient removed successfully');
      fetchMenuItems();
    } catch (error) {
      console.error('Error removing ingredient:', error);
      setError('Failed to remove ingredient');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Inventory Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Inventory Items</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Item
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Min Quantity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory && inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.minimum_quantity}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenDialog(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Menu Items & Ingredients
              </Typography>
              {menuItems.map((menuItem) => (
                <Box key={menuItem.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {menuItem.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Ingredients:
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenIngredientDialog(menuItem)}
                    >
                      Add Ingredient
                    </Button>
                  </Box>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ingredient</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {menuItem.ingredients.map((ingredient) => (
                          <TableRow key={ingredient.id}>
                            <TableCell>{ingredient.name}</TableCell>
                            <TableCell>{ingredient.quantity}</TableCell>
                            <TableCell>{ingredient.unit}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRemoveIngredient(menuItem.id, ingredient.id)
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inventory Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Minimum Quantity"
              type="number"
              value={formData.minimum_quantity}
              onChange={(e) =>
                setFormData({ ...formData, minimum_quantity: e.target.value })
              }
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Ingredient Dialog */}
      <Dialog open={openIngredientDialog} onClose={handleCloseIngredientDialog}>
        <DialogTitle>Add Ingredient to {selectedMenuItem?.name}</DialogTitle>
        <form onSubmit={handleIngredientSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Ingredient</InputLabel>
              <Select
                value={ingredientFormData.inventory_id}
                onChange={(e) =>
                  setIngredientFormData({
                    ...ingredientFormData,
                    inventory_id: e.target.value,
                  })
                }
                required
              >
                {inventory.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={ingredientFormData.quantity}
              onChange={(e) =>
                setIngredientFormData({
                  ...ingredientFormData,
                  quantity: e.target.value,
                })
              }
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Unit</InputLabel>
              <Select
                value={ingredientFormData.unit}
                onChange={(e) =>
                  setIngredientFormData({
                    ...ingredientFormData,
                    unit: e.target.value,
                  })
                }
                required
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseIngredientDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default InventoryManagement; 