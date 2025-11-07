const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// Fungsi helper untuk mendapatkan rentang tanggal berdasarkan periode atau custom
const getDateRange = (period, startDate, endDate) => {
    if (period === 'Custom' && startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set ke akhir hari
        return {
            start: new Date(startDate),
            end: end
        };
    }

    const end = new Date();
    let start = new Date();
    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end };
};

// Fungsi helper untuk memformat tanggal ke format MySQL DATETIME
const formatToMySQLDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

/**
 * @route   GET /api/laporan
 * @desc    Mengambil semua data laporan berdasarkan periode atau rentang tanggal
 * @access  Private
 */
router.get('/', async (req, res) => {
    const { periode, startDate, endDate } = req.query;
    const period = periode || 'daily';

    const range = getDateRange(period, startDate, endDate);
    const start = formatToMySQLDateTime(range.start);
    const end = formatToMySQLDateTime(range.end);

    try {
        // 1. Ambil data ringkasan (summary)
        const summaryQuery = `
            SELECT
                (SELECT COALESCE(SUM(total_harga), 0) FROM tpenjualan WHERE status_pesanan = 'Selesai' AND tanggal_transaksi BETWEEN ? AND ?) AS totalPendapatan,
                (SELECT COUNT(*) FROM tpenjualan WHERE tanggal_transaksi BETWEEN ? AND ?) AS totalOrder,
                (SELECT COALESCE(SUM(total_harga), 0) FROM tpembelian WHERE tanggal_pembelian BETWEEN DATE(?) AND DATE(?)) AS totalPengeluaran
        `;
        const [summaryResult] = await pool.query(summaryQuery, [start, end, start, end, start, end]);

        // 2. Ambil data penjualan (untuk grafik daily selling), logikanya dinamis
        let dailySelling;
        const diffTime = Math.abs(range.end - range.start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 2) { // Tampilkan per jam jika rentang <= 2 hari
            const query = `SELECT DATE_FORMAT(tanggal_transaksi, '%H:00') AS label, SUM(total_harga) AS sales FROM tpenjualan WHERE status_pesanan = 'Selesai' AND tanggal_transaksi BETWEEN ? AND ? GROUP BY label ORDER BY label;`;
            const [results] = await pool.query(query, [start, end]);
            const template = Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0') + ':00', sales: 0 }));
            dailySelling = template.map(hour => {
                const sale = results.find(s => s.label === hour.label);
                return sale ? { ...hour, sales: parseFloat(sale.sales) } : hour;
            });
        } else { // Tampilkan per hari jika rentang > 2 hari
            const query = `SELECT DATE(tanggal_transaksi) AS label, SUM(total_harga) AS sales FROM tpenjualan WHERE status_pesanan = 'Selesai' AND tanggal_transaksi BETWEEN ? AND ? GROUP BY label ORDER BY label;`;
            const [results] = await pool.query(query, [start, end]);
            let dateTemplate = [];
            let currentDate = new Date(range.start);
            while (currentDate <= range.end) {
                dateTemplate.push({ label: currentDate.toISOString().split('T')[0], sales: 0 });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            dailySelling = dateTemplate.map(day => {
                const sale = results.find(s => s.label && s.label.toISOString().split('T')[0] === day.label);
                const formattedLabel = new Date(day.label).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                return sale ? { label: formattedLabel, sales: parseFloat(sale.sales) } : { ...day, label: formattedLabel };
            });
        }

        // 3. Ambil data pendapatan per kategori menu (untuk pie chart)
        const revenueByCategoryQuery = `
            SELECT km.kategori_menu_id as id, km.nama_kategori AS name, SUM(dtp.subtotal) AS value
            FROM dtpenjualan dtp
            JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
            JOIN menu m ON dtp.menu_id = m.menu_id
            JOIN kategori_menu km ON m.kategori_menu_id = km.kategori_menu_id
            WHERE tp.status_pesanan = 'Selesai' AND tp.tanggal_transaksi BETWEEN ? AND ?
            GROUP BY id, name;  -- Group berdasarkan id dan name
        `;
        const [revenueByCategoryResult] = await pool.query(revenueByCategoryQuery, [start, end]);
        const colors = ['#f97316', '#d97706', '#f59e0b', '#b45309'];
        const revenueByCategory = revenueByCategoryResult.map((item, index) => ({ ...item, value: parseFloat(item.value), color: colors[index % colors.length] }));

        // 4. Ambil data menu terlaris (best dishes)
        const bestDishesQuery = `
            SELECT m.menu_id, m.nama_menu AS name, m.harga, SUM(dtp.jumlah) AS orders
            FROM dtpenjualan dtp
            JOIN menu m ON dtp.menu_id = m.menu_id
            JOIN tpenjualan tp ON dtp.transaksi_id = tp.transaksi_id
            WHERE tp.tanggal_transaksi BETWEEN ? AND ?
            GROUP BY m.menu_id, name, m.harga
            ORDER BY orders DESC LIMIT 4;
        `;
        const [bestDishesResult] = await pool.query(bestDishesQuery, [start, end]);
        const bestDishes = bestDishesResult.map(dish => ({
            id: dish.menu_id,
            ...dish,
            price: `Rp ${parseFloat(dish.harga).toLocaleString('id-ID')}`,
            image: `/api/menu/gambar/${dish.menu_id}`
        }));
        // 5. Ambil detail transaksi pendapatan
        const pendapatanDetailsQuery = `SELECT transaksi_id as id, tanggal_transaksi as tanggal, total_harga as total FROM tpenjualan WHERE status_pesanan = 'Selesai' AND tanggal_transaksi BETWEEN ? AND ? ORDER BY tanggal_transaksi DESC;`;
        const [pendapatanDetails] = await pool.query(pendapatanDetailsQuery, [start, end]);

        // 6. Ambil detail transaksi pengeluaran
        const pengeluaranDetailsQuery = `SELECT pembelian_id as id, tanggal_pembelian as tanggal, keterangan, total_harga as total FROM tpembelian WHERE tanggal_pembelian BETWEEN DATE(?) AND DATE(?) ORDER BY tanggal_pembelian DESC, created_at DESC;`;
        const [pengeluaranDetails] = await pool.query(pengeluaranDetailsQuery, [range.start.toISOString().split('T')[0], range.end.toISOString().split('T')[0]]);

        res.json({
            summary: summaryResult[0],
            dailySelling,
            revenueByCategory,
            bestDishes,
            pendapatanDetails,
            pengeluaranDetails
        });

    } catch (err) {
        console.error("Gagal mengambil data laporan:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

module.exports = router;