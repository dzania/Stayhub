import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Chip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Payment as PaymentIcon, Undo as RefundIcon } from '@mui/icons-material';
import { paymentsApi } from '../../api/payments';
import { PaymentStatus as PaymentStatusType, Booking } from '../../types';

interface PaymentStatusProps {
  booking: Booking;
  isHost?: boolean;
  onRefundSuccess?: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ booking, isHost = false, onRefundSuccess }) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await paymentsApi.getPaymentStatus(booking.id);
      setPaymentStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment status');
    } finally {
      setLoading(false);
    }
  }, [booking.id]);

  useEffect(() => {
    loadPaymentStatus();
  }, [loadPaymentStatus]);

  const handleRefund = async () => {
    if (!paymentStatus) return;

    try {
      setRefundLoading(true);
      await paymentsApi.createRefund({
        booking_id: booking.id,
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason || undefined
      });

      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundReason('');
      await loadPaymentStatus(); // Reload status
      onRefundSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'Unpaid';
      case 'processing':
        return 'Processing';
      case 'paid':
        return 'Paid';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">Loading payment status...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  const remainingAmount = paymentStatus.total_price - paymentStatus.refund_amount;
  const canRefund = isHost && paymentStatus.payment_status === 'paid' && remainingAmount > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <PaymentIcon fontSize="small" color="action" />
        <Typography variant="body2" fontWeight="medium">
          Payment Status:
        </Typography>
        <Chip
          label={getStatusLabel(paymentStatus.payment_status)}
          color={getStatusColor(paymentStatus.payment_status) as any}
          size="small"
        />
      </Box>

      <Box sx={{ pl: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Total Amount: ${paymentStatus.total_price.toFixed(2)}
        </Typography>
        
        {paymentStatus.payment_method && (
          <Typography variant="body2" color="text.secondary">
            Payment Method: {paymentStatus.payment_method}
          </Typography>
        )}

        {paymentStatus.refund_amount > 0 && (
          <Typography variant="body2" color="text.secondary">
            Refunded: ${paymentStatus.refund_amount.toFixed(2)}
          </Typography>
        )}

        {remainingAmount < paymentStatus.total_price && (
          <Typography variant="body2" color="text.secondary">
            Remaining: ${remainingAmount.toFixed(2)}
          </Typography>
        )}

        {canRefund && (
          <Button
            size="small"
            startIcon={<RefundIcon />}
            onClick={() => setRefundDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Issue Refund
          </Button>
        )}
      </Box>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Refund</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Paid: ${paymentStatus.total_price.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Previously Refunded: ${paymentStatus.refund_amount.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available for Refund: ${remainingAmount.toFixed(2)}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Refund Amount"
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder={`Leave empty for full refund ($${remainingAmount.toFixed(2)})`}
            inputProps={{ 
              min: 0, 
              max: remainingAmount,
              step: 0.01 
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Refund Reason (Optional)"
            multiline
            rows={3}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Provide a reason for the refund..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)} disabled={refundLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            variant="contained"
            disabled={refundLoading}
            startIcon={refundLoading ? <CircularProgress size={16} /> : <RefundIcon />}
          >
            {refundLoading ? 'Processing...' : 'Issue Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentStatus; 