const express = require('express');
const router = express.Router();

// POST /api/payment/upi-qr  — generate UPI deep-link for QR code
router.post('/upi-qr', (req, res) => {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    const upiId = 'sibanando.nayak@ybl';
    const merchantName = 'ApniDunia';
    const transactionNote = `Order payment of Rs ${amount}`;
    const qrString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    res.json({
        qrString,
        upiId,
        amount,
        merchantName
    });
});

// POST /api/payment/verify  — simulate payment verification
router.post('/verify', (req, res) => {
    const { transactionId, amount, method } = req.body;

    // Simulate 1.5s processing delay
    setTimeout(() => {
        // Always succeed in demo mode (95% success rate simulation)
        const success = Math.random() > 0.05;
        if (success) {
            res.json({
                status: 'success',
                transactionId: transactionId || `TXN${Date.now()}`,
                amount,
                method: method || 'UPI',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(402).json({
                status: 'failed',
                message: 'Payment failed. Please try again.'
            });
        }
    }, 1500);
});

// POST /api/payment/phonepe  — PhonePe deep-link
router.post('/phonepe', (req, res) => {
    const { amount, phone } = req.body;
    setTimeout(() => {
        res.json({
            status: 'success',
            transactionId: 'PH-' + Date.now(),
            method: 'PhonePe',
            deepLink: `phonepe://pay?pa=sibanando.nayak@ybl&pn=ApniDunia&am=${amount}&cu=INR`
        });
    }, 1500);
});

// POST /api/payment/gpay  — Google Pay deep-link
router.post('/gpay', (req, res) => {
    const { amount } = req.body;
    setTimeout(() => {
        res.json({
            status: 'success',
            transactionId: 'GP-' + Date.now(),
            method: 'GPay',
            deepLink: `tez://upi/pay?pa=sibanando.nayak@ybl&pn=ApniDunia&am=${amount}&cu=INR`
        });
    }, 1500);
});

module.exports = router;
