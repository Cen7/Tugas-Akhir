const express = require('express');
const session = require('express-session'); // Impor library sesi
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());

// Konfigurasi CORS agar bisa menerima dan mengirim cookie
app.use(cors({
  origin: 'http://localhost:4028', // Ganti dengan alamat frontend Anda
  credentials: true
}));

// Konfigurasi middleware session
app.use(session({
  secret: 'ini-adalah-kunci-rahasia-yang-sangat-aman-dan-panjang', // Ganti dengan secret key Anda
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set ke `true` jika Anda sudah menggunakan HTTPS
    httpOnly: true, // Cookie tidak bisa diakses via JavaScript di frontend
    maxAge: 24 * 60 * 60 * 1000 // Sesi berlaku selama 1 hari
  }
}));

const menuRoutes = require('./routes/menuRoutes');
const userRoutes = require('./routes/userRoutes');
const bahanBakuRoutes = require('./routes/bahanBakuRoutes');
const stockRoutes = require('./routes/stockRoutes');
const kategoriMenuRoutes = require('./routes/kategoriMenuRoutes'); 
const kategoriBahanRoutes = require('./routes/kategoriBahanRoutes');
const pembelianRoutes = require('./routes/pembelianRoutes');
const penjualanRoutes = require('./routes/penjualanRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const mejaRoutes = require('./routes/mejaRoutes');

app.use('/api/meja', mejaRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bahan-baku', bahanBakuRoutes);
app.use('/api/stok', stockRoutes);
app.use('/api/pembelian', pembelianRoutes);
app.use('/api/kategori-menu', kategoriMenuRoutes); 
app.use('/api/kategori-bahan', kategoriBahanRoutes); 
app.use('/api/penjualan', penjualanRoutes);

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));