const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// GET /api/kategori-menu -> Mengambil semua kategori menu
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM kategori_menu ORDER BY nama_kategori');
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// POST /api/kategori-menu -> Menambah kategori menu baru
router.post('/', async (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    try {
        const [result] = await pool.query('INSERT INTO kategori_menu (nama_kategori) VALUES (?)', [nama_kategori]);
        res.status(201).json({ id: result.insertId, nama_kategori });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menambah kategori menu' });
    }
});

// DELETE /api/kategori-menu/:id -> Menghapus kategori menu
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM kategori_menu WHERE kategori_menu_id = ?', [id]);
        res.json({ message: 'Kategori menu berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus kategori menu' });
    }
});

module.exports = router;