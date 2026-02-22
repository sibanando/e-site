const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'apnidunia_secret_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, is_seller = 0 } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = (await db.query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hash = bcrypt.hashSync(password, 10);
        const { rows } = await db.query(
            'INSERT INTO users (name, email, password, is_seller) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hash, is_seller ? 1 : 0]
        );
        const user = rows[0];

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin || 0, is_seller: user.is_seller || 0 },
            JWT_SECRET, { expiresIn: '7d' }
        );
        res.status(201).json({
            message: 'Registered successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin || 0, is_seller: user.is_seller || 0 }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin || 0, is_seller: user.is_seller || 0 },
            JWT_SECRET, { expiresIn: '7d' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin || 0, is_seller: user.is_seller || 0 }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Login failed' });
    }
});

// PUT /api/auth/profile/:id — update name, email, optionally password
router.put('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, currentPassword, newPassword } = req.body;
        if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

        const user = (await db.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        const emailTaken = (await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id])).rows[0];
        if (emailTaken) return res.status(409).json({ message: 'Email already in use' });

        if (newPassword && newPassword.trim()) {
            if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password)) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            const hash = bcrypt.hashSync(newPassword.trim(), 10);
            await db.query('UPDATE users SET name=$1, email=$2, password=$3 WHERE id=$4', [name, email, hash, id]);
        } else {
            await db.query('UPDATE users SET name=$1, email=$2 WHERE id=$3', [name, email, id]);
        }

        res.json({
            message: 'Profile updated successfully',
            user: { id: parseInt(id), name, email, is_admin: user.is_admin || 0, is_seller: user.is_seller || 0 }
        });
    } catch (err) {
        console.error('Profile update error:', err.message);
        res.status(500).json({ message: 'Update failed' });
    }
});

module.exports = router;
