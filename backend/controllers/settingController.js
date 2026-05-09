import Setting from '../models/Setting.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
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

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMultiple = async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true }
      );
    }

    const settings = await Setting.find();
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreConfig = async (req, res) => {
  try {
    const storeName = await Setting.findOne({ key: 'storeName' });
    const storeAddress = await Setting.findOne({ key: 'storeAddress' });
    const storePhone = await Setting.findOne({ key: 'storePhone' });
    const currency = await Setting.findOne({ key: 'currency' });
    const timezone = await Setting.findOne({ key: 'timezone' });

    res.json({
      storeName: storeName?.value || 'MedFlow Pharmacy',
      storeAddress: storeAddress?.value || '',
      storePhone: storePhone?.value || '',
      currency: currency?.value || 'PKR',
      timezone: timezone?.value || 'Asia/Karachi'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaxConfig = async (req, res) => {
  try {
    const taxRate = await Setting.findOne({ key: 'taxRate' });
    const taxNumber = await Setting.findOne({ key: 'taxNumber' });
    const gstNumber = await Setting.findOne({ key: 'gstNumber' });
    const taxInclusive = await Setting.findOne({ key: 'taxInclusive' });

    res.json({
      taxRate: taxRate?.value || 17,
      taxNumber: taxNumber?.value || '',
      gstNumber: gstNumber?.value || '',
      taxInclusive: taxInclusive?.value || 'exclusive'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};