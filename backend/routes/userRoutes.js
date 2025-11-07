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

// --- Rute untuk mendapatkan semua pengguna (hanya untuk Manajer) ---
router.get('/', async (req, res) => {
  try {
    // Opsional: Cek apakah user yang request adalah Manajer
    if (req.session.user && req.session.user.role !== 'Manajer') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const [users] = await pool.query('SELECT user_id, username, nama_lengkap, role FROM user ORDER BY role, nama_lengkap');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Gagal mengambil data pengguna' });
  }
});

// --- Rute untuk membuat pengguna baru (hanya untuk Manajer) ---
router.post('/register', async (req, res) => {
  const { username, password, nama_lengkap, role } = req.body;
  
  if (!username || !password || !nama_lengkap || !role) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
    // Opsional: Cek apakah user yang request adalah Manajer
    if (req.session.user && req.session.user.role !== 'Manajer') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Cek apakah username sudah ada
    const [existingUsers] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna baru
    const query = 'INSERT INTO user (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(query, [username, hashedPassword, nama_lengkap, role]);

    res.status(201).json({ 
      message: 'Pengguna berhasil dibuat',
      user: {
        user_id: result.insertId,
        username,
        nama_lengkap,
        role
      }
    });
  } catch (err) {
    console.error('Database error during user creation:', err);
    res.status(500).json({ message: 'Gagal membuat pengguna' });
  }
});

// --- Rute untuk update pengguna ---
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username, nama_lengkap, role, password } = req.body;

  if (!username || !nama_lengkap || !role) {
    return res.status(400).json({ message: 'Username, nama lengkap, dan role wajib diisi' });
  }

  try {
    // Opsional: Cek apakah user yang request adalah Manajer
    if (req.session.user && req.session.user.role !== 'Manajer') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Cek apakah username sudah digunakan user lain
    const [existingUsers] = await pool.query(
      'SELECT * FROM user WHERE username = ? AND user_id != ?', 
      [username, userId]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Jika password diisi, hash password baru
    let query, params;
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE user SET username = ?, nama_lengkap = ?, role = ?, password = ? WHERE user_id = ?';
      params = [username, nama_lengkap, role, hashedPassword, userId];
    } else {
      query = 'UPDATE user SET username = ?, nama_lengkap = ?, role = ? WHERE user_id = ?';
      params = [username, nama_lengkap, role, userId];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({ 
      message: 'Pengguna berhasil diperbarui',
      user: {
        user_id: userId,
        username,
        nama_lengkap,
        role
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Gagal memperbarui pengguna' });
  }
});

// --- Rute untuk menghapus pengguna ---
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Opsional: Cek apakah user yang request adalah Manajer
    if (req.session.user && req.session.user.role !== 'Manajer') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Cegah menghapus diri sendiri
    if (req.session.user && req.session.user.id == userId) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri' });
    }

    const [result] = await pool.query('DELETE FROM user WHERE user_id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Gagal menghapus pengguna' });
  }
});

module.exports = router;