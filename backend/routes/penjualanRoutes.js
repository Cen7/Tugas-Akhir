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
            tp.nama_pembeli AS customer, u.nama_lengkap AS cashier, tp.tanggal_transaksi AS date
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
 * @desc    Mengambil SEMUA pesanan aktif (belum Selesai/Dibatalkan), untuk sidebar "Meja"
 * @access  Private
 */
router.get('/aktif-semua', async (req, res) => {
    try {
        const query = `
            SELECT 
                tp.transaksi_id, tp.status_pesanan, tp.status_pembayaran, tp.total_harga,
                mj.nomor_meja, tp.tipe_pesanan, tp.tanggal_transaksi, tp.nama_pembeli
            FROM tpenjualan tp
            LEFT JOIN meja mj ON tp.meja_id = mj.meja_id
            WHERE tp.status_pesanan NOT IN ('Selesai', 'Dibatalkan')
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
            WHERE tp.status_pesanan NOT IN ('Selesai', 'Dibatalkan')
              AND dtp.status_item = 'Menunggu'
            ORDER BY tp.tanggal_transaksi ASC;
        `;
        const [relevantTransactions] = await pool.query(query);

        if (relevantTransactions.length === 0) return res.json([]);
        
        const transactionIds = relevantTransactions.map(t => t.transaksi_id);

        const fullDataQuery = `
            SELECT 
                tp.transaksi_id, tp.status_pesanan, tp.status_pembayaran, tp.total_harga,
                mj.nomor_meja, tp.tipe_pesanan, tp.tanggal_transaksi, tp.nama_pembeli
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
            if (status_pembayaran === 'Lunas') {
                // Sudah bayar + semua disajikan = Selesai
                await connection.query(
                    "UPDATE tpenjualan SET status_pesanan = 'Selesai' WHERE transaksi_id = ?", 
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
    const { metode_pembayaran, jumlah_bayar, user_id } = req.body;

    if (!metode_pembayaran) {
        return res.status(400).json({ message: "Metode pembayaran wajib diisi." });
    }

    try {
        // Ambil total_harga dari database terlebih dahulu
        const [orderData] = await pool.query(
            'SELECT total_harga FROM tpenjualan WHERE transaksi_id = ?',
            [transaksi_id]
        );

        if (orderData.length === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        }

        const totalHarga = orderData[0].total_harga;

        // Tentukan jumlah_bayar dan kembalian: 
        // - Jika metode QRIS, set otomatis sesuai total_harga dan kembalian = 0
        // - Jika Cash/Tunai dan jumlah_bayar diberikan, hitung kembalian
        // - Jika tidak ada, set null
        let finalJumlahBayar = null;
        let kembalian = 0;
        
        if (metode_pembayaran === 'QRIS') {
            finalJumlahBayar = totalHarga;
            kembalian = 0; // QRIS selalu kembalian 0
        } else if (jumlah_bayar) {
            finalJumlahBayar = jumlah_bayar;
            // Hitung kembalian: jumlah_bayar - total_harga
            kembalian = Math.max(0, parseFloat(jumlah_bayar) - parseFloat(totalHarga));
        }

        // Update status pembayaran dan metode pembayaran saja
        // JANGAN langsung set status_pesanan = 'Selesai'
        // If frontend provided user_id (cashier), set it on the order. Otherwise keep existing user_id.
        const updateQuery = `
            UPDATE tpenjualan 
            SET status_pembayaran = 'Lunas', 
                metode_pembayaran = ?,
                jumlah_bayar = ?,
                kembalian = ?,
                user_id = COALESCE(?, user_id)
            WHERE transaksi_id = ?`;

        const [results] = await pool.query(updateQuery, [metode_pembayaran, finalJumlahBayar, kembalian, user_id || null, transaksi_id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        }

        // Cek apakah semua item menu sudah diceklis (Disajikan) dan tipe pesanan
        const checkItemsQuery = `
            SELECT 
                tp.tipe_pesanan,
                COUNT(*) AS total_item,
                SUM(CASE WHEN dtp.status_item = 'Disajikan' THEN 1 ELSE 0 END) AS item_disajikan
            FROM dtpenjualan dtp
            JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
            WHERE dtp.transaksi_id = ?
            GROUP BY tp.tipe_pesanan`;

        const [checkResult] = await pool.query(checkItemsQuery, [transaksi_id]);
        const { tipe_pesanan, total_item, item_disajikan } = checkResult[0];
        
        // Konversi ke number untuk memastikan perbandingan benar
        const totalItems = Number(total_item);
        const itemsDisajikan = Number(item_disajikan);

        let newStatus = null;
        let responseMessage = '';

        // LOGIKA STATUS SETELAH BAYAR:
        
        // TAKEAWAY: Lunas + Semua Disajikan = Selesai (langsung Selesai)
        if (itemsDisajikan === totalItems && tipe_pesanan === 'Takeaway') {
            newStatus = 'Selesai';
            responseMessage = `Pembayaran berhasil dengan metode ${metode_pembayaran}. Pesanan takeaway Selesai.`;
        }
        // DINE-IN: Lunas + Semua Disajikan = Siap (menunggu dikosongkan)
        else if (itemsDisajikan === totalItems && tipe_pesanan === 'Dine-in') {
            newStatus = 'Siap';
            responseMessage = `Pembayaran berhasil dengan metode ${metode_pembayaran}. Menunggu meja dikosongkan.`;
        }
        // Sebagian item disajikan + Sudah bayar = Diproses
        else if (itemsDisajikan > 0 && itemsDisajikan < totalItems) {
            newStatus = 'Diproses';
            responseMessage = `Pembayaran berhasil dengan metode ${metode_pembayaran}. Pesanan sedang diproses.`;
        }
        // Belum ada item disajikan + Sudah bayar = Tetap Pending (menunggu kitchen mulai kerja)
        else if (itemsDisajikan === 0) {
            newStatus = 'Pending';
            responseMessage = `Pembayaran berhasil dengan metode ${metode_pembayaran}. Pesanan menunggu diproses kitchen.`;
        }

        if (newStatus) {
            await pool.query(
                `UPDATE tpenjualan SET status_pesanan = ? WHERE transaksi_id = ?`,
                [newStatus, transaksi_id]
            );
        }

        res.json({ 
            message: responseMessage,
            status_pesanan: newStatus,
            items_disajikan: itemsDisajikan,
            total_items: totalItems,
            jumlah_bayar: finalJumlahBayar,
            kembalian: kembalian
        });
    } catch (err) {
        console.error("Gagal memproses pembayaran:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

/**
 * @route   POST /api/penjualan/:transaksi_id/siap
 * @desc    Tandai pesanan siap (set semua item Disajikan dan status pesanan Siap)
 * @access  Private (untuk Dapur)
 */
router.post('/:transaksi_id/siap', async (req, res) => {
    const { transaksi_id } = req.params;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Set semua item menjadi Disajikan
        await connection.query(
            `UPDATE dtpenjualan 
             SET status_item = 'Disajikan' 
             WHERE transaksi_id = ?`,
            [transaksi_id]
        );

        // 2. Cek status pembayaran
        const [orderData] = await connection.query(
            `SELECT status_pembayaran FROM tpenjualan WHERE transaksi_id = ?`,
            [transaksi_id]
        );

        if (orderData.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        }

        const statusPembayaran = orderData[0].status_pembayaran;

        // 3. Update status pesanan berdasarkan pembayaran
        const newStatus = statusPembayaran === 'Lunas' ? 'Selesai' : 'Siap';
        
        await connection.query(
            `UPDATE tpenjualan 
             SET status_pesanan = ? 
             WHERE transaksi_id = ?`,
            [newStatus, transaksi_id]
        );

        await connection.commit();
        
        res.json({ 
            message: `Pesanan berhasil ditandai siap. Status: ${newStatus}`,
            status_pesanan: newStatus
        });
    } catch (err) {
        await connection.rollback();
        console.error("Gagal menandai pesanan siap:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
});

/**
 * @route   POST /api/penjualan/:transaksi_id/batal
 * @desc    Membatalkan pesanan (set status_pesanan = 'Dibatalkan')
 * @access  Private
 */
router.post('/:transaksi_id/batal', async (req, res) => {
    const { transaksi_id } = req.params;

    try {
        // Cek apakah pesanan ada dan belum dibayar
        const checkQuery = `
            SELECT status_pembayaran, status_pesanan, tipe_pesanan, meja_id 
            FROM tpenjualan 
            WHERE transaksi_id = ?`;
        const [checkResult] = await pool.query(checkQuery, [transaksi_id]);

        if (checkResult.length === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        }

        const { status_pembayaran, status_pesanan, tipe_pesanan, meja_id } = checkResult[0];

        // Tidak boleh batalkan pesanan yang sudah dibayar atau sudah Dibatalkan
        if (status_pembayaran === 'Lunas') {
            return res.status(400).json({ message: "Tidak dapat membatalkan pesanan yang sudah dibayar." });
        }

        if (status_pesanan === 'Dibatalkan' || status_pesanan === 'Cancel') {
            return res.status(400).json({ message: "Pesanan sudah dibatalkan sebelumnya." });
        }

        // Update status pesanan menjadi Dibatalkan (TIDAK mengubah status_pembayaran)
        const updateQuery = `
            UPDATE tpenjualan 
            SET status_pesanan = 'Dibatalkan'
            WHERE transaksi_id = ?`;
        await pool.query(updateQuery, [transaksi_id]);

        // Jika dine-in, kosongkan meja (set status meja jadi 'tersedia')
        if (tipe_pesanan === 'Dine-in' && meja_id) {
            await pool.query(
                `UPDATE meja SET status = 'tersedia' WHERE meja_id = ?`,
                [meja_id]
            );
        }

        res.json({ 
            message: "Pesanan berhasil dibatalkan.",
            transaksi_id,
            meja_dikosongkan: tipe_pesanan === 'Dine-in' && meja_id ? true : false
        });
    } catch (err) {
        console.error("Gagal membatalkan pesanan:", err);
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
                tp.nama_pembeli AS customer, u.nama_lengkap AS cashier, tp.tanggal_transaksi AS date
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
    const { tipe_pesanan, items, total_harga, meja_id, nama_pembeli } = req.body; // Ambil meja_id juga jika Dine-in

    // --- Validasi Sederhana ---
    if (!tipe_pesanan || !items || items.length === 0 || !total_harga || !nama_pembeli) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap." });
    }
    // Tambahkan validasi lain jika perlu (misal cek apakah menu_id valid, dll.)

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Jika Dine-in, cek apakah meja tersedia
        if (tipe_pesanan === 'Dine-in' && meja_id) {
            const [mejaCheck] = await connection.query(
                `SELECT status FROM meja WHERE meja_id = ?`,
                [meja_id]
            );

            if (mejaCheck.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: "Meja tidak ditemukan." });
            }

            // Meja harus "tersedia" (bukan "terisi" atau "tidak tersedia")
            if (mejaCheck[0].status !== 'tersedia') {
                await connection.rollback();
                connection.release();
                
                if (mejaCheck[0].status === 'terisi') {
                    return res.status(400).json({ message: "Meja sudah terisi dengan pesanan aktif." });
                } else {
                    return res.status(400).json({ message: "Meja sedang tidak tersedia." });
                }
            }

            // Cek apakah ada pesanan aktif di meja ini (double check)
            const [activeOrderCheck] = await connection.query(
                `SELECT transaksi_id FROM tpenjualan 
                 WHERE meja_id = ? 
                 AND status_pesanan NOT IN ('Selesai', 'Dibatalkan')`,
                [meja_id]
            );

            if (activeOrderCheck.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: "Meja sudah terisi dengan pesanan aktif." });
            }
        }

        // 1. Masukkan data ke tpenjualan
        const penjualanQuery = `
            INSERT INTO tpenjualan 
                (meja_id, user_id, total_harga, status_pembayaran, status_pesanan, tipe_pesanan, nama_pembeli, tanggal_transaksi) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        
        // Gunakan user_id khusus untuk pesanan customer via QR code
        // ID 11 = customer_order, ID 999 = customer_qr, ID 1000 = customer_online
        const userIdForCustomerOrder = 999; // customer_qr (untuk pesanan via QR code)
        const statusPembayaranAwal = 'Belum Lunas'; // Status awal saat customer memesan
        const statusPesananAwal = 'Pending';   // Pesanan baru masuk

        const [penjualanResult] = await connection.query(penjualanQuery, [
            tipe_pesanan === 'Dine-in' ? meja_id : null, 
            userIdForCustomerOrder, 
            total_harga, 
            statusPembayaranAwal, 
            statusPesananAwal, 
            tipe_pesanan,
            nama_pembeli
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

        // 3. Jika Dine-in, update status meja jadi "terisi"
        if (tipe_pesanan === 'Dine-in' && meja_id) {
            await connection.query(
                `UPDATE meja SET status = 'terisi' WHERE meja_id = ?`,
                [meja_id]
            );
        }

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