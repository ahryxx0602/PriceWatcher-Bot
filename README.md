# 🛒 PriceWatcher Bot

Bot giám sát giá sản phẩm trên **CellphoneS** (cellphones.com.vn) — hỗ trợ cả **CLI tương tác** lẫn **Telegram Bot** với inline keyboard.

## ✨ Tính năng

- 📦 **Duyệt danh mục** — Điện thoại, Laptop, Tablet, Âm thanh, Phụ kiện...
- 📋 **Xem danh sách sản phẩm** — Tên + Giá từng sản phẩm trong danh mục
- 🔍 **Xem chi tiết sản phẩm** — Giá, điểm nổi bật, thông số kỹ thuật
- 🤖 **Telegram Bot** — Duyệt sản phẩm ngay trên Telegram bằng inline keyboard
- 📉 **Giám sát giá** — Theo dõi biến động giá, cảnh báo khi giảm ≥ 5%

## 📁 Cấu trúc dự án

```
PriceWatcher-Bot/
├── src/
│   ├── app.js                          # Entry point
│   ├── config/
│   │   └── env.js                      # Biến môi trường
│   ├── data/
│   │   └── prices.json                 # Lưu giá sản phẩm
│   ├── modules/
│   │   ├── cli/
│   │   │   ├── cli.js                  # CLI tương tác (readline)
│   │   │   └── categories.js           # Danh sách danh mục
│   │   ├── scraper/
│   │   │   └── scraper.service.js      # Puppeteer scraper
│   │   ├── price/
│   │   │   ├── price.service.js        # Phân tích giá
│   │   │   └── price.repository.js     # Đọc/ghi file JSON
│   │   └── telegram/
│   │       ├── bot.service.js          # Telegram Bot (inline keyboard)
│   │       └── telegram.service.js     # Gửi thông báo Telegram
│   └── scheduler/
│       └── cron.job.js                 # Cron job giám sát giá
├── .env                                # Cấu hình (BOT_TOKEN, CHAT_ID...)
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Cài đặt

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd PriceWatcher-Bot
npm install
```

### 2. Tạo file `.env`

```env
BOT_TOKEN=<token_bot_telegram_của_bạn>
CHAT_ID=<chat_id_của_bạn>
TARGET_URL=https://cellphones.com.vn/laptop.html
```

> **Lấy BOT_TOKEN**: Chat với [@BotFather](https://t.me/BotFather) trên Telegram → `/newbot`
>
> **Lấy CHAT_ID**: Chat với [@userinfobot](https://t.me/userinfobot) → lấy ID

### 3. Chạy ứng dụng

```bash
# Chế độ development (tự restart khi thay đổi code)
npm run dev

# Chế độ production
npm start
```

## 💬 Sử dụng

### CLI (Terminal)

Khi chạy app, giao diện CLI sẽ hiện trên terminal:

```
📦 DANH MỤC SẢN PHẨM:

  [ 1] Điện thoại
  [ 2] Laptop
  [ 3] Tablet
  ...

➤ Nhập ID danh mục: 1

📂 Danh mục: Điện thoại  (36 sản phẩm)
  [  1] iPhone 17 Pro Max 256GB               36.990.000đ
  [  2] Samsung Galaxy A56 5G                   8.590.000đ
  ...

➤ Nhập ID sản phẩm: 1

📱 iPhone 17 Pro Max 256GB
💰 Giá: 36.990.000đ
✨ Nổi bật: ...
➤ Gửi sản phẩm này lên Telegram? (y/n):
```

### Telegram Bot

1. Mở Telegram → tìm bot của bạn
2. Gửi `/start`
3. Nhấn nút danh mục → chọn sản phẩm → xem chi tiết
4. Nút **⬅ Quay lại** hoặc **🏠 Về menu chính** để điều hướng

## 🛠️ Công nghệ

| Thư viện | Mô tả |
|----------|-------|
| [Puppeteer](https://pptr.dev/) | Headless browser để cào dữ liệu |
| [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth) | Tránh bị phát hiện bot |
| [node-telegram-bot-api](https://www.npmjs.com/package/node-telegram-bot-api) | Telegram Bot API |
| [node-cron](https://www.npmjs.com/package/node-cron) | Lập lịch giám sát giá |
| [axios](https://www.npmjs.com/package/axios) | HTTP client |
| [dotenv](https://www.npmjs.com/package/dotenv) | Quản lý biến môi trường |

## 📄 License

MIT
