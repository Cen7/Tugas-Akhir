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

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body; // Ambil nama baru dari body

    // Validasi sederhana
    if (!nama_kategori || !nama_kategori.trim()) {
        return res.status(400).json({ message: 'Nama kategori baru tidak boleh kosong.' });
    }

    try {
        const query = 'UPDATE kategori_menu SET nama_kategori = ? WHERE kategori_menu_id = ?';
        const [result] = await pool.query(query, [nama_kategori.trim(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori menu tidak ditemukan.' });
        }

        res.json({ message: 'Nama kategori berhasil diperbarui.' });

    } catch (err) {
        console.error("Gagal update nama kategori menu:", err);
        // Tangani potensi error duplikat nama jika kolom nama_kategori UNIQUE
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Nama kategori tersebut sudah ada.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;