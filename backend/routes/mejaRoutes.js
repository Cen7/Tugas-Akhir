const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'miwautest'
}).promise();

router.get('/status', async (req, res) => {
    try {
        // Query sederhana: ambil semua meja, join dengan transaksi aktif terbarunya (jika ada)
        const query = `
            SELECT 
                m.meja_id,
                m.nomor_meja,
                latest.transaksi_id,
                latest.status_pembayaran,
                latest.total_harga,
                latest.tanggal_transaksi
            FROM meja m
            LEFT JOIN (
                SELECT 
                    tp.meja_id,
                    tp.transaksi_id,
                    tp.status_pembayaran,
                    tp.total_harga,
                    tp.tanggal_transaksi
                FROM tpenjualan tp
                INNER JOIN (
                    -- Ambil transaksi_id terbaru untuk setiap meja yang statusnya aktif
                    SELECT meja_id, MAX(transaksi_id) as max_id
                    FROM tpenjualan
                    WHERE status_pesanan NOT IN ('Completed', 'Cancelled')
                    GROUP BY meja_id
                ) latest_active ON tp.transaksi_id = latest_active.max_id
            ) latest ON m.meja_id = latest.meja_id
            ORDER BY m.meja_id ASC;
        `;

        const [tables] = await pool.query(query);
        res.json(tables);

    } catch (err) {
        console.error("Gagal mengambil status meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;