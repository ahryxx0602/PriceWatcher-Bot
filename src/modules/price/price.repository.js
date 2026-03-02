const fs = require('fs');
const path = require('path');

// Trỏ tới file prices.json ở thư mục data
const filePath = path.join(__dirname, '../../data/prices.json');

// Đọc toàn bộ dữ liệu giá
const loadAllPrices = () => {
    if (!fs.existsSync(filePath)) return {};
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (!fileContent) return {};
    try {
        return JSON.parse(fileContent);
    } catch {
        return {};
    }
};

// Lấy giá cũ của một sản phẩm theo tên
const getLastPrice = (productName) => {
    const data = loadAllPrices();
    return data[productName]?.lastPrice || null;
};

// Lưu giá mới của một sản phẩm theo tên
const savePrice = (productName, price) => {
    const data = loadAllPrices();
    data[productName] = {
        lastPrice: price,
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = { getLastPrice, savePrice };