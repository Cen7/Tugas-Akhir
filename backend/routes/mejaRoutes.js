const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'kedai_miwau'
}).promise();

router.get('/status', async (req, res) => {
    try {
        // Query sederhana: ambil semua meja, join dengan transaksi aktif terbarunya (jika ada)
        const query = `
            SELECT 
                m.meja_id,
                m.nomor_meja,
                latest.transaksi_id,
                latest.status_pesanan,
                latest.status_pembayaran,
                latest.total_harga,
                latest.tanggal_transaksi
            FROM meja m
            LEFT JOIN (
                SELECT 
                    tp.meja_id,
                    tp.transaksi_id,
                    tp.status_pesanan,
                    tp.status_pembayaran,
                    tp.total_harga,
                    tp.tanggal_transaksi
                FROM tpenjualan tp
                INNER JOIN (
                    -- Ambil transaksi_id terbaru untuk setiap meja yang statusnya aktif
                    -- Status aktif: Pending, Diproses, Siap (bukan Completed atau Cancel)
                    SELECT meja_id, MAX(transaksi_id) as max_id
                    FROM tpenjualan
                    WHERE status_pesanan NOT IN ('Completed', 'Cancel')
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

// Endpoint untuk mendapatkan detail order aktif beserta item-itemnya
// Digunakan untuk menampilkan di sebelah kanan (order aktif)
router.get('/active-orders', async (req, res) => {
    try {
        const query = `
            SELECT 
                tp.transaksi_id,
                tp.meja_id,
                m.nomor_meja,
                tp.status_pesanan,
                tp.status_pembayaran,
                tp.total_harga,
                tp.tanggal_transaksi,
                -- Hitung jumlah item yang masih "Menunggu" (belum disajikan)
                (SELECT COUNT(*) 
                 FROM dtpenjualan 
                 WHERE transaksi_id = tp.transaksi_id 
                 AND status_item = 'Menunggu') as jumlah_menunggu,
                -- Hitung total item
                (SELECT COUNT(*) 
                 FROM dtpenjualan 
                 WHERE transaksi_id = tp.transaksi_id) as total_item
            FROM tpenjualan tp
            JOIN meja m ON tp.meja_id = m.meja_id
            WHERE tp.status_pesanan NOT IN ('Completed', 'Cancel')
            ORDER BY tp.tanggal_transaksi DESC;
        `;

        const [orders] = await pool.query(query);
        res.json(orders);

    } catch (err) {
        console.error("Gagal mengambil order aktif:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk mendapatkan detail item dari suatu order
// Digunakan di tab "Detail Pesanan" untuk checklist menu
router.get('/order-items/:transaksi_id', async (req, res) => {
    try {
        const { transaksi_id } = req.params;
        
        const query = `
            SELECT 
                dtp.detail_id,
                dtp.transaksi_id,
                dtp.menu_id,
                mn.nama_menu,
                mn.gambar as gambar_menu,
                dtp.jumlah,
                dtp.harga_satuan,
                dtp.subtotal,
                dtp.status_item
            FROM dtpenjualan dtp
            JOIN menu mn ON dtp.menu_id = mn.menu_id
            WHERE dtp.transaksi_id = ?
            ORDER BY dtp.detail_id ASC;
        `;

        const [items] = await pool.query(query, [transaksi_id]);
        res.json(items);

    } catch (err) {
        console.error("Gagal mengambil detail order:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk update status item (checklist menu sudah jadi/belum)
// Digunakan di tab "Detail Pesanan"
router.patch('/update-item-status/:detail_id', async (req, res) => {
    try {
        const { detail_id } = req.params;
        const { status_item } = req.body;

        // Validasi status_item harus "Disajikan" atau "Menunggu"
        if (!['Disajikan', 'Menunggu'].includes(status_item)) {
            return res.status(400).json({ 
                message: "Status item harus 'Disajikan' atau 'Menunggu'" 
            });
        }

        const query = `
            UPDATE dtpenjualan 
            SET status_item = ?
            WHERE detail_id = ?;
        `;

        await pool.query(query, [status_item, detail_id]);

        // Cek apakah semua item sudah "Disajikan"
        const checkQuery = `
            SELECT 
                dtp.transaksi_id,
                tp.status_pembayaran,
                COUNT(*) as total_item,
                SUM(CASE WHEN dtp.status_item = 'Disajikan' THEN 1 ELSE 0 END) as item_disajikan
            FROM dtpenjualan dtp
            JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
            WHERE dtp.detail_id = ?
            GROUP BY dtp.transaksi_id, tp.status_pembayaran;
        `;

        const [checkResult] = await pool.query(checkQuery, [detail_id]);
        
        if (checkResult.length > 0) {
            const { transaksi_id, status_pembayaran, total_item, item_disajikan } = checkResult[0];
            
            // Jika semua item "Disajikan" DAN sudah "Paid", update status_pesanan jadi "Completed"
            if (item_disajikan === total_item && status_pembayaran === 'Paid') {
                const updateOrderQuery = `
                    UPDATE tpenjualan 
                    SET status_pesanan = 'Completed'
                    WHERE transaksi_id = ?;
                `;
                await pool.query(updateOrderQuery, [transaksi_id]);
            }
            // Jika semua item "Disajikan" tapi belum bayar, update ke "Siap"
            else if (item_disajikan === total_item && status_pembayaran === 'Not Paid') {
                const updateOrderQuery = `
                    UPDATE tpenjualan 
                    SET status_pesanan = 'Siap'
                    WHERE transaksi_id = ?;
                `;
                await pool.query(updateOrderQuery, [transaksi_id]);
            }
        }

        res.json({ 
            message: "Status item berhasil diupdate",
            status_item 
        });

    } catch (err) {
        console.error("Gagal update status item:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk update status pembayaran oleh kasir
router.patch('/update-payment/:transaksi_id', async (req, res) => {
    try {
        const { transaksi_id } = req.params;
        const { status_pembayaran } = req.body;

        // Validasi status_pembayaran harus "Paid" atau "Not Paid"
        if (!['Paid', 'Not Paid'].includes(status_pembayaran)) {
            return res.status(400).json({ 
                message: "Status pembayaran harus 'Paid' atau 'Not Paid'" 
            });
        }

        const query = `
            UPDATE tpenjualan 
            SET status_pembayaran = ?
            WHERE transaksi_id = ?;
        `;

        await pool.query(query, [status_pembayaran, transaksi_id]);

        // Jika dibayar (Paid), cek apakah semua item sudah "Disajikan"
        if (status_pembayaran === 'Paid') {
            const checkQuery = `
                SELECT 
                    COUNT(*) as total_item,
                    SUM(CASE WHEN status_item = 'Disajikan' THEN 1 ELSE 0 END) as item_disajikan
                FROM dtpenjualan
                WHERE transaksi_id = ?;
            `;

            const [checkResult] = await pool.query(checkQuery, [transaksi_id]);
            
            if (checkResult.length > 0) {
                const { total_item, item_disajikan } = checkResult[0];
                
                // Jika sudah bayar DAN semua item sudah disajikan, update status_pesanan jadi "Completed"
                if (item_disajikan === total_item) {
                    const updateOrderQuery = `
                        UPDATE tpenjualan 
                        SET status_pesanan = 'Completed'
                        WHERE transaksi_id = ?;
                    `;
                    await pool.query(updateOrderQuery, [transaksi_id]);
                }
            }
        }

        res.json({ 
            message: "Status pembayaran berhasil diupdate",
            status_pembayaran 
        });

    } catch (err) {
        console.error("Gagal update status pembayaran:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk tambah meja baru
router.post('/tambah', async (req, res) => {
    try {
        // Ambil nomor meja terakhir
        const [lastMeja] = await pool.query(`
            SELECT MAX(nomor_meja) as max_nomor 
            FROM meja
        `);

        const nomorMejaBaru = (lastMeja[0]?.max_nomor || 0) + 1;

        // Insert meja baru
        const [result] = await pool.query(`
            INSERT INTO meja (nomor_meja) 
            VALUES (?)
        `, [nomorMejaBaru]);

        res.json({ 
            message: "Meja berhasil ditambahkan",
            meja_id: result.insertId,
            nomor_meja: nomorMejaBaru
        });

    } catch (err) {
        console.error("Gagal menambah meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk hapus meja
router.delete('/hapus/:meja_id', async (req, res) => {
    try {
        const { meja_id } = req.params;

        // Cek apakah meja sedang digunakan (ada order aktif)
        const [activeOrder] = await pool.query(`
            SELECT transaksi_id 
            FROM tpenjualan 
            WHERE meja_id = ? 
            AND status_pesanan NOT IN ('Completed', 'Cancel')
        `, [meja_id]);

        if (activeOrder.length > 0) {
            return res.status(400).json({ 
                message: "Tidak dapat menghapus meja yang sedang digunakan" 
            });
        }

        // Hapus meja
        await pool.query(`
            DELETE FROM meja 
            WHERE meja_id = ?
        `, [meja_id]);

        res.json({ message: "Meja berhasil dihapus" });

    } catch (err) {
        console.error("Gagal menghapus meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk kosongkan meja (complete order secara paksa)
router.post('/kosongkan/:transaksi_id', async (req, res) => {
    try {
        const { transaksi_id } = req.params;

        // 1. Set semua item jadi "Disajikan"
        await pool.query(`
            UPDATE dtpenjualan 
            SET status_item = 'Disajikan'
            WHERE transaksi_id = ?
        `, [transaksi_id]);

        // 2. Set status pembayaran jadi "Paid" dan status pesanan jadi "Completed"
        await pool.query(`
            UPDATE tpenjualan 
            SET status_pembayaran = 'Paid',
                status_pesanan = 'Completed'
            WHERE transaksi_id = ?
        `, [transaksi_id]);

        res.json({ message: "Meja berhasil dikosongkan" });

    } catch (err) {
        console.error("Gagal mengosongkan meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;
