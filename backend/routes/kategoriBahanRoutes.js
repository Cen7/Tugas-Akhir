const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau' // Pastikan nama DB benar
}).promise();

// GET /api/kategori-bahan -> Mengambil semua kategori bahan (TIDAK BERUBAH)
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM kategori_bahan ORDER BY nama_kategori ASC');
        res.json(results);
    } catch (err) {
        console.error("Database error fetching kategori bahan:", err);
        res.status(500).json({ message: 'Database error' });
    }
});

// POST /api/kategori-bahan -> Menambah kategori bahan baru (TIDAK BERUBAH)
router.post('/', async (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori || !nama_kategori.trim()) {
         return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    try {
        const [result] = await pool.query('INSERT INTO kategori_bahan (nama_kategori) VALUES (?)', [nama_kategori.trim()]);
        res.status(201).json({ kategori_bahan_id: result.insertId, nama_kategori: nama_kategori.trim() }); // Kirim ID baru
    } catch (err) {
         console.error("Gagal menambah kategori bahan:", err);
         if (err.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ message: 'Nama kategori bahan tersebut sudah ada.' });
         }
        res.status(500).json({ message: 'Gagal menambah kategori bahan' });
    }
});

// --- RUTE BARU UNTUK RENAME ---
/**
 * @route   PUT /api/kategori-bahan/:id
 * @desc    Mengganti nama (rename) kategori bahan
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body; // Ambil nama baru dari body

    if (!nama_kategori || !nama_kategori.trim()) {
        return res.status(400).json({ message: 'Nama kategori baru tidak boleh kosong.' });
    }

    try {
        const query = 'UPDATE kategori_bahan SET nama_kategori = ? WHERE kategori_bahan_id = ?';
        const [result] = await pool.query(query, [nama_kategori.trim(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori bahan tidak ditemukan.' });
        }

        res.json({ message: 'Nama kategori bahan berhasil diperbarui.' });

    } catch (err) {
        console.error("Gagal update nama kategori bahan:", err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ message: 'Nama kategori bahan tersebut sudah ada.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// --- RUTE DELETE DIHAPUS ---
// router.delete('/:id', async (req, res) => { ... });

module.exports = router;