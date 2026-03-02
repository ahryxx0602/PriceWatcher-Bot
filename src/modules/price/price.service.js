const { getLastPrice, savePrice } = require('./price.repository');

const analyzeProducts = (products) => {
    const droppedProducts = [];

    for (const { name, price } of products) {
        const lastPrice = getLastPrice(name);
        savePrice(name, price); // Luôn lưu giá mới nhất

        if (lastPrice) {
            const dropPercentage = ((lastPrice - price) / lastPrice) * 100;

            if (dropPercentage >= 5) {
                droppedProducts.push({
                    name,
                    lastPrice,
                    currentPrice: price,
                    dropPercentage: dropPercentage.toFixed(2)
                });
            }
        }
    }

    return droppedProducts;
};

module.exports = { analyzeProducts };