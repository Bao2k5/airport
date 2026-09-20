# 🛫 Tân Sơn Nhất Airport Surface Movement Simulator (TSN V3)

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Educational-green?style=flat-square)](#license)

> **Mô phỏng điều hành giám sát mặt đất (A-SMGCS) & Dẫn đường theo đèn xanh (Follow-the-Green) tại Cảng HKQT Tân Sơn Nhất (SGN / VVTS).**

---

## 📌 Tổng quan (Overview)

**Airport Surface Movement Simulator (TSN V3)** là ứng dụng mô phỏng trực quan độ chính xác cao phục vụ nghiên cứu và đào tạo hàng không. Ứng dụng tập trung mô phỏng hệ thống **A-SMGCS (Advanced Surface Movement Guidance and Control System)** kết hợp công nghệ **Follow-the-Green (FTG)**, so sánh trực quan hiệu quả vận hành giữa phương thức dẫn đường tự động hiện đại và phương thức điều hành truyền thống qua thoại vô tuyến (VHF Voice ATC).

---

## ✨ Tính năng nổi bật (Key Features)

### 🗺️ Mô hình bề mặt sân đỗ chuẩn xác (TSN V3 Surface Model)
- Hiệu chỉnh tọa độ trực tiếp trên nền không ảnh vệ tinh độ phân giải cao (`/anhchinh.png`).
- Hệ thống đồ thị sân bay gồm **45 nút vận hành tiêu chuẩn**: bến đỗ (Stands), điểm dừng chờ (Holding Points, Stop Bars), đường lăn (Taxiways: W, E, NS) và ngưỡng đường băng cất/hạ cánh (25L/07R & 25R/07L).

### 🟢 Dẫn dắt thông minh Follow-the-Green (FTG)
- Đèn tim đường lăn (Centerline Green Lights) tự động sáng dẫn đường riêng biệt cho từng tàu bay theo lộ trình cấp phép.
- Thanh dừng (Stop Bar Red Lights) tự động bật đỏ bảo vệ an toàn khi có xung đột giao cắt hoặc đường băng đang bận.

### 🎮 Điều khiển thủ công đa tàu bay (Multi-Aircraft Manual Mode)
- Điều phối đồng thời đội bay 6 tàu bay thương mại thuộc các hãng hàng không nội địa và quốc tế (Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines, Singapore Airlines, Thai Airways).
- Mô phỏng cơ chế đẩy lùi (Pushback 3 giai đoạn), quay đầu rời bến, giữ giãn cách an toàn tự động và chống xâm phạm đường băng (Runway Incursion Prevention).

### ⚡ Phản ứng sự cố & Định tuyến động (Dynamic Incident Avoidance)
- Cho phép kích hoạt sự cố thực địa (FOD, phương tiện cản trở, đóng đường lăn).
- Thuật toán tìm đường **Dijkstra** tự động tái định tuyến (Dynamic Rerouting) vòng qua vật cản, tự dừng an toàn nếu toàn bộ ngả đường bị phong tỏa.

---

## 📋 5 Kịch bản khai thác tiêu chuẩn (Preset Operational Scenarios)

| Kịch bản | Tiêu đề | Mô tả tình huống | Phương thức so sánh |
| :--- | :--- | :--- | :--- |
| **Kịch bản 1** | **Rẽ nhầm đường lăn & Mất liên lạc** | HVN216 rẽ nhầm vào đường lăn E4, mất liên lạc VHF. Hệ thống tự động kích hoạt thanh dừng đỏ ngăn chặn xâm phạm đường băng. | FTG vs Truyền thống |
| **Kịch bản 2** | **Cháy động cơ khẩn nguy** | BAV315 hạ cánh khẩn cấp trên 25R, thoát nhanh vào W4. Đội cứu hỏa khẩn nguy tiếp cận phun bọt, chuyển hướng các chuyến bay khác sang Stand 17. | Ứng phó khẩn nguy |
| **Kịch bản 3** | **Xung đột giao lộ HS NS** | Giải quyết xung đột ưu tiên tại nút giao cắt HS NS giữa tàu bay hạ cánh (VN301) và tàu bay khởi hành (TG302). | Phân cách tự động |
| **Kịch bản 4** | **Sự cố FOD đóng đường lăn W7A** | Phát hiện vật thể lạ (FOD) trên đường lăn W7A. Hệ thống tự động chuyển hướng tàu bay vòng qua W3 & E6 về bến đỗ an toàn. | Tái định tuyến Dijkstra |
| **Kịch bản 5** | **Đổi chiều cất hạ cánh giờ cao điểm (07R/25L)** | Mô phỏng đồng thời 6 tàu bay chuyển đổi hướng cất hạ cánh từ 25L sang 07R. So sánh trực tiếp giữa **FTG tự động** (giãn cách 2s) và **ATC truyền thống** (nghẽn lệnh thoại, chờ tích lũy). | So sánh đối chiếu kép |

---

## 🛠️ Bộ công cụ hiệu chuẩn đồ thị (Calibration & Annotation Suite)

Ứng dụng tích hợp sẵn 2 công cụ chuyên dụng cho kỹ sư dữ liệu hàng không:

- **Node Annotator** (`/annotate.html`): Công cụ ghim tọa độ, chỉnh sửa vị trí nút mạng, Stand và Stop Bar trực tiếp trên ảnh nền.
- **Junction Connector** (`/annotate_junctions.html`): Công cụ kiểm tra hình học các giao lộ, nối cạnh và xác thực đường lăn.

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
airport-simulator/
├── public/
│   └── anhchinh.png                # Không ảnh vệ tinh nền Cảng HKQT Tân Sơn Nhất
├── src/
│   ├── components/                 # Giao diện bản đồ SVG, bảng điều khiển, HUD thông báo
│   │   ├── AirportMap.tsx          # Bản đồ sân bay, render đèn FTG và tàu bay
│   │   ├── ControlPanel.tsx        # Bảng điều phối thủ công, tùy chỉnh thời tiết, sự cố
│   │   ├── PresetScenariosPanel.tsx# Bảng chọn và giám sát 5 kịch bản
│   │   ├── ScenarioAtcHudBar.tsx   # Thanh Dynamic Island hiển thị huấn lệnh ATC
│   │   ├── Scenario1ComparisonView.tsx # Giao diện so sánh Kịch bản 1
│   │   └── ScenarioComparisonView.tsx  # Giao diện so sánh Kịch bản 5
│   ├── data/                       # Dữ liệu mạng lưới sân bay và kịch bản
│   │   ├── airportGraph.v3.ts      # Đồ thị đỉnh - cạnh TSN V3 chuẩn hóa
│   │   └── scenarios/              # Định nghĩa dữ liệu 5 kịch bản khai thác
│   ├── simulation/                 # Động cơ mô phỏng vật lý và thuật toán
│   │   ├── simulator.ts            # Vòng lặp mô phỏng, giãn cách an toàn, tránh vật cản
│   │   ├── scenarioRunner.ts       # Động cơ chạy kịch bản tự động
│   │   └── pathfinding.ts          # Thuật toán tìm đường tối ưu Dijkstra
│   ├── utils/                      # Tiện ích lưu trữ (localStorage) và âm thanh ATC
│   ├── annotate.tsx                # Trang công cụ chấm tọa độ Node
│   ├── annotate_junctions.tsx      # Trang công cụ nối giao lộ
│   └── App.tsx                     # Entry point chính của ứng dụng
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng (Getting Started)

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18.0 trở lên
- **Trình duyệt**: Google Chrome, Microsoft Edge hoặc Safari hỗ trợ SVG/Canvas mượt mà

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi chạy máy chủ phát triển
```bash
npm run dev
```

Sau khi chạy lệnh, truy cập các địa chỉ tương ứng trên trình duyệt:
- **Bộ mô phỏng chính**: [http://localhost:5173/](http://localhost:5173/)
- **Công cụ hiệu chuẩn Node**: [http://localhost:5173/annotate.html](http://localhost:5173/annotate.html)
- **Công cụ hiệu chuẩn Giao lộ**: [http://localhost:5173/annotate_junctions.html](http://localhost:5173/annotate_junctions.html)

### 3. Đóng gói ứng dụng (Build Production)
```bash
npm run build
```
Toàn bộ mã nguồn đóng gói tối ưu sẽ được xuất ra thư mục `dist/`.

---

## 📄 Bản quyền (License)

Dự án phục vụ mục đích **Học tập, Nghiên cứu và Trực quan hóa công nghệ Hàng không**.  
Mọi thông tin tham chiếu dựa trên cấu trúc mặt đất thực tế tại Cảng Hàng không Quốc tế Tân Sơn Nhất.
