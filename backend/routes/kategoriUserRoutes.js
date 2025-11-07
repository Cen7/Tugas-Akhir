const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kedai_miwau'
}).promise();

// GET /api/roles -> Ambil semua roles
router.get('/', async (req, res) => {
    try {
        // Expect a table named `roles` with columns: id, name, aktif
        const [results] = await pool.query('SELECT id, name, aktif FROM roles ORDER BY name ASC');
        // normalize aktif to 0/1
        const mapped = results.map(r => ({ id: r.id, name: r.name, aktif: r.aktif ? 1 : 0 }));
        res.json(mapped);
    } catch (err) {
        console.error('Database error fetching roles:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// POST /api/roles -> Tambah role
router.post('/', async (req, res) => {
    const { name, aktif } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Nama role wajib diisi' });
    }

    try {
        const [result] = await pool.query('INSERT INTO roles (name, aktif) VALUES (?, ?)', [name.trim(), aktif ? 1 : 0]);
        res.status(201).json({ id: result.insertId, name: name.trim(), aktif: aktif ? 1 : 0 });
    } catch (err) {
        console.error('Gagal menambah role:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Nama role tersebut sudah ada.' });
        }
        res.status(500).json({ message: 'Gagal menambah role' });
    }
});

// PUT /api/kategori-user/:id -> Update nama or aktif
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, aktif } = req.body;

    if (typeof name === 'undefined' && typeof aktif === 'undefined') {
        return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });
    }

    try {
        const parts = [];
        const params = [];
        if (typeof name !== 'undefined') {
            if (!name || !name.trim()) return res.status(400).json({ message: 'Nama role tidak boleh kosong.' });
            parts.push('name = ?');
            params.push(name.trim());
        }
        if (typeof aktif !== 'undefined') {
            parts.push('aktif = ?');
            params.push(aktif ? 1 : 0);
        }

        params.push(id);
        const query = `UPDATE roles SET ${parts.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Role tidak ditemukan.' });
        }

        res.json({ message: 'Role berhasil diperbarui.' });
    } catch (err) {
        console.error('Gagal update role:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Nama role tersebut sudah ada.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;
