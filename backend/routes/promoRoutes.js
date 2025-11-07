const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

/**
 * @route   GET /api/promo
 * @desc    Mengambil semua data promo
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.promo_id,
                p.menu_id,
                p.user_id,
                p.nama_promo,
                p.harga_promo,
                p.persentase_diskon,
                p.tanggal_mulai,
                p.tanggal_selesai,
                p.status,
                m.nama_menu,
                m.harga AS harga_normal,
                u.nama_lengkap AS created_by
            FROM promo p
            JOIN menu m ON p.menu_id = m.menu_id
            LEFT JOIN user u ON p.user_id = u.user_id
            ORDER BY p.tanggal_mulai DESC
        `;
        const [promos] = await pool.query(query);
        res.json(promos);
    } catch (err) {
        console.error('Error fetching promos:', err);
        res.status(500).json({ message: 'Gagal mengambil data promo.' });
    }
});

/**
 * @route   GET /api/promo/aktif
 * @desc    Mengambil promo yang sedang aktif (berdasarkan tanggal dan status)
 * @access  Public
 */
router.get('/aktif', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.promo_id,
                p.menu_id,
                p.user_id,
                p.nama_promo,
                p.harga_promo,
                p.persentase_diskon,
                p.tanggal_mulai,
                p.tanggal_selesai,
                p.status,
                m.nama_menu,
                m.harga AS harga_normal,
                u.nama_lengkap AS created_by
            FROM promo p
            JOIN menu m ON p.menu_id = m.menu_id
            LEFT JOIN user u ON p.user_id = u.user_id
            WHERE p.status = 'aktif'
              AND NOW() BETWEEN p.tanggal_mulai AND p.tanggal_selesai
            ORDER BY p.tanggal_mulai DESC
        `;
        const [promos] = await pool.query(query);
        res.json(promos);
    } catch (err) {
        console.error('Error fetching active promos:', err);
        res.status(500).json({ message: 'Gagal mengambil data promo aktif.' });
    }
});

/**
 * @route   GET /api/promo/:id
 * @desc    Mengambil detail satu promo berdasarkan ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                p.promo_id,
                p.menu_id,
                p.user_id,
                p.nama_promo,
                p.harga_promo,
                p.persentase_diskon,
                p.tanggal_mulai,
                p.tanggal_selesai,
                p.status,
                m.nama_menu,
                m.harga AS harga_normal,
                u.nama_lengkap AS created_by
            FROM promo p
            JOIN menu m ON p.menu_id = m.menu_id
            LEFT JOIN user u ON p.user_id = u.user_id
            WHERE p.promo_id = ?
        `;
        const [promos] = await pool.query(query, [id]);
        
        if (promos.length === 0) {
            return res.status(404).json({ message: 'Promo tidak ditemukan.' });
        }
        
        res.json(promos[0]);
    } catch (err) {
        console.error('Error fetching promo:', err);
        res.status(500).json({ message: 'Gagal mengambil data promo.' });
    }
});

/**
 * @route   POST /api/promo
 * @desc    Menambahkan promo baru
 * @access  Private (Manajer/Pemilik)
 */
router.post('/', async (req, res) => {
    const { menu_id, user_id, nama_promo, harga_promo, persentase_diskon, tanggal_mulai, tanggal_selesai, status } = req.body;

    // Validasi input
    if (!menu_id || !user_id || !nama_promo || !harga_promo || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    try {
        const query = `
            INSERT INTO promo (menu_id, user_id, nama_promo, harga_promo, persentase_diskon, tanggal_mulai, tanggal_selesai, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            menu_id,
            user_id,
            nama_promo,
            harga_promo,
            persentase_diskon || null,
            tanggal_mulai,
            tanggal_selesai,
            status || 'aktif'
        ]);

        res.status(201).json({
            message: 'Promo berhasil ditambahkan.',
            promo_id: result.insertId
        });
    } catch (err) {
        console.error('Error adding promo:', err);
        res.status(500).json({ message: 'Gagal menambahkan promo.' });
    }
});

/**
 * @route   PUT /api/promo/:id
 * @desc    Mengupdate data promo
 * @access  Private (Manajer/Pemilik)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { menu_id, user_id, nama_promo, harga_promo, persentase_diskon, tanggal_mulai, tanggal_selesai, status } = req.body;

    try {
        const query = `
            UPDATE promo
            SET menu_id = ?,
                user_id = ?,
                nama_promo = ?,
                harga_promo = ?,
                persentase_diskon = ?,
                tanggal_mulai = ?,
                tanggal_selesai = ?,
                status = ?
            WHERE promo_id = ?
        `;
        const [result] = await pool.query(query, [
            menu_id,
            user_id,
            nama_promo,
            harga_promo,
            persentase_diskon || null,
            tanggal_mulai,
            tanggal_selesai,
            status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promo tidak ditemukan.' });
        }

        res.json({ message: 'Promo berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating promo:', err);
        res.status(500).json({ message: 'Gagal memperbarui promo.' });
    }
});

/**
 * @route   DELETE /api/promo/:id
 * @desc    Menghapus promo
 * @access  Private (Manajer/Pemilik)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM promo WHERE promo_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promo tidak ditemukan.' });
        }

        res.json({ message: 'Promo berhasil dihapus.' });
    } catch (err) {
        console.error('Error deleting promo:', err);
        res.status(500).json({ message: 'Gagal menghapus promo.' });
    }
});

/**
 * @route   PUT /api/promo/:id/status
 * @desc    Mengubah status promo (aktif/nonaktif)
 * @access  Private (Manajer/Pemilik)
 */
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['aktif', 'nonaktif'].includes(status)) {
        return res.status(400).json({ message: 'Status harus "aktif" atau "nonaktif".' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE promo SET status = ? WHERE promo_id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promo tidak ditemukan.' });
        }

        res.json({ message: `Promo berhasil diubah menjadi ${status}.` });
    } catch (err) {
        console.error('Error updating promo status:', err);
        res.status(500).json({ message: 'Gagal mengubah status promo.' });
    }
});

module.exports = router;
