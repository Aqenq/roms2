import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../utils/axios';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  ingredients: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
  }[];
}

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
}

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [openIngredients, setOpenIngredients] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
  });
  const [ingredientForm, setIngredientForm] = useState({
    inventory_id: '',
    quantity: '',
    unit: '',
  });

  useEffect(() => {
    fetchMenuItems();
    fetchInventoryItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/menu');
      setMenuItems(response.data);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      setError(error.response?.data?.message || 'Failed to fetch menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      setError(null);
      const response = await api.get('/inventory');
      setInventoryItems(response.data);
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      setError(error.response?.data?.message || 'Failed to fetch inventory items. Please try again.');
    }
  };

  const handleOpen = (item?: MenuItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        image_url: item.image_url,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
    });
  };

  const handleOpenIngredients = (item: MenuItem) => {
    setSelectedItem(item);
    setOpenIngredients(true);
  };

  const handleCloseIngredients = () => {
    setOpenIngredients(false);
    setSelectedItem(null);
    setIngredientForm({
      inventory_id: '',
      quantity: '',
      unit: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = parseFloat(formData.price);
      if (isNaN(price)) {
        setError('Please enter a valid price');
        return;
      }

      if (selectedItem) {
        await api.put(`/menu/${selectedItem.id}`, {
          ...formData,
          price,
        });
      } else {
        await api.post('/menu', {
          ...formData,
          price,
        });
      }
      fetchMenuItems();
      handleClose();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setError('Failed to save menu item');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/menu/${id}`);
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.post('/menu-item-ingredients', {
        menu_item_id: selectedItem.id,
        inventory_id: parseInt(ingredientForm.inventory_id),
        quantity: parseFloat(ingredientForm.quantity),
        unit: ingredientForm.unit,
      });
      fetchMenuItems();
      handleCloseIngredients();
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const handleRemoveIngredient = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this ingredient?')) {
      try {
        await api.delete(`/menu-item-ingredients/${id}`);
        fetchMenuItems();
      } catch (error) {
        console.error('Error removing ingredient:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchMenuItems}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Menu Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Menu Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Ingredients</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenIngredients(item)}
                  >
                    {item.ingredients?.length || 0} Ingredients
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(item)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <MenuItem value="appetizers">Appetizers</MenuItem>
                    <MenuItem value="main_courses">Main Courses</MenuItem>
                    <MenuItem value="desserts">Desserts</MenuItem>
                    <MenuItem value="beverages">Beverages</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openIngredients}
        onClose={handleCloseIngredients}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Manage Ingredients - {selectedItem?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Ingredients
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItem?.ingredients?.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell>{ingredient.name}</TableCell>
                      <TableCell>{ingredient.quantity}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleRemoveIngredient(ingredient.id)}
                          color="error"
                          size="small"
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

          <form onSubmit={handleAddIngredient}>
            <Typography variant="h6" gutterBottom>
              Add New Ingredient
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ingredient</InputLabel>
                  <Select
                    value={ingredientForm.inventory_id}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        inventory_id: e.target.value,
                      })
                    }
                    required
                  >
                    {inventoryItems.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={ingredientForm.quantity}
                  onChange={(e) =>
                    setIngredientForm({
                      ...ingredientForm,
                      quantity: e.target.value,
                    })
                  }
                  required
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={ingredientForm.unit}
                  onChange={(e) =>
                    setIngredientForm({
                      ...ingredientForm,
                      unit: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary">
                Add Ingredient
              </Button>
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIngredients}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManagement; 