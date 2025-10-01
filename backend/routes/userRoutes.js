const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// Definisikan koneksi database di sini (atau impor dari file konfigurasi)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise(); // Gunakan .promise() untuk async/await

// --- Rute Registrasi (Sign Up) ---
// Method: POST, Path: /api/users/signup
router.post('/signup', async (req, res) => {
    const { username, password, nama_lengkap, role } = req.body;
    if (!username || !password || !nama_lengkap || !role) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    try {
        // Cek apakah username sudah ada
        const [existingUsers] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan pengguna baru
        const query = 'INSERT INTO user (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)';
        await pool.query(query, [username, hashedPassword, nama_lengkap, role]);

        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (err) {
        console.error('Database error during signup:', err);
        res.status(500).json({ message: 'Gagal registrasi' });
    }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }
  try {
    const [results] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
    // Simpan informasi pengguna ke dalam sesi
    req.session.user = {
      id: user.user_id,
      nama: user.nama_lengkap,
      role: user.role
    };
    res.json({ success: true, message: 'Login berhasil', user: req.session.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// BARU: Rute untuk mengecek sesi saat ini
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// BARU: Rute untuk Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Gagal logout' });
    }
    res.clearCookie('connect.sid'); // Nama default cookie dari express-session
    res.json({ message: 'Logout berhasil' });
  });
});

module.exports = router;