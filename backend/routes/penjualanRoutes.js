const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau' // Pastikan nama database sesuai
}).promise();

/**
 * @route   GET /api/penjualan
 * @desc    Mengambil data pesanan, bisa difilter berdasarkan rentang tanggal
 * @access  Private
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let transactionsQuery = `
            SELECT 
                tp.transaksi_id, mj.nomor_meja AS id, tp.tipe_pesanan AS type,
                tp.status_pembayaran AS paymentStatus, tp.status_pesanan AS orderStatus,
                tp.total_harga AS total, tp.metode_pembayaran AS paymentMethod,
                u.nama_lengkap AS cashier, tp.tanggal_transaksi AS date
            FROM tpenjualan tp
            LEFT JOIN meja mj ON tp.meja_id = mj.meja_id
            LEFT JOIN user u ON tp.user_id = u.user_id
        `;
        const queryParams = [];

        // Logika filter tanggal yang sudah diperbaiki
        if (startDate && endDate) {
            const startDateTime = `${startDate} 00:00:00`;
            const endDateTime = `${endDate} 23:59:59`;

            transactionsQuery += ` WHERE tp.tanggal_transaksi BETWEEN ? AND ?`;
            queryParams.push(startDateTime, endDateTime);
        }

        transactionsQuery += ` ORDER BY tp.tanggal_transaksi DESC;`;

        const [transactions] = await pool.query(transactionsQuery, queryParams);

        if (transactions.length === 0) {
            return res.json([]);
        }

        const transactionIds = transactions.map(t => t.transaksi_id);
        const detailsQuery = `
            SELECT dtp.transaksi_id, m.nama_menu AS name, dtp.jumlah AS quantity, dtp.harga_satuan AS price
            FROM dtpenjualan dtp
            JOIN menu m ON dtp.menu_id = m.menu_id
            WHERE dtp.transaksi_id IN (?)
        `;
        const [details] = await pool.query(detailsQuery, [transactionIds]);

        const results = transactions.map(transaction => ({
            ...transaction,
            items: details.filter(d => d.transaksi_id === transaction.transaksi_id)
        }));

        res.json(results);

    } catch (err) {
        console.error("Gagal mengambil data penjualan:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

/**
 * @route   PUT /api/penjualan/:transaksi_id
 * @desc    Memperbarui item dalam sebuah pesanan
 * @access  Private
 */
router.put('/:transaksi_id', async (req, res) => {
    const { transaksi_id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Daftar item tidak boleh kosong." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM dtpenjualan WHERE transaksi_id = ?', [transaksi_id]);

        let newTotalHarga = 0;
        const detailValues = items.map(item => {
            const subtotal = item.price * item.quantity;
            newTotalHarga += subtotal;
            return [transaksi_id, item.id, item.quantity, item.price, subtotal];
        });

        const insertDetailQuery = 'INSERT INTO dtpenjualan (transaksi_id, menu_id, jumlah, harga_satuan, subtotal) VALUES ?';
        await connection.query(insertDetailQuery, [detailValues]);

        await connection.query('UPDATE tpenjualan SET total_harga = ? WHERE transaksi_id = ?', [newTotalHarga, transaksi_id]);

        await connection.commit();
        res.json({ message: 'Pesanan berhasil diperbarui.' });

    } catch (err) {
        await connection.rollback();
        console.error("Gagal memperbarui pesanan:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
});

/**
 * @route   POST /api/penjualan/:transaksi_id/bayar
 * @desc    Memproses pembayaran untuk sebuah pesanan
 * @access  Private
 */
router.post('/:transaksi_id/bayar', async (req, res) => {
    const { transaksi_id } = req.params;
    const { metode_pembayaran } = req.body;

    if (!metode_pembayaran) {
        return res.status(400).json({ message: "Metode pembayaran wajib diisi." });
    }

    try {
        const updateQuery = `
            UPDATE tpenjualan 
            SET status_pembayaran = 'Paid', 
                status_pesanan = 'Completed', 
                metode_pembayaran = ? 
            WHERE transaksi_id = ?`;

        const [results] = await pool.query(updateQuery, [metode_pembayaran, transaksi_id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        }

        res.json({ message: `Pembayaran berhasil dengan metode ${metode_pembayaran}.` });
    } catch (err) {
        console.error("Gagal memproses pembayaran:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const mainQuery = `
            SELECT 
                tp.transaksi_id, mj.nomor_meja AS id, tp.tipe_pesanan AS type,
                tp.status_pembayaran AS paymentStatus, tp.status_pesanan AS orderStatus,
                tp.total_harga AS total, tp.metode_pembayaran AS paymentMethod,
                u.nama_lengkap AS cashier, tp.tanggal_transaksi AS date
            FROM tpenjualan tp
            LEFT JOIN meja mj ON tp.meja_id = mj.meja_id
            LEFT JOIN user u ON tp.user_id = u.user_id
            WHERE tp.transaksi_id = ?`;
        const [mainResult] = await pool.query(mainQuery, [id]);

        if (mainResult.length === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        const detailsQuery = `
            SELECT dtp.transaksi_id, m.nama_menu AS name, dtp.jumlah AS quantity, dtp.harga_satuan AS price
            FROM dtpenjualan dtp
            JOIN menu m ON dtp.menu_id = m.menu_id
            WHERE dtp.transaksi_id = ?`;
        const [detailsResult] = await pool.query(detailsQuery, [id]);

        const result = {
            ...mainResult[0],
            items: detailsResult
        };

        res.json(result);
    } catch (err) {
        console.error("Gagal mengambil detail transaksi:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;