# BÁO CÁO KIỂM THỬ CÚ PHÁP & RENDER MERMAID
## DỰ ÁN: A-SMGCS + FOLLOW-THE-GREEN (GRAPH V3 - TÂN SƠN NHẤT)

---

### I. THÔNG SỐ KIỂM ĐỊNH MÔI TRƯỜNG DỮ LIỆU
- **GRAPH_SELECTED**: `v3`
- **NODES**: `145` (44 operational named nodes + 101 geometry nodes)
- **EDGES**: `289` (96 sequential edges + 86 confirmed junction edges + 107 connector edges)
- **BACKGROUND**: `/anhchinh.png`
- **TOPOLOGY_HASH**: `0d7164f1f8223aec`

---

### II. BẢNG KẾT QUẢ KIỂM THỬ CÚ PHÁP 7 SƠ ĐỒ MERMAID

| Block | Loại sơ đồ | Tên sơ đồ | Ràng buộc kỹ thuật | Kết quả | Ghi chú |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **Block 1** | `Flowchart TD` | Flowchart tổng quát vận hành A-SMGCS + FtG | Rẽ nhánh điều kiện, Rolling Window, Dijkstra | **PASS** | Cú pháp chuẩn, không chứa mã màu HTML |
| **Block 2** | `sequenceDiagram` | Kịch bản 1: LVC, Taxi sai tuyến & Mất liên lạc | `autonumber`, 4 participants, `par`, `alt` | **PASS** | Tên participant không chứa ký tự `/` |
| **Block 3** | `sequenceDiagram` | Kịch bản 2: Khẩn nguy ưu tiên (BAV315) | `autonumber`, 5 participants, `par`, Note chiều 25 | **PASS** | Tuân thủ hướng hạ cánh PHẢI $\to$ TRÁI |
| **Block 4** | `sequenceDiagram` | Kịch bản 3: Xung đột giao lộ HS NS trong LVC | `autonumber`, 4 participants, `par` phân quyền | **PASS** | Đúng điểm đến STAND_17, không dùng STAND_16 |
| **Block 5** | `sequenceDiagram` | Kịch bản 4: Chướng ngại vật FOD đóng W7A | `autonumber`, 4 participants, `alt` reroute | **PASS** | Tuyến vòng Dijkstra 17 nodes trên Graph V3 |
| **Block 6** | `sequenceDiagram` | Kịch bản 5: Đảo chiều 25 $\to$ 07 (Truyền thống) | `autonumber`, 5 participants, mốc thời gian thoại | **PASS** | Khớp đồng hồ mô phỏng $4133\text{s}$ ($68:53$) |
| **Block 7** | `sequenceDiagram` | Kịch bản 5: Đảo chiều 25 $\to$ 07 (A-SMGCS + FtG) | `autonumber`, 5 participants, Auto-Freeze & 2 Pha | **PASS** | Khớp đồng hồ mô phỏng $3164\text{s}$ ($52:44$) |

---

### III. KẾT LUẬN TỔNG QUAN
- **Tổng số block kiểm tra**: **7**
- **Số block PASS**: **7 / 7 (100.0%)**
- **Khả năng hiển thị**: Tương thích $100\%$ với GitHub Markdown Renderer, Mermaid CLI (`@mermaid-js/mermaid-cli`), Obsidian và VS Code Markdown Preview.
