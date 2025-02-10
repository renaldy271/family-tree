const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;
const Database = require('better-sqlite3');
const db = new sqlite3.Database('./database/family_tree.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize DB
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo BLOB,
      name TEXT,
      info TEXT,
      category TEXT,
      age INTEGER,
      gender TEXT
    )
  `);
});

// Routes
app.get('/members', (req, res) => {
  db.all('SELECT * FROM members', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/members/:id', (req, res) => {
    const { id } = req.params;
    try {
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });    

app.post('/members', (req, res) => {
    const { name, info, category, age, gender, photo } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO members (name, info, category, age, gender, photo) VALUES (?, ?, ?, ?, ?, ?)');
      const result = stmt.run(name, info, category, age, gender, photo);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });  

app.put('/members/:id', (req, res) => {
    const { name, info, category, age, gender, photo } = req.body;
    try {
      const stmt = db.prepare('UPDATE members SET name = ?, info = ?, category = ?, age = ?, gender = ?, photo = ? WHERE id = ?');
      const result = stmt.run(name, info, category, age, gender, photo, req.params.id);
      res.json({ updated: result.changes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });  

app.delete('/members/:id', (req, res) => {
  db.run('DELETE FROM members WHERE id = ?', req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png|gif/;
      const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = fileTypes.test(file.mimetype);
  
      if (extName && mimeType) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed!'));
      }
    },
  });

  app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded!' });
    }
    res.json({ photoUrl: `/uploads/${req.file.filename}` });
  });
  
  // Static folder untuk file yang diunggah
  app.use('/uploads', express.static('uploads'));
  

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
