const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau' // Pastikan nama database sesuai
}).promise();

const getOrderDetails = async (transactionIds) => {
    if (!transactionIds || transactionIds.length === 0) return [];
    const detailsQuery = `
        SELECT dtp.transaksi_id, dtp.detail_id, dtp.jumlah, dtp.status_item, 
               m.nama_menu, dtp.harga_satuan AS price, m.menu_id
        FROM dtpenjualan dtp
        JOIN menu m ON dtp.menu_id = m.menu_id
        WHERE dtp.transaksi_id IN (?)
        ORDER BY dtp.detail_id ASC;
    `;
    const [details] = await pool.query(detailsQuery, [transactionIds]);
    return details;
};

// Fungsi helper untuk menggabungkan transaksi dengan detailnya
const structureOrders = (transactions, details) => {
    return transactions.map(transaction => ({
        ...transaction,
        total_harga: parseFloat(transaction.total_harga || 0), 
        items: details.filter(d => d.transaksi_id === transaction.transaksi_id)
    }));
};

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
 * @route   GET /api/penjualan/aktif-semua
 * @desc    Mengambil SEMUA pesanan aktif (belum Completed/Cancel), untuk sidebar "Meja"
 * @access  Private
 */
router.get('/aktif-semua', async (req, res) => {
    try {
        const query = `
            SELECT 
                tp.transaksi_id, tp.status_pesanan, tp.status_pembayaran, tp.total_harga,
                mj.nomor_meja, tp.tipe_pesanan, tp.tanggal_transaksi
            FROM tpenjualan tp
            LEFT JOIN meja mj ON tp.meja_id = mj.meja_id
            WHERE tp.status_pesanan NOT IN ('Completed', 'Cancel')
            ORDER BY tp.tanggal_transaksi ASC;
        `; 
        const [activeTransactions] = await pool.query(query);

        if (activeTransactions.length === 0) return res.json([]);

        const transactionIds = activeTransactions.map(t => t.transaksi_id);
        const details = await getOrderDetails(transactionIds); // Pakai helper
        const results = structureOrders(activeTransactions, details); // Pakai helper
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil semua pesanan aktif:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

/**
 * @route   GET /api/penjualan/aktif-detail
 * @desc    Mengambil pesanan aktif yang MASIH PUNYA item 'Menunggu', untuk sidebar "Detail Pesanan"
 * @access  Private
 */
router.get('/aktif-detail', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT tp.transaksi_id 
            FROM tpenjualan tp
            JOIN dtpenjualan dtp ON tp.transaksi_id = dtp.transaksi_id
            WHERE tp.status_pesanan NOT IN ('Completed', 'Cancel')
              AND dtp.status_item = 'Menunggu'
            ORDER BY tp.tanggal_transaksi ASC;
        `;
        const [relevantTransactions] = await pool.query(query);

        if (relevantTransactions.length === 0) return res.json([]);
        
        const transactionIds = relevantTransactions.map(t => t.transaksi_id);

        const fullDataQuery = `
            SELECT 
                tp.transaksi_id, tp.status_pesanan, tp.status_pembayaran, tp.total_harga,
                mj.nomor_meja, tp.tipe_pesanan, tp.tanggal_transaksi
            FROM tpenjualan tp
            LEFT JOIN meja mj ON tp.meja_id = mj.meja_id
            WHERE tp.transaksi_id IN (?)
            ORDER BY tp.tanggal_transaksi ASC;
        `;
        const [transactions] = await pool.query(fullDataQuery, [transactionIds]);
        const details = await getOrderDetails(transactionIds); // Pakai helper
        const results = structureOrders(transactions, details); // Pakai helper
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil pesanan aktif untuk detail:", err);
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
 * @route   PUT /api/penjualan/item/:detail_id/status
 * @desc    Mengubah status satu item (toggle: Menunggu <-> Disajikan) DAN mengupdate status pesanan induk
 * @access  Private
 */
router.put('/item/:detail_id/status', async (req, res) => {
    const { detail_id } = req.params;
    const { status_item } = req.body;

    // Validasi status_item harus "Disajikan" atau "Menunggu"
    if (!['Disajikan', 'Menunggu'].includes(status_item)) {
        return res.status(400).json({ message: "Status item harus 'Disajikan' atau 'Menunggu'." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update item yang diceklis
        const [updateResult] = await connection.query(
            "UPDATE dtpenjualan SET status_item = ? WHERE detail_id = ?", 
            [status_item, detail_id]
        );
        if (updateResult.affectedRows === 0) {
            throw new Error("Item detail tidak ditemukan.");
        }

        // 2. Dapatkan ID transaksi induk dan status pembayaran
        const [itemData] = await connection.query(
            `SELECT dtp.transaksi_id, tp.status_pembayaran 
             FROM dtpenjualan dtp
             JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
             WHERE dtp.detail_id = ?`, 
            [detail_id]
        );
        const { transaksi_id, status_pembayaran } = itemData[0];

        // 3. Periksa status pesanan induk saat ini
        const [orderData] = await connection.query(
            "SELECT status_pesanan FROM tpenjualan WHERE transaksi_id = ?", 
            [transaksi_id]
        );
        const currentOrderStatus = orderData[0].status_pesanan;

        // 4. Jika status induk masih 'Pending', ubah jadi 'Diproses'
        if (currentOrderStatus === 'Pending' && status_item === 'Disajikan') {
            await connection.query(
                "UPDATE tpenjualan SET status_pesanan = 'Diproses' WHERE transaksi_id = ?", 
                [transaksi_id]
            );
        }

        // 5. Periksa apakah SEMUA item untuk pesanan ini sudah 'Disajikan'
        const [itemStats] = await connection.query(
            "SELECT COUNT(*) as totalItems, SUM(CASE WHEN status_item = 'Disajikan' THEN 1 ELSE 0 END) as servedItems FROM dtpenjualan WHERE transaksi_id = ?",
            [transaksi_id]
        );
        
        const { totalItems, servedItems } = itemStats[0];

        // 6. Update status pesanan berdasarkan kondisi
        if (totalItems > 0 && totalItems.toString() === servedItems.toString()) {
            // Semua item sudah disajikan
            if (status_pembayaran === 'Paid') {
                // Sudah bayar + semua disajikan = Completed
                await connection.query(
                    "UPDATE tpenjualan SET status_pesanan = 'Completed' WHERE transaksi_id = ?", 
                    [transaksi_id]
                );
            } else {
                // Belum bayar + semua disajikan = Siap
                await connection.query(
                    "UPDATE tpenjualan SET status_pesanan = 'Siap' WHERE transaksi_id = ?", 
                    [transaksi_id]
                );
            }
        } else if (servedItems > 0) {
            // Ada item yang sudah disajikan tapi belum semua = Diproses
            await connection.query(
                "UPDATE tpenjualan SET status_pesanan = 'Diproses' WHERE transaksi_id = ?", 
                [transaksi_id]
            );
        } else {
            // Tidak ada item yang disajikan = Pending
            await connection.query(
                "UPDATE tpenjualan SET status_pesanan = 'Pending' WHERE transaksi_id = ?", 
                [transaksi_id]
            );
        }
        
        await connection.commit();
        res.json({ message: "Status item berhasil diperbarui.", status_item });

    } catch (err) {
        await connection.rollback();
        console.error("Gagal update status item:", err);
        res.status(500).json({ message: err.message || "Terjadi kesalahan pada server." });
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

        // --- PERBAIKAN QUERY DETAIL DI SINI ---
        const detailsQuery = `
            SELECT 
                dtp.transaksi_id, 
                m.menu_id, -- <<< TAMBAHKAN INI
                m.nama_menu AS name, 
                dtp.jumlah AS quantity, 
                dtp.harga_satuan AS price
            FROM dtpenjualan dtp
            JOIN menu m ON dtp.menu_id = m.menu_id
            WHERE dtp.transaksi_id = ?`;
        const [detailsResult] = await pool.query(detailsQuery, [id]);

        const result = {
            ...mainResult[0],
            items: detailsResult // Sekarang items akan memiliki menu_id
        };

        res.json(result);
    } catch (err) {
        console.error("Gagal mengambil detail transaksi:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

/**
* @route   POST /api/penjualan/customer
 * @desc    Menerima dan membuat pesanan baru dari pelanggan
 * @access  Public (atau sesuai kebutuhan)
 */
router.post('/customer', async (req, res) => {
    // Ambil data dari body request yang dikirim frontend
    const { tipe_pesanan, items, total_harga, meja_id } = req.body; // Ambil meja_id juga jika Dine-in

    // --- Validasi Sederhana ---
    if (!tipe_pesanan || !items || items.length === 0 || !total_harga) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap." });
    }
    // Tambahkan validasi lain jika perlu (misal cek apakah menu_id valid, dll.)

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Masukkan data ke tpenjualan
        const penjualanQuery = `
            INSERT INTO tpenjualan 
                (meja_id, user_id, total_harga, status_pembayaran, status_pesanan, tipe_pesanan, tanggal_transaksi) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        
        // Asumsi user_id '0' atau ID khusus untuk pesanan customer via QR
        const userIdForCustomerOrder = null;
        const statusPembayaranAwal = 'Not Paid'; // Status awal saat customer memesan
        const statusPesananAwal = 'Pending';   // Pesanan baru masuk

        const [penjualanResult] = await connection.query(penjualanQuery, [
            tipe_pesanan === 'Dine-in' ? meja_id : null, 
            userIdForCustomerOrder, 
            total_harga, 
            statusPembayaranAwal, 
            statusPesananAwal, 
            tipe_pesanan
        ]);
        const newTransaksiId = penjualanResult.insertId;

        // 2. Siapkan dan masukkan data ke dtpenjualan
        const detailValues = items.map(item => {
            const subtotal = item.harga_satuan * item.jumlah;
            // Pastikan status_item defaultnya 'Menunggu'
            return [newTransaksiId, item.menu_id, item.jumlah, item.harga_satuan, subtotal, 'Menunggu']; 
        });

        const insertDetailQuery = `
            INSERT INTO dtpenjualan 
                (transaksi_id, menu_id, jumlah, harga_satuan, subtotal, status_item) 
            VALUES ?`;
        await connection.query(insertDetailQuery, [detailValues]);

        await connection.commit();
        
        // Kirim ID transaksi baru kembali ke frontend
        res.status(201).json({ 
            message: 'Pesanan berhasil dibuat.', 
            transaksi_id: newTransaksiId 
        });

    } catch (err) {
        await connection.rollback();
        console.error("Gagal membuat pesanan customer:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat membuat pesanan." });
    } finally {
        connection.release();
    }
});

module.exports = router;