# QuantFlow AI Trader - Prototype/POC

QuantFlow là một nền tảng giao dịch thuật toán (Algorithmic Trading) chuyên nghiệp dành cho cá nhân, tích hợp trình soạn thảo chiến thuật Python, hệ thống kiểm thử dữ liệu lịch sử (Backtesting) và giao diện điều khiển giao dịch trực tiếp.

## 🌟 Tính năng nổi bật

- **Dashboard Real-time:** Theo dõi biến động giá và các chỉ số PnL tổng quan với giao diện Glassmorphism hiện đại.
- **Strategy Editor:** Trình soạn thảo mã nguồn Python tích hợp Monaco Editor (nhân VS Code), hỗ trợ API Reference đầy đủ để viết logic giao dịch.
- **Hệ thống Backtest:** Mô phỏng chiến thuật trên dữ liệu lịch sử "deep history", xuất biểu đồ Equity Curve và các chỉ số quan trọng (Sharpe Ratio, Win Rate, Drawdown).
- **Live Trading Control:** 
  - Chế độ **Paper Trading** để thử nghiệm không rủi ro.
  - Kết nối API sàn (Binance) cho giao dịch thực.
  - Cơ chế **Kill-Switch** dừng khẩn cấp toàn bộ hệ thống.
- **Visualization:** Sử dụng Lightweight Charts từ TradingView cho hiệu năng hiển thị cực cao.

## 🛠 Công nghệ sử dụng

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
- **Charts:** Lightweight Charts v5.
- **Code Editor:** @monaco-editor/react.
- **Backend (Dự kiến):** FastAPI (Python), Redis (Task Queue), TimescaleDB (Lưu trữ dữ liệu chuỗi thời gian).
- **Infrastucture:** Docker & Docker Compose.

## 🚀 Hướng dẫn triển khai (Deployment)

### 1. Yêu cầu hệ thống
- Đã cài đặt **Docker** và **Docker Compose**.
- (Tùy chọn) Node.js 18+ và Python 3.10+ nếu muốn chạy không qua Docker.

### 2. Triển khai nhanh với Docker Compose
Tại thư mục gốc của dự án, chạy lệnh sau:

```bash
docker-compose up --build
```

Lệnh này sẽ khởi chạy đồng thời:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Database:** PostgreSQL/TimescaleDB tại port `5432`
- **Cache/Queue:** Redis tại port `6379`

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục backend nếu bạn muốn cấu hình sâu hơn:
```env
BINANCE_API_KEY=your_key_here
BINANCE_SECRET_KEY=your_secret_here
DATABASE_URL=postgresql://quant:password@db:5432/quantflow
REDIS_URL=redis://redis:6379
```

## 📖 Hướng dẫn sử dụng Prototype

1. **Workspace:** Sử dụng thanh Sidebar bên trái để chuyển đổi giữa các khu vực làm việc.
2. **Soạn thảo:** Tại tab `Strategy`, bạn có thể viết code Python. Sử dụng nút `API Docs` để xem các hàm hỗ trợ như `self.buy()`, `self.data.Close`, v.v.
3. **Thử nghiệm:** Nhấn `Run Backtest` để hệ thống tính toán hiệu quả chiến thuật dựa trên 5000 nến dữ liệu lịch sử mẫu.
4. **Giao dịch:** Tại tab `Live Trading`, chọn chế độ `Paper`, nhấn `Start Engine` để thấy bot bắt đầu quét tín hiệu và thực hiện lệnh giả lập trên biểu đồ realtime.

---

**Cảnh báo:** Đây là phiên bản Prototype (Proof of Concept). Logic giao dịch và kết nối API thật cần được kiểm thử kỹ lưỡng trong môi trường Sandbox trước khi sử dụng với tài sản thực.