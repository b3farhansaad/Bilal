// ╔══════════════════════════════════════════════════════════════╗
// ║   dataDir — مساعد مسارات البيانات المعزولة لكل حساب        ║
// ║   كل حساب له مجلده الخاص في data/accounts/<userId>/        ║
// ╚══════════════════════════════════════════════════════════════╝
'use strict';
const path = require('path');
const fs   = require('fs');

/**
 * يُرجع المسار الكامل لملف بيانات في مجلد الحساب الحالي.
 * لو ACCOUNT_DATA_DIR موجود في البيئة → يُستخدم (حساب محدد)
 * وإلا → data/ مشترك (fallback للتشغيل المنفرد)
 */
function dataDir(filename) {
    const base = process.env.ACCOUNT_DATA_DIR
        ? process.env.ACCOUNT_DATA_DIR
        : path.resolve(__dirname, '../data');
    fs.mkdirSync(base, { recursive: true });
    return path.join(base, filename);
}

module.exports = dataDir;
