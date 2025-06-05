import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  onClose,
  title,
  message,
  actionLabel = 'OK',
  onAction,
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <CheckCircle
            sx={{
              fontSize: 64,
              color: 'success.main',
            }}
          />
        </Box>
        
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleAction}
          size="large"
        >
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuccessDialog; 