const axios = require('axios');
const { BOT_TOKEN, CHAT_ID } = require('../../config/env');

const notify = async (message) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;
    try {
        await axios.get(url);
        console.log('Đã gửi thông báo Telegram thành công.');
    } catch (error) {
        console.error('Lỗi khi gửi Telegram:', error.message);
    }
};

module.exports = { notify };