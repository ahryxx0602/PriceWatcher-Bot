const readline = require('readline');
const { CATEGORIES } = require('./categories');
const { scrapeProducts, scrapeProductDetail } = require('../scraper/scraper.service');
const { notify } = require('../telegram/telegram.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

const printDivider = () => console.log('─'.repeat(60));

const formatPrice = (price) =>
    price > 0 ? price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ';

// ─── Views ────────────────────────────────────────────────────────────────────

const showCategories = () => {
    console.clear();
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     🛒  CELLPHONES.COM.VN BROWSER        ║');
    console.log('╚══════════════════════════════════════════╝\n');
    console.log('📦 DANH MỤC SẢN PHẨM:\n');

    CATEGORIES.forEach(({ id, name }) => {
        console.log(`  [${String(id).padStart(2, ' ')}] ${name}`);
    });

    console.log('\n  [ 0] Thoát');
    printDivider();
};

const showProducts = (products, categoryName) => {
    console.clear();
    printDivider();
    console.log(`📂 Danh mục: ${categoryName}  (${products.length} sản phẩm)`);
    printDivider();

    products.forEach(({ id, name, price }) => {
        const priceStr = formatPrice(price);
        const shortName = name.length > 42 ? name.slice(0, 42) + '…' : name;
        console.log(`  [${String(id).padStart(3, ' ')}] ${shortName.padEnd(44)} ${priceStr}`);
    });

    console.log('\n  [  0] ← Quay lại danh mục');
    printDivider();
};

const showProductDetail = (detail) => {
    console.clear();
    printDivider();
    console.log(`📱 ${detail.name}`);
    printDivider();

    console.log(`\n💰 Giá:  ${formatPrice(detail.price)}\n`);

    if (detail.highlights && detail.highlights.length > 0) {
        console.log('✨ Điểm nổi bật:');
        detail.highlights.slice(0, 8).forEach(h => console.log(`   • ${h}`));
        console.log('');
    }

    if (detail.specs && Object.keys(detail.specs).length > 0) {
        console.log('📋 Thông số kỹ thuật:');
        Object.entries(detail.specs).slice(0, 15).forEach(([k, v]) => {
            const key = k.padEnd(25);
            console.log(`   ${key} ${v}`);
        });
        console.log('');
    }

    console.log(`🔗 URL: ${detail.url}`);
    printDivider();
};

// ─── Main Flow ────────────────────────────────────────────────────────────────

const startCLI = async () => {
    while (true) {
        // === Step 1: Chọn danh mục ===
        showCategories();
        const catInput = await ask('\n➤ Nhập ID danh mục: ');
        const catId = parseInt(catInput, 10);

        if (catId === 0) {
            console.log('\n👋 Tạm biệt!\n');
            rl.close();
            process.exit(0);
        }

        const category = CATEGORIES.find(c => c.id === catId);
        if (!category) {
            console.log('⚠️  ID không hợp lệ, vui lòng thử lại...');
            await ask('   (Nhấn Enter để tiếp tục)');
            continue;
        }

        while (true) {
            // === Step 2: Cào & hiển thị sản phẩm ===
            console.log(`\n⏳ Đang tải sản phẩm "${category.name}"...`);
            const products = await scrapeProducts(category.url);

            if (products.length === 0) {
                console.log('⚠️  Không tìm thấy sản phẩm. Quay lại...');
                await ask('   (Nhấn Enter để tiếp tục)');
                break;
            }

            showProducts(products, category.name);
            const prodInput = await ask('\n➤ Nhập ID sản phẩm (0 để quay lại): ');
            const prodId = parseInt(prodInput, 10);

            if (prodId === 0) break;

            const product = products.find(p => p.id === prodId);
            if (!product) {
                console.log('⚠️  ID không hợp lệ, vui lòng thử lại...');
                await ask('   (Nhấn Enter để tiếp tục)');
                continue;
            }

            if (!product.url) {
                console.log('⚠️  Không có URL cho sản phẩm này.');
                await ask('   (Nhấn Enter để tiếp tục)');
                continue;
            }

            // === Step 3: Cào & hiển thị chi tiết sản phẩm ===
            console.log(`\n⏳ Đang tải chi tiết "${product.name}"...`);
            const detail = await scrapeProductDetail(product.url);

            if (!detail) {
                console.log('⚠️  Không thể tải chi tiết sản phẩm.');
                await ask('   (Nhấn Enter để tiếp tục)');
                continue;
            }

            showProductDetail(detail);

            // === Step 4: Hỏi gửi Telegram ===
            const sendChoice = await ask('\n➤ Gửi sản phẩm này lên Telegram? (y/n): ');
            if (sendChoice.toLowerCase() === 'y') {
                const highlights = detail.highlights && detail.highlights.length > 0
                    ? '\n\n✨ Nổi bật:\n' + detail.highlights.slice(0, 5).map(h => `• ${h}`).join('\n')
                    : '';
                const msg =
                    `🛒 *${detail.name}*\n` +
                    `💰 Giá: ${formatPrice(detail.price)}` +
                    highlights +
                    `\n\n🔗 ${detail.url}`;
                console.log('\n⏳ Đang gửi...');
                await notify(msg);
            }

            await ask('\n➤ Nhấn Enter để quay lại danh sách...');
        }
    }
};

module.exports = { startCLI };
