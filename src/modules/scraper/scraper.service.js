const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

/**
 * Cào danh sách sản phẩm từ trang danh mục
 * @param {string} categoryUrl - URL đầy đủ của trang danh mục
 * @returns {Promise<Array<{id: number, name: string, price: number, url: string}>>}
 */
const scrapeProducts = async (categoryUrl) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.product-info', { timeout: 15000 });

        const products = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-info');
            return Array.from(cards).map((card, index) => {
                const nameEl = card.querySelector('.product__name');
                const priceEl = card.querySelector('.product__price--show');
                const linkEl = card.closest('a') || card.querySelector('a');

                const name = nameEl ? nameEl.innerText.trim() : 'Không rõ';
                const priceText = priceEl ? priceEl.innerText.trim() : '';
                const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
                const url = linkEl ? linkEl.href : '';

                return { id: index + 1, name, price, url };
            }).filter(p => p.name && p.price > 0);
        });

        return products;

    } catch (error) {
        console.error('Lỗi khi cào danh sách sản phẩm:', error.message);
        return [];
    } finally {
        await browser.close();
    }
};

/**
 * Cào chi tiết một sản phẩm từ URL trang sản phẩm
 * @param {string} productUrl - URL đầy đủ trang sản phẩm
 * @returns {Promise<Object>}
 */
const scrapeProductDetail = async (productUrl) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const detail = await page.evaluate(() => {
            // Tên sản phẩm
            const nameEl = document.querySelector('h1.product__name, h1[class*="name"], h1');
            const name = nameEl ? nameEl.innerText.trim() : 'Không rõ';

            // Giá: ưu tiên giá sale, nếu không có thì lấy giá gốc
            const priceEl = document.querySelector('.product-price .sale-price')
                || document.querySelector('.product-price .base-price')
                || document.querySelector('.product-price');
            const priceText = priceEl ? priceEl.innerText.trim() : '';
            const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;

            // Thông số kỹ thuật (specs)
            const specs = {};
            const specRows = document.querySelectorAll('.ksp-table tbody tr, table.parameter tr, .specifications tr');
            specRows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 2) {
                    const key = cells[0].innerText.trim();
                    const value = cells[1].innerText.trim();
                    if (key && value) specs[key] = value;
                }
            });

            // Mô tả ngắn / Highlights
            const highlights = [];
            document.querySelectorAll('.ksp-list li, .product__highlight li, .product-detail-feature li').forEach(li => {
                const text = li.innerText.trim();
                if (text) highlights.push(text);
            });

            return { name, price, specs, highlights, url: window.location.href };
        });

        return detail;

    } catch (error) {
        console.error('Lỗi khi cào chi tiết sản phẩm:', error.message);
        return null;
    } finally {
        await browser.close();
    }
};

module.exports = { scrapeProducts, scrapeProductDetail };