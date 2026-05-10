import bcrypt from 'bcryptjs';
import { dbGet, dbRun, dbAll } from '../config/db.js';

export const getUsers = async (req, res) => {
  try {
    const users = dbAll('SELECT id, name, email, role, status, last_login, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = dbGet('SELECT id, name, email, role, status, last_login FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    dbRun('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role || 'cashier']);

    const lastId = dbGet('SELECT last_insert_rowid() as id');
    const user = dbGet('SELECT id, name, email, role, status FROM users WHERE id = ?', [lastId.id]);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const id = req.params.id;

    const existing = dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    dbRun(`
      UPDATE users SET
        name = ?,
        email = ?,
        role = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || existing.name,
      email || existing.email,
      role || existing.role,
      status || existing.status,
      id
    ]);

    const user = dbGet('SELECT id, name, email, role, status FROM users WHERE id = ?', [id]);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = dbRun("UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = dbGet('SELECT COUNT(*) as count FROM users').count;
    const active = dbGet("SELECT COUNT(*) as count FROM users WHERE status = 'active'").count;
    const admins = dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").count;

    res.json({ total, active, admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};