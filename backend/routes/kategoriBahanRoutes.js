const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// GET /api/kategori-bahan -> Mengambil semua kategori bahan
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM kategori_bahan ORDER BY nama_kategori ASC');
        res.json(results);
    } catch (err) {
        console.error("Database error fetching kategori bahan:", err);
        res.status(500).json({ message: 'Database error' });
    }
});

// POST /api/kategori-bahan -> Menambah kategori bahan baru
router.post('/', async (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ message: 'Nama kategori wajib diisi' });

    try {
        const [result] = await pool.query('INSERT INTO kategori_bahan (nama_kategori) VALUES (?)', [nama_kategori]);
        res.status(201).json({ id: result.insertId, nama_kategori });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menambah kategori bahan' });
    }
});

// DELETE /api/kategori-bahan/:id -> Menghapus kategori bahan
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM kategori_bahan WHERE kategori_bahan_id = ?', [id]);
        res.json({ message: 'Kategori bahan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus kategori bahan' });
    }
});

module.exports = router;