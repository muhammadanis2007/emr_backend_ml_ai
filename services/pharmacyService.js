
const { poolPromise } = require('../config/db');

exports.checkAndReserve = async (medName, qty) => {
  const pool = await poolPromise;
  const r = await pool.request().input('Name', medName).query("SELECT TOP 1 * FROM PharmacyInventory WHERE MedicineName LIKE '%' + @Name + '%'");
  const item = r.recordset[0];
  if (!item) return null;
  if (item.QuantityAvailable < qty) return { available: false, item };
  await pool.request().input('Id', item.MedicineId).input('NewQty', item.QuantityAvailable - qty).query('UPDATE PharmacyInventory SET QuantityAvailable=@NewQty WHERE MedicineId=@Id');
  return { available: true, item };
};
