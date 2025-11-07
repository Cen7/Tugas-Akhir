const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// Konfigurasi Multer untuk menyimpan file di memori (untuk disimpan sebagai BLOB)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


/**
 * @route   GET /api/menu/
 * @desc    Mengambil semua data menu, dikelompokkan berdasarkan kategori
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.menu_id, m.nama_menu, m.harga, km.nama_kategori as kategori, 
                m.deskripsi, m.status, m.kategori_menu_id,
                (CASE WHEN m.status = "tersedia" THEN 1 ELSE 0 END) as available,
                (m.gambar IS NOT NULL) as has_gambar,
                p.promo_id, p.nama_promo, p.harga_promo, p.persentase_diskon,
                p.tanggal_mulai, p.tanggal_selesai
            FROM menu m
            LEFT JOIN kategori_menu km ON m.kategori_menu_id = km.kategori_menu_id
            LEFT JOIN promo p ON m.menu_id = p.menu_id 
                AND p.status = 'aktif' 
                AND NOW() BETWEEN p.tanggal_mulai AND p.tanggal_selesai
            ORDER BY km.nama_kategori, m.nama_menu`;

        const [results] = await pool.query(query);

        const menuByCategory = results.reduce((acc, item) => {
            const category = item.kategori || 'Tanpa Kategori';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
        res.json(menuByCategory);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

/**
 * @route   POST /api/menu/
 * @desc    Membuat menu baru beserta resepnya
 * @access  Private (membutuhkan otorisasi)
 */
router.post('/', upload.single('gambar'), async (req, res) => {
    const { nama_menu, harga, kategori_menu_id, deskripsi, resep } = req.body;
    if (!req.file || !nama_menu || !harga || !kategori_menu_id) {
        return res.status(400).json({ message: 'Gambar, Nama, Harga, dan Kategori wajib diisi.' });
    }
    const resepItems = JSON.parse(resep);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const menuQuery = 'INSERT INTO menu (nama_menu, harga, kategori_menu_id, deskripsi, gambar, status) VALUES (?, ?, ?, ?, ?, ?)';
        const [menuResult] = await connection.query(menuQuery, [nama_menu, harga, kategori_menu_id, deskripsi, req.file.buffer, 'tersedia']);
        const newMenuId = menuResult.insertId;

        if (resepItems && resepItems.length > 0) {
            const resepValues = resepItems.map(item => [newMenuId, item.bahan_id, item.jumlah_bahan, item.satuan]);
            await connection.query('INSERT INTO Resep (menu_id, bahan_id, jumlah_bahan, satuan) VALUES ?', [resepValues]);
        }
        await connection.commit();
        res.status(201).json({ message: 'Menu baru berhasil ditambahkan' });
    } catch (err) {
        await connection.rollback();
        console.error("Gagal menambahkan menu baru:", err);
        res.status(500).json({ message: 'Gagal menambahkan menu baru' });
    } finally {
        connection.release();
    }
});

/**
 * @route   GET /api/menu/gambar/:id
 * @desc    Menyajikan gambar menu dari data BLOB di database
 * @access  Public
 */
router.get('/gambar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await pool.query('SELECT gambar FROM Menu WHERE menu_id = ?', [id]);
        if (results.length === 0 || !results[0].gambar) {
            return res.status(404).send('Gambar tidak ditemukan');
        }
        res.setHeader('Content-Type', 'image/jpeg'); // Asumsi gambar adalah jpeg
        res.send(results[0].gambar);
    } catch (err) {
        console.error("Gagal mengambil gambar dari DB:", err);
        res.status(500).json({ message: 'Gagal mengambil gambar' });
    }
});

/**
 * @route   GET /api/menu/resep/:menu_id
 * @desc    Mengambil data resep untuk satu menu
 * @access  Public
 */
router.get('/resep/:menu_id', async (req, res) => {
    const { menu_id } = req.params;
    const query = `
        SELECT r.jumlah_bahan, b.bahan_id, b.nama_bahan, b.satuan 
        FROM Resep r 
        JOIN BBaku b ON r.bahan_id = b.bahan_id 
        WHERE r.menu_id = ?`;
    try {
        const [results] = await pool.query(query, [menu_id]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

/**
 * @route   PUT /api/menu/:id
 * @desc    Memperbarui detail menu (termasuk gambar)
 * @access  Private
 */
router.put('/:id', upload.single('gambar'), async (req, res) => {
    const { id } = req.params;
    const { nama_menu, harga, kategori_menu_id, deskripsi } = req.body;
  
    let query;
    let queryParams;

    if (req.file) {
        query = 'UPDATE menu SET nama_menu = ?, harga = ?, kategori_menu_id = ?, deskripsi = ?, gambar = ? WHERE menu_id = ?';
        queryParams = [nama_menu, harga, kategori_menu_id, deskripsi, req.file.buffer, id];
    } else {
        query = 'UPDATE menu SET nama_menu = ?, harga = ?, kategori_menu_id = ?, deskripsi = ? WHERE menu_id = ?';
        queryParams = [nama_menu, harga, kategori_menu_id, deskripsi, id];
    }

    try {
        const [results] = await pool.query(query, queryParams);
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Menu tidak ditemukan' });
        res.json({ message: 'Menu berhasil diperbarui' });
    } catch (err) {
        console.error("Database error saat update menu:", err);
        res.status(500).json({ message: 'Gagal memperbarui menu' });
    }
});

/**
 * @route   PUT /api/menu/:id/status
 * @desc    Memperbarui status ketersediaan menu
 * @access  Private
 */
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { available } = req.body;
    const newStatus = available ? 'tersedia' : 'tidak tersedia';
    const query = 'UPDATE Menu SET status = ? WHERE menu_id = ?';
    try {
        const [results] = await pool.query(query, [newStatus, id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu tidak ditemukan' });
        }
        res.json({ message: `Status menu berhasil diperbarui` });
    } catch (err) {
        res.status(500).json({ message: 'Gagal memperbarui status menu' });
    }
});

/**
 * @route   PUT /api/menu/resep/:menu_id
 * @desc    Memperbarui resep untuk satu menu
 * @access  Private
 */
router.put('/resep/:menu_id', async (req, res) => {
    const { menu_id } = req.params;
    const { resep } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM Resep WHERE menu_id = ?', [menu_id]);
        if (resep && resep.length > 0) {
            const values = resep.map(item => [menu_id, item.bahan_id, item.jumlah_bahan, item.satuan]);
            await connection.query('INSERT INTO Resep (menu_id, bahan_id, jumlah_bahan, satuan) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ message: 'Resep berhasil diperbarui' });
    } catch (err) {
        await connection.rollback();
        console.error("Gagal update resep:", err);
        res.status(500).json({ message: 'Gagal memperbarui resep' });
    } finally {
        connection.release();
    }
});

module.exports = router;