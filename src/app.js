const { startCLI } = require('./modules/cli/cli');
const { startBot } = require('./modules/telegram/bot.service');

console.log('🚀 Đang khởi động CellphoneS Browser...\n');

// Khởi động Telegram Bot (chạy nền, polling)
startBot();

// Khởi động CLI tương tác
startCLI();