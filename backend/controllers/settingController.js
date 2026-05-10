import { dbGet, dbRun, dbAll } from '../config/db.js';

export const getSettings = async (req, res) => {
  try {
    const settings = dbAll('SELECT key, value FROM settings');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value ? JSON.parse(s.value) : s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSetting = async (req, res) => {
  try {
    const setting = dbGet('SELECT * FROM settings WHERE key = ?', [req.params.key]);
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    const existing = dbGet('SELECT * FROM settings WHERE key = ?', [key]);
    if (existing) {
      dbRun('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [JSON.stringify(value), key]);
    } else {
      dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    }

    const setting = dbGet('SELECT * FROM settings WHERE key = ?', [key]);
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMultiple = async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      const existing = dbGet('SELECT * FROM settings WHERE key = ?', [key]);
      if (existing) {
        dbRun('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [JSON.stringify(value), key]);
      } else {
        dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
      }
    }

    const settings = dbAll('SELECT key, value FROM settings');
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreConfig = async (req, res) => {
  try {
    const getValue = (key, defaultVal) => {
      const setting = dbGet('SELECT value FROM settings WHERE key = ?', [key]);
      return setting ? JSON.parse(setting.value) : defaultVal;
    };

    res.json({
      storeName: getValue('storeName', 'MedFlow Pharmacy'),
      storeAddress: getValue('storeAddress', ''),
      storePhone: getValue('storePhone', ''),
      currency: getValue('currency', 'PKR'),
      timezone: getValue('timezone', 'Asia/Karachi')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaxConfig = async (req, res) => {
  try {
    const getValue = (key, defaultVal) => {
      const setting = dbGet('SELECT value FROM settings WHERE key = ?', [key]);
      return setting ? JSON.parse(setting.value) : defaultVal;
    };

    res.json({
      taxRate: getValue('taxRate', 17),
      taxNumber: getValue('taxNumber', ''),
      gstNumber: getValue('gstNumber', ''),
      taxInclusive: getValue('taxInclusive', 'exclusive')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};