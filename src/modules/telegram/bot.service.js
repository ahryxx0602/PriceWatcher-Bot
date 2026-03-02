const TelegramBot = require('node-telegram-bot-api');
const { BOT_TOKEN } = require('../../config/env');
const { CATEGORIES } = require('../cli/categories');
const { scrapeProducts, scrapeProductDetail } = require('../scraper/scraper.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
    price > 0 ? price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ';

// Lưu tạm danh sách sản phẩm theo chatId để tra cứu khi user chọn
const productCache = {};

// ─── Bot Init ─────────────────────────────────────────────────────────────────

const startBot = () => {
    const bot = new TelegramBot(BOT_TOKEN, { polling: true });
    console.log('🤖 Telegram Bot đã khởi động (polling)!');

    // ──────── /start: Hiển thị danh mục ────────

    const sendCategoryMenu = (chatId) => {
        const keyboard = [];
        // 2 danh mục mỗi hàng
        for (let i = 0; i < CATEGORIES.length; i += 2) {
            const row = [{ text: CATEGORIES[i].name, callback_data: `cat_${CATEGORIES[i].id}` }];
            if (CATEGORIES[i + 1]) {
                row.push({ text: CATEGORIES[i + 1].name, callback_data: `cat_${CATEGORIES[i + 1].id}` });
            }
            keyboard.push(row);
        }

        return bot.sendMessage(chatId, '🛒 *CELLPHONES\\.COM\\.VN*\n\n📦 Chọn danh mục sản phẩm:', {
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: keyboard }
        });
    };

    bot.onText(/\/start/, (msg) => {
        sendCategoryMenu(msg.chat.id);
    });

    // ──────── Xử lý callback queries ────────

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;

        try {
            // ── Chọn danh mục → hiển thị sản phẩm ──
            if (data.startsWith('cat_')) {
                const catId = parseInt(data.replace('cat_', ''), 10);
                const category = CATEGORIES.find(c => c.id === catId);
                if (!category) return bot.answerCallbackQuery(query.id, { text: '❌ Không tìm thấy danh mục' });

                await bot.answerCallbackQuery(query.id, { text: `⏳ Đang tải ${category.name}...` });
                await bot.sendMessage(chatId, `⏳ Đang tải sản phẩm *${escapeMarkdown(category.name)}*\\.\\.\\.`, { parse_mode: 'MarkdownV2' });

                const products = await scrapeProducts(category.url);

                if (products.length === 0) {
                    return bot.sendMessage(chatId, '⚠️ Không tìm thấy sản phẩm nào.');
                }

                // Lưu cache
                productCache[chatId] = { catId, products };

                // Tạo keyboard sản phẩm (1 sản phẩm mỗi hàng, hiển thị tên + giá)
                const keyboard = products.slice(0, 20).map(p => ([{
                    text: `${p.name.slice(0, 35)} - ${formatPrice(p.price)}`,
                    callback_data: `prod_${p.id}`
                }]));

                // Nút quay lại
                keyboard.push([{ text: '⬅️ Quay lại danh mục', callback_data: 'back_menu' }]);

                await bot.sendMessage(chatId,
                    `📂 *${escapeMarkdown(category.name)}* \\(${products.length} sản phẩm\\)`,
                    {
                        parse_mode: 'MarkdownV2',
                        reply_markup: { inline_keyboard: keyboard }
                    }
                );
            }

            // ── Chọn sản phẩm → hiển thị chi tiết ──
            else if (data.startsWith('prod_')) {
                const prodId = parseInt(data.replace('prod_', ''), 10);
                const cache = productCache[chatId];
                if (!cache) return bot.answerCallbackQuery(query.id, { text: '❌ Hết phiên, gửi /start lại' });

                const product = cache.products.find(p => p.id === prodId);
                if (!product) return bot.answerCallbackQuery(query.id, { text: '❌ Không tìm thấy sản phẩm' });

                await bot.answerCallbackQuery(query.id, { text: '⏳ Đang tải chi tiết...' });
                await bot.sendMessage(chatId, `⏳ Đang tải chi tiết *${escapeMarkdown(product.name.slice(0, 40))}*\\.\\.\\.`, { parse_mode: 'MarkdownV2' });

                const detail = await scrapeProductDetail(product.url);

                if (!detail) {
                    return bot.sendMessage(chatId, '⚠️ Không thể tải chi tiết sản phẩm.');
                }

                // Build message
                let msg = `📱 *${escapeMarkdown(detail.name)}*\n\n`;
                msg += `💰 Giá: *${escapeMarkdown(formatPrice(detail.price))}*\n`;

                if (detail.highlights && detail.highlights.length > 0) {
                    msg += `\n✨ *Nổi bật:*\n`;
                    detail.highlights.slice(0, 6).forEach(h => {
                        msg += `• ${escapeMarkdown(h)}\n`;
                    });
                }

                if (detail.specs && Object.keys(detail.specs).length > 0) {
                    msg += `\n📋 *Thông số:*\n`;
                    Object.entries(detail.specs).slice(0, 8).forEach(([k, v]) => {
                        msg += `• ${escapeMarkdown(k)}: ${escapeMarkdown(v)}\n`;
                    });
                }

                msg += `\n🔗 [Xem trên CellphoneS](${detail.url})`;

                const keyboard = [
                    [{ text: `⬅️ Quay lại ${CATEGORIES.find(c => c.id === cache.catId)?.name || 'danh mục'}`, callback_data: `cat_${cache.catId}` }],
                    [{ text: '🏠 Về menu chính', callback_data: 'back_menu' }]
                ];

                await bot.sendMessage(chatId, msg, {
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: false,
                    reply_markup: { inline_keyboard: keyboard }
                });
            }

            // ── Quay lại menu chính ──
            else if (data === 'back_menu') {
                await bot.answerCallbackQuery(query.id);
                sendCategoryMenu(chatId);
            }

        } catch (err) {
            console.error('Bot error:', err.message);
            bot.sendMessage(chatId, '❌ Đã xảy ra lỗi, vui lòng thử lại.');
        }
    });

    return bot;
};

// ─── Escape MarkdownV2 ────────────────────────────────────────────────────────

function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

module.exports = { startBot };
