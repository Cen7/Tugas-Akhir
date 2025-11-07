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
        // Query: ambil semua meja dengan transaksi aktif terbarunya dan hitung item
        // Filter: hanya meja dengan status 'tersedia' atau 'terisi' (bukan 'tidak tersedia')
        const query = `
            SELECT 
                m.meja_id,
                m.nomor_meja,
                m.status as status_meja,
                latest.transaksi_id,
                latest.status_pesanan,
                latest.status_pembayaran,
                latest.total_harga,
                latest.tanggal_transaksi,
                latest.total_item,
                latest.item_disajikan
            FROM meja m
            LEFT JOIN (
                SELECT 
                    tp.meja_id,
                    tp.transaksi_id,
                    tp.status_pesanan,
                    tp.status_pembayaran,
                    tp.total_harga,
                    tp.tanggal_transaksi,
                    -- Hitung total item
                    (SELECT COUNT(*) 
                     FROM dtpenjualan 
                     WHERE transaksi_id = tp.transaksi_id) as total_item,
                    -- Hitung item yang sudah disajikan
                    (SELECT COUNT(*) 
                     FROM dtpenjualan 
                     WHERE transaksi_id = tp.transaksi_id 
                     AND status_item = 'Disajikan') as item_disajikan
                FROM tpenjualan tp
                INNER JOIN (
                    -- Ambil transaksi_id terbaru untuk setiap meja yang statusnya aktif
                    SELECT meja_id, MAX(transaksi_id) as max_id
                    FROM tpenjualan
                    WHERE status_pesanan NOT IN ('Selesai', 'Dibatalkan')
                    GROUP BY meja_id
                ) latest_active ON tp.transaksi_id = latest_active.max_id
            ) latest ON m.meja_id = latest.meja_id
            WHERE m.status IN ('tersedia', 'terisi')
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
// Menampilkan pesanan Dine-in DAN Take Away
router.get('/active-orders', async (req, res) => {
    try {
        const query = `
            SELECT 
                tp.transaksi_id,
                tp.meja_id,
                COALESCE(tp.tipe_pesanan, 
                    CASE 
                        WHEN tp.meja_id IS NULL THEN 'Takeaway'
                        ELSE 'Dine-in'
                    END
                ) as tipe_pesanan,
                tp.nama_pembeli,
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
            LEFT JOIN meja m ON tp.meja_id = m.meja_id
            WHERE tp.status_pesanan NOT IN ('Selesai', 'Dibatalkan')
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

        // Dapatkan transaksi_id dari detail_id yang diupdate
        const getTransaksiQuery = `SELECT transaksi_id FROM dtpenjualan WHERE detail_id = ?`;
        const [transaksiResult] = await pool.query(getTransaksiQuery, [detail_id]);
        
        if (transaksiResult.length === 0) {
            return res.status(404).json({ message: "Detail pesanan tidak ditemukan" });
        }
        
        const currentTransaksiId = transaksiResult[0].transaksi_id;

        // Cek SEMUA item dalam transaksi ini (bukan hanya detail_id yang diupdate)
        const checkQuery = `
            SELECT 
                dtp.transaksi_id,
                tp.status_pembayaran,
                tp.tipe_pesanan,
                COUNT(*) as total_item,
                SUM(CASE WHEN dtp.status_item = 'Disajikan' THEN 1 ELSE 0 END) as item_disajikan
            FROM dtpenjualan dtp
            JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
            WHERE dtp.transaksi_id = ?
            GROUP BY dtp.transaksi_id, tp.status_pembayaran, tp.tipe_pesanan;
        `;

        const [checkResult] = await pool.query(checkQuery, [currentTransaksiId]);
        
        if (checkResult.length > 0) {
            const { transaksi_id, status_pembayaran, tipe_pesanan, total_item, item_disajikan } = checkResult[0];
            
            // Konversi ke number untuk memastikan perbandingan benar
            const totalItems = Number(total_item);
            const itemsDisajikan = Number(item_disajikan);
            
            let newStatus = null;
            
            // LOGIKA STATUS PESANAN berdasarkan item yang disajikan dan status pembayaran:
            
            // KHUSUS TAKEAWAY: Lunas + Semua Disajikan = Selesai (langsung Selesai)
            if (itemsDisajikan === totalItems && status_pembayaran === 'Lunas' && tipe_pesanan === 'Takeaway') {
                newStatus = 'Selesai';
            }
            // DINE-IN: Lunas + Semua Disajikan = Siap (menunggu dikosongkan)
            // Selesai hanya lewat endpoint "Kosongkan Meja"
            else if (itemsDisajikan === totalItems && status_pembayaran === 'Lunas' && tipe_pesanan === 'Dine-in') {
                newStatus = 'Siap'; // Tunggu tombol "Kosongkan Meja"
            }
            else if (itemsDisajikan === totalItems && status_pembayaran === 'Belum Lunas') {
                // Semua item disajikan + Belum bayar = Siap (menunggu pembayaran)
                newStatus = 'Siap';
            }
            else if (itemsDisajikan > 0 && itemsDisajikan < totalItems) {
                // Sebagian item disajikan = Diproses (sedang dikerjakan kitchen)
                newStatus = 'Diproses';
            }
            else if (itemsDisajikan === 0 && status_pembayaran === 'Lunas') {
                // KASUS UNCEKLIS SEMUA TAPI SUDAH BAYAR
                // Tidak boleh kembali ke Pending, tetap Diproses agar tidak hilang dari tracking
                newStatus = 'Diproses';
            }
            else if (itemsDisajikan === 0 && status_pembayaran === 'Belum Lunas') {
                // Belum ada item disajikan + Belum bayar = Pending (pesanan baru/fresh)
                newStatus = 'Pending';
            }
            
            // Update status pesanan jika ada perubahan
            if (newStatus) {
                const updateOrderQuery = `
                    UPDATE tpenjualan 
                    SET status_pesanan = ?
                    WHERE transaksi_id = ?;
                `;
                await pool.query(updateOrderQuery, [newStatus, transaksi_id]);
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

        // Validasi status_pembayaran harus "Lunas" atau "Belum Lunas"
        if (!['Lunas', 'Belum Lunas'].includes(status_pembayaran)) {
            return res.status(400).json({ 
                message: "Status pembayaran harus 'Lunas' atau 'Belum Lunas'" 
            });
        }

        const query = `
            UPDATE tpenjualan 
            SET status_pembayaran = ?
            WHERE transaksi_id = ?;
        `;

        await pool.query(query, [status_pembayaran, transaksi_id]);

        // Jika dibayar (Lunas), cek apakah semua item sudah "Disajikan"
        if (status_pembayaran === 'Lunas') {
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
                
                // Jika sudah bayar DAN semua item sudah disajikan, update status_pesanan jadi "Selesai"
                if (item_disajikan === total_item) {
                    const updateOrderQuery = `
                        UPDATE tpenjualan 
                        SET status_pesanan = 'Selesai'
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
            SELECT nomor_meja 
            FROM meja
            ORDER BY CAST(nomor_meja AS UNSIGNED) DESC
            LIMIT 1
        `);

        const nomorMejaBaru = String((parseInt(lastMeja[0]?.nomor_meja || 0) + 1)).padStart(2, '0');

        // Insert meja baru
        const [result] = await pool.query(`
            INSERT INTO meja (nomor_meja, status) 
            VALUES (?, 'tersedia')
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

// Endpoint untuk toggle status meja (enable/disable)
// HANYA untuk toggle antara "tersedia" dan "tidak tersedia"
// Status "terisi" dikelola otomatis oleh sistem saat ada pesanan
router.patch('/toggle-status/:meja_id', async (req, res) => {
    try {
        const { meja_id } = req.params;

        // Cek status meja saat ini
        const [currentMeja] = await pool.query(`
            SELECT status, nomor_meja 
            FROM meja 
            WHERE meja_id = ?
        `, [meja_id]);

        if (currentMeja.length === 0) {
            return res.status(404).json({ message: "Meja tidak ditemukan" });
        }

        const currentStatus = currentMeja[0].status;
        
        // Tidak bisa disable meja yang sedang "terisi"
        if (currentStatus === 'terisi') {
            return res.status(400).json({ 
                message: "Tidak dapat menonaktifkan meja yang sedang terisi dengan pesanan aktif" 
            });
        }

        // Toggle antara "tersedia" dan "tidak tersedia"
        let newStatus;
        if (currentStatus === 'tersedia') {
            newStatus = 'tidak tersedia';
        } else if (currentStatus === 'tidak tersedia') {
            newStatus = 'tersedia';
        } else {
            // Fallback jika ada status aneh
            newStatus = 'tersedia';
        }
        
        await pool.query(`
            UPDATE meja 
            SET status = ?
            WHERE meja_id = ?
        `, [newStatus, meja_id]);

        res.json({ 
            message: `Meja ${currentMeja[0].nomor_meja} berhasil ${newStatus === 'tersedia' ? 'diaktifkan' : 'dinonaktifkan'}`,
            status: newStatus
        });

    } catch (err) {
        console.error("Gagal mengubah status meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk mendapatkan semua meja (termasuk yang disabled) untuk management
router.get('/all', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.meja_id,
                m.nomor_meja,
                m.status,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM tpenjualan 
                        WHERE meja_id = m.meja_id 
                        AND status_pesanan NOT IN ('Selesai', 'Dibatalkan')
                    ) THEN 'terisi'
                    ELSE 'kosong'
                END as kondisi,
                CASE
                    WHEN m.status = 'tidak tersedia' THEN 'Nonaktif (Hidden)'
                    WHEN m.status = 'terisi' THEN 'Terisi (Ada Pesanan)'
                    WHEN m.status = 'tersedia' THEN 'Tersedia (Kosong)'
                    ELSE m.status
                END as status_display
            FROM meja m
            ORDER BY CAST(m.nomor_meja AS UNSIGNED) ASC
        `;
        
        const [tables] = await pool.query(query);
        res.json(tables);
    } catch (err) {
        console.error("Gagal mengambil data meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Endpoint untuk kosongkan meja (complete order secara paksa)
router.post('/kosongkan/:transaksi_id', async (req, res) => {
    try {
        const { transaksi_id } = req.params;

        // Ambil info meja_id dari transaksi
        const [transaksiInfo] = await pool.query(`
            SELECT meja_id, tipe_pesanan 
            FROM tpenjualan 
            WHERE transaksi_id = ?
        `, [transaksi_id]);

        if (transaksiInfo.length === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        const { meja_id, tipe_pesanan } = transaksiInfo[0];

        // 1. Set semua item jadi "Disajikan"
        await pool.query(`
            UPDATE dtpenjualan 
            SET status_item = 'Disajikan'
            WHERE transaksi_id = ?
        `, [transaksi_id]);

        // 2. Set status pembayaran jadi "Lunas" dan status pesanan jadi "Selesai"
        await pool.query(`
            UPDATE tpenjualan 
            SET status_pembayaran = 'Lunas',
                status_pesanan = 'Selesai'
            WHERE transaksi_id = ?
        `, [transaksi_id]);

        // 3. Jika Dine-in, set status meja kembali jadi "tersedia"
        if (tipe_pesanan === 'Dine-in' && meja_id) {
            await pool.query(`
                UPDATE meja 
                SET status = 'tersedia' 
                WHERE meja_id = ?
            `, [meja_id]);
        }

        res.json({ message: "Meja berhasil dikosongkan" });

    } catch (err) {
        console.error("Gagal mengosongkan meja:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;
