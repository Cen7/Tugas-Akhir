# Perbaikan yang Masih Diperlukan

## File: `backend/routes/penjualanRoutes.js`

### Endpoint yang perlu diperbaiki: `POST /api/penjualan/:transaksi_id/bayar`

**Lokasi:** Sekitar baris 316-344

**Masalah:** 
Endpoint ini langsung set `status_pesanan = 'Completed'` saat pembayaran, padahal harusnya cek dulu apakah semua item sudah disajikan.

**Ganti kode ini:**

```javascript
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
```

**Dengan kode ini:**

```javascript
router.post('/:transaksi_id/bayar', async (req, res) => {
    const { transaksi_id } = req.params;
    const { metode_pembayaran } = req.body;

    if (!metode_pembayaran) {
        return res.status(400).json({ message: "Metode pembayaran wajib diisi." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update status pembayaran dan metode pembayaran
        await connection.query(
            `UPDATE tpenjualan 
             SET status_pembayaran = 'Paid', metode_pembayaran = ? 
             WHERE transaksi_id = ?`,
            [metode_pembayaran, transaksi_id]
        );

        // 2. Cek apakah semua item sudah disajikan
        const [itemStats] = await connection.query(
            `SELECT COUNT(*) as totalItems, 
                    SUM(CASE WHEN status_item = 'Disajikan' THEN 1 ELSE 0 END) as servedItems 
             FROM dtpenjualan 
             WHERE transaksi_id = ?`,
            [transaksi_id]
        );

        const { totalItems, servedItems } = itemStats[0];

        // 3. Update status pesanan berdasarkan kondisi
        if (totalItems > 0 && totalItems.toString() === servedItems.toString()) {
            // Semua item sudah disajikan + sudah bayar = Completed
            await connection.query(
                "UPDATE tpenjualan SET status_pesanan = 'Completed' WHERE transaksi_id = ?",
                [transaksi_id]
            );
        }
        // Jika belum semua disajikan, biarkan status_pesanan tetap (Pending/Diproses/Siap)

        await connection.commit();
        res.json({ 
            message: `Pembayaran berhasil dengan metode ${metode_pembayaran}.`,
            allItemsServed: totalItems > 0 && totalItems.toString() === servedItems.toString()
        });

    } catch (err) {
        await connection.rollback();
        console.error("Gagal memproses pembayaran:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
});
```

**Penjelasan:**
- Sekarang endpoint `/bayar` akan cek dulu apakah semua item sudah "Disajikan"
- Jika sudah bayar + semua disajikan → status jadi "Completed"
- Jika sudah bayar tapi belum semua disajikan → status tetap (Pending/Diproses/Siap)
- Ini konsisten dengan logika di endpoint `/api/meja/update-payment` yang baru kita buat
