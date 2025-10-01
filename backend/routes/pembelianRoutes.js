const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// Method: POST
// Path: /api/pembelian/
router.post('/', async (req, res) => {
    // Frontend akan mengirim: { ..., items: [{ id, quantity, totalPrice }] }
    const { user_id, tanggal_pembelian, keterangan, items } = req.body;

    if (!user_id || !tanggal_pembelian || !items || items.length === 0) {
        return res.status(400).json({ message: "Data tidak lengkap." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Hitung total harga dengan menjumlahkan semua 'totalPrice' dari item
        const total_harga = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

        // 2. Buat record di tabel 'tpembelian'
        const [pembelianResult] = await connection.query(
            'INSERT INTO tpembelian (user_id, total_harga, tanggal_pembelian, keterangan) VALUES (?, ?, ?, ?)',
            [user_id, total_harga, tanggal_pembelian, keterangan]
        );
        const pembelian_id = pembelianResult.insertId;

        for (const item of items) {
            const quantity = parseFloat(item.quantity);
            const totalPrice = parseFloat(item.totalPrice);

            // 3. Hitung harga satuan dari total harga
            const harga_satuan = quantity > 0 ? totalPrice / quantity : 0;
            const subtotal = totalPrice;

            // Insert ke 'dtpembelian'
            await connection.query(
                'INSERT INTO dtpembelian (pembelian_id, bahan_id, jumlah, harga_satuan, subtotal, tanggal_kadaluarsa) VALUES (?, ?, ?, ?, ?, ?)',
                [pembelian_id, item.id, quantity, harga_satuan, subtotal, item.expiryDate || null]
            );

            // Insert batch baru ke 'stokb'
            await connection.query(
                'INSERT INTO stokb (bahan_id, jumlah_tersedia, status, user_id, tanggal_kadaluarsa) VALUES (?, ?, ?, ?, ?)',
                [item.id, quantity, 'baik', user_id, item.expiryDate || null]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Transaksi pembelian berhasil dicatat." });

    } catch (err) {
        await connection.rollback();
        console.error("Gagal mencatat pembelian:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
});
/**
 * @route   GET /api/pembelian/:id
 * @desc    Mengambil detail satu transaksi pembelian
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Query 1: Ambil data utama pembelian dan nama user
        const mainQuery = `
            SELECT tp.*, u.nama_lengkap 
            FROM tpembelian tp
            JOIN user u ON tp.user_id = u.user_id
            WHERE tp.pembelian_id = ?`;
        const [mainResult] = await pool.query(mainQuery, [id]);

        if (mainResult.length === 0) {
            return res.status(404).json({ message: "Transaksi pembelian tidak ditemukan." });
        }

        // Query 2: Ambil detail item-item yang dibeli
        const detailsQuery = `
            SELECT dtp.*, b.nama_bahan, b.satuan
            FROM dtpembelian dtp
            JOIN bbaku b ON dtp.bahan_id = b.bahan_id
            WHERE dtp.pembelian_id = ?`;
        const [detailsResult] = await pool.query(detailsQuery, [id]);

        // Gabungkan hasilnya
        const result = {
            ...mainResult[0],
            items: detailsResult
        };

        res.json(result);

    } catch (err) {
        console.error("Gagal mengambil detail pembelian:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;