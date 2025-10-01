const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

router.get('/', async (req, res) => {
    try {
        // PERBAIKAN: Hapus semua spasi/indentasi di dalam backtick
        const query = `SELECT 
            b.bahan_id as id, 
            b.nama_bahan as name, 
            b.satuan as unit,
            b.stok_minimum as warningAt, 
            kb.nama_kategori as kategori,
            b.peringatan_kadaluarsa_hari,
            b.status,
            (b.gambar IS NOT NULL AND b.gambar != '') as has_gambar,
            COALESCE(SUM(s.jumlah_tersedia), 0) as stock,
            MAX(s.created_at) as lastIn, 
            MIN(s.created_at) as firstIn
            FROM bbaku b
            LEFT JOIN stokb s ON b.bahan_id = s.bahan_id
            LEFT JOIN kategori_bahan kb ON b.kategori_bahan_id = kb.kategori_bahan_id
            GROUP BY 
            b.bahan_id, b.nama_bahan, b.satuan, b.stok_minimum, 
            b.peringatan_kadaluarsa_hari, b.status, kb.nama_kategori
            ORDER BY b.nama_bahan;`;
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        console.error("Database query error on GET /api/stok:", err);
        res.status(500).json({ message: "Gagal mengambil data stok" });
    }
});

router.get('/batches/:bahan_id', async (req, res) => {
    const { bahan_id } = req.params;
    try {
        const query = `
            SELECT 
                s.stok_id, 
                s.jumlah_tersedia as total, 
                s.tanggal_kadaluarsa, 
                s.created_at as tanggalMasuk,
                u.nama_lengkap as user_nama 
            FROM stokb s
            LEFT JOIN user u ON s.user_id = u.user_id
            WHERE s.bahan_id = ? 
            ORDER BY s.created_at DESC`;
        const [batches] = await pool.query(query, [bahan_id]);
        res.json(batches);
    } catch (err) {
        console.error("Database error fetching stock batches:", err);
        res.status(500).json({ message: "Gagal mengambil detail batch stok" });
    }
});

router.get('/damages/:bahan_id', async (req, res) => {
    const { bahan_id } = req.params;
    try {
        const query = `
            SELECT 
                br.rusak_id, 
                br.jumlah_rusak as total, 
                br.tanggal as tanggalRusak, 
                br.keterangan,
                u.nama_lengkap as user_nama
            FROM brusak br
            LEFT JOIN user u ON br.user_id = u.user_id
            WHERE br.bahan_id = ? 
            ORDER BY br.tanggal DESC`;
        const [damages] = await pool.query(query, [bahan_id]);
        res.json(damages);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil data stok rusak" });
    }
});

router.post('/damage', async (req, res) => {
    const { user_id, items } = req.body;

    if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ message: "Data tidak lengkap." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of items) {
            if (!item.stok_id || !item.bahan_id || !item.rusak) continue;

            const updateResult = await connection.query(
                'UPDATE stokb SET jumlah_tersedia = jumlah_tersedia - ? WHERE stok_id = ? AND jumlah_tersedia >= ?',
                [item.rusak, item.stok_id, item.rusak]
            );

            if (updateResult[0].affectedRows === 0) {
                throw new Error(`Stok untuk batch ID ${item.stok_id} tidak mencukupi.`);
            }

            await connection.query(
                'INSERT INTO brusak (bahan_id, stok_id, jumlah_rusak, tanggal, keterangan, user_id) VALUES (?, ?, ?, CURDATE(), ?, ?)',
                [item.bahan_id, item.stok_id, item.rusak, item.alasan, user_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Data kerusakan stok berhasil dicatat." });
    } catch (err) {
        await connection.rollback();
        console.error("Gagal mencatat kerusakan stok:", err);
        res.status(500).json({ message: err.message || "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
});

router.get('/warnings', async (req, res) => {
    try {
        // Query untuk bahan yang stoknya menipis atau habis
        // Menggunakan subquery untuk menghitung total stok terlebih dahulu
        const lowStockQuery = `
            SELECT 
                b.nama_bahan, 
                b.satuan, 
                b.stok_minimum,
                COALESCE(SUM(s.jumlah_tersedia), 0) as total_stok
            FROM bbaku b
            LEFT JOIN stokb s ON b.bahan_id = s.bahan_id
            GROUP BY b.bahan_id, b.nama_bahan, b.satuan, b.stok_minimum
            HAVING total_stok <= b.stok_minimum
            ORDER BY total_stok ASC;
        `;

        // Query untuk bahan yang mendekati kadaluarsa
        // Hanya menampilkan batch yang belum kadaluarsa tapi sudah masuk masa peringatan
        const expiringStockQuery = `
            SELECT 
                b.nama_bahan,
                s.jumlah_tersedia,
                b.satuan,
                s.tanggal_kadaluarsa,
                DATEDIFF(s.tanggal_kadaluarsa, CURDATE()) as sisa_hari,
                b.peringatan_kadaluarsa_hari
            FROM stokb s
            JOIN bbaku b ON s.bahan_id = b.bahan_id
            WHERE 
                s.tanggal_kadaluarsa IS NOT NULL 
                AND s.jumlah_tersedia > 0
                AND DATEDIFF(s.tanggal_kadaluarsa, CURDATE()) >= 0
                AND DATEDIFF(s.tanggal_kadaluarsa, CURDATE()) <= b.peringatan_kadaluarsa_hari
            ORDER BY s.tanggal_kadaluarsa ASC;
        `;

        const [lowStockItems] = await pool.query(lowStockQuery);
        const [expiringItems] = await pool.query(expiringStockQuery);

        console.log("Low stock items found:", lowStockItems.length);
        console.log("Expiring items found:", expiringItems.length);

        res.json({
            stokMenipis: lowStockItems,
            stokKadaluwarsa: expiringItems
        });

    } catch (err) {
        console.error("Database error fetching stock warnings:", err);
        res.status(500).json({ message: "Gagal mengambil data peringatan stok" });
    }
});

module.exports = router;