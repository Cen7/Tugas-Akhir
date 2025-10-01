const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/bahan-baku/ -> Mengambil daftar master bahan baku
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT b.bahan_id as id, b.nama_bahan as name, b.satuan as unit, 
                   kb.nama_kategori as kategori, b.kategori_bahan_id, (b.gambar IS NOT NULL) as has_gambar
            FROM bbaku b
            LEFT JOIN kategori_bahan kb ON b.kategori_bahan_id = kb.kategori_bahan_id
            WHERE b.status = 'tersedia' 
            ORDER BY b.nama_bahan ASC`;
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/', upload.single('gambar'), async (req, res) => {
    const { nama_bahan, kategori_bahan_id, satuan, stok_minimum, peringatan_kadaluarsa_hari } = req.body;

    // Validasi
    if (!nama_bahan || !kategori_bahan_id || !satuan || !stok_minimum || !peringatan_kadaluarsa_hari || !req.file) {
        return res.status(400).json({ message: "Semua field (termasuk gambar) wajib diisi." });
    }

    try {
        const query = `
            INSERT INTO bbaku 
                (nama_bahan, kategori_bahan_id, satuan, stok_minimum, peringatan_kadaluarsa_hari, gambar, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'tersedia')`;

        const queryParams = [
            nama_bahan,
            kategori_bahan_id,
            satuan,
            stok_minimum,
            peringatan_kadaluarsa_hari,
            req.file.buffer // Gambar disimpan sebagai BLOB
        ];

        await pool.query(query, queryParams);

        res.status(201).json({ message: "Bahan baku baru berhasil ditambahkan." });

    } catch (err) {
        console.error("Gagal menambahkan bahan baku baru:", err);
        res.status(500).json({ message: "Gagal menambahkan bahan baku ke database." });
    }
});

router.get('/all', async (req, res) => {
    try {
        const query = `SELECT bahan_id as id, nama_bahan as name, status FROM bbaku ORDER BY nama_bahan ASC`;
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// GET /api/bahan-baku/gambar/:id -> Menyajikan gambar dari BLOB
router.get('/gambar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await pool.query('SELECT gambar FROM bbaku WHERE bahan_id = ?', [id]);
        if (results.length === 0 || !results[0].gambar) {
            return res.status(404).send('Gambar tidak ditemukan');
        }
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(results[0].gambar);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil gambar' });
    }
});

// --- BARU: Rute untuk mengupdate bahan baku (termasuk gambar) ---
// PUT /api/bahan-baku/:id
router.put('/:id', upload.single('gambar'), async (req, res) => {
    const { id } = req.params;
    const { nama_bahan, kategori_bahan_id, satuan } = req.body;

    // Validasi data teks
    if (!nama_bahan || !kategori_bahan_id || !satuan) {
        return res.status(400).json({ message: "Nama, kategori, dan satuan wajib diisi." });
    }

    let query;
    let queryParams;

    if (req.file) {
        // Jika ada file gambar baru
        query = 'UPDATE bbaku SET nama_bahan = ?, kategori_bahan_id = ?, satuan = ?, gambar = ? WHERE bahan_id = ?';
        queryParams = [nama_bahan, kategori_bahan_id, satuan, req.file.buffer, id];
    } else {
        // Jika tidak ada gambar baru
        query = 'UPDATE bbaku SET nama_bahan = ?, kategori_bahan_id = ?, satuan = ? WHERE bahan_id = ?';
        queryParams = [nama_bahan, kategori_bahan_id, satuan, id];
    }

    try {
        const [results] = await pool.query(query, queryParams);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Bahan baku tidak ditemukan." });
        }
        res.json({ message: "Bahan baku berhasil diperbarui." });
    } catch (err) {
        console.error("Gagal update bahan baku:", err);
        res.status(500).json({ message: "Gagal memperbarui bahan baku." });
    }
});

router.put('/:id/notifikasi', async (req, res) => {
    const { id } = req.params;
    const { stok_minimum, peringatan_kadaluarsa_hari } = req.body;

    if (stok_minimum === undefined || peringatan_kadaluarsa_hari === undefined) {
        return res.status(400).json({ message: "Data notifikasi tidak lengkap." });
    }

    try {
        const query = 'UPDATE bbaku SET stok_minimum = ?, peringatan_kadaluarsa_hari = ? WHERE bahan_id = ?';
        const [results] = await pool.query(query, [stok_minimum, peringatan_kadaluarsa_hari, id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Bahan baku tidak ditemukan." });
        }
        res.json({ message: "Peringatan stok berhasil diperbarui." });
    } catch (err) {
        res.status(500).json({ message: "Gagal memperbarui notifikasi." });
    }
});
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Menerima 'tersedia' or 'tidak tersedia'

    if (!status || !['tersedia', 'tidak tersedia'].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid." });
    }

    try {
        const query = 'UPDATE bbaku SET status = ? WHERE bahan_id = ?';
        const [results] = await pool.query(query, [status, id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Bahan baku tidak ditemukan." });
        }
        res.json({ message: `Status bahan baku berhasil diubah.` });
    } catch (err) {
        res.status(500).json({ message: "Gagal mengubah status bahan baku." });
    }
});

module.exports = router;