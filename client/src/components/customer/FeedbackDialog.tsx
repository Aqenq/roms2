import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Alert
} from '@mui/material';
import axios from 'axios';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onClose, tableId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please provide a rating');
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/feedback', {
        tableId: parseInt(tableId),
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRating(null);
        setComment('');
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>How was your experience?</DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Thank you for your feedback!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => {
                setRating(newValue);
                setError('');
              }}
              size="large"
            />
          </Box>
          <TextField
            label="Comments"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog; 