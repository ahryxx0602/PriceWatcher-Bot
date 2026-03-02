const cron = require('node-cron');
const { scrapeProducts } = require('../modules/scraper/scraper.service');
const { analyzeProducts } = require('../modules/price/price.service');
const { notify } = require('../modules/telegram/telegram.service');
const { TARGET_URL } = require('../config/env');

const startJob = () => {
    console.log('🤖 Cron job giám sát giá đã khởi động...');

    // Cú pháp cron: chạy mỗi 10 giây (test), đổi lại '0 */4 * * *' khi deploy
    cron.schedule('*/10 * * * * *', async () => {
        console.log(`\n[${new Date().toISOString()}] Đang kiểm tra giá...`);

        const products = await scrapeProducts(TARGET_URL);

        if (products.length === 0) {
            console.log('⚠️ Không cào được sản phẩm nào.');
            return;
        }

        // Log danh sách sản phẩm
        console.log(`📦 Tìm thấy ${products.length} sản phẩm:`);
        products.forEach(({ name, price }) => {
            console.log(`  [✓] ${name} - ${price.toLocaleString('vi-VN')}đ`);
        });

        // Phân tích giá & gửi cảnh báo nếu giảm mạnh
        const droppedProducts = analyzeProducts(products);

        if (droppedProducts.length > 0) {
            let message = '🚨 PHÁT HIỆN GIẢM GIÁ LỚN!\n\n';
            droppedProducts.forEach(({ name, lastPrice, currentPrice, dropPercentage }) => {
                message += `📉 ${name}\n`;
                message += `   Giá cũ: ${lastPrice.toLocaleString('vi-VN')}đ → Giá mới: ${currentPrice.toLocaleString('vi-VN')}đ (-${dropPercentage}%)\n\n`;
            });
            message += `🛒 Xem tại: ${TARGET_URL}`;
            await notify(message);
            console.log(`🔔 Đã gửi cảnh báo ${droppedProducts.length} sản phẩm giảm giá!`);
        } else {
            console.log('✅ Chưa có sản phẩm nào giảm giá đáng kể.');
        }
    });
};

module.exports = { startJob };