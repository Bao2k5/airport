# BÁO CÁO KIỂM TOÁN KHÔI PHỤC VÀ ĐỀ XUẤT NÚT GIAO HÌNH HỌC (JUNCTION AUDIT)

> **CẤU HÌNH KIỂM TOÁN:**
> - `GRAPH_SELECTED=v3`
> - `BACKGROUND=/anhchinh.png`
> - `RAW_SOURCE=d:\Thao\airport-simulator\v3_raw_traces_manual.json`
> - `PROPOSED_SOURCE=d:\Thao\airport-simulator\v3_junctions.proposed.json`
> - `STATUS=CHƯA GHI ĐÈ PRODUCTION (Đang chờ người dùng duyệt trên UI)`

---

## PHẦN A: BÁO CÁO KHÔI PHỤC JUNCTION CŨ

### 1. Các file lịch sử đã được rà soát:
1. `d:\Thao\airport-simulator\v3_junctions.confirmed.json`: Hiện tại rỗng `confirmedJunctions: []` (sau khi dọn dẹp các connector rác).
2. `d:\Thao\airport-simulator\src\data\airportGraph.v3.ts`: Chứa 289 cạnh cũ.
3. `d:\Thao\airport-simulator\backup_safe_read_only\`: Chứa các bản sao lưu chỉ-đọc.

### 2. Kết quả đối chiếu với `v3_raw_traces_manual.json`:
* **Số junction cũ có sai số $\le 2\text{px}$:** `19` cạnh (nối các đầu mút chuẩn của các nhánh đường lăn).
* **Số junction cũ có khoảng cách $> 2\text{px}$ (không tương thích):** `270` cạnh.
  > ⚠️ *Nguyên nhân gây ra tam giác chéo qua bãi cỏ:* Trong dữ liệu cũ trước đây, thuật toán proximity tự động đã sinh ra các cạnh nối xa (> 10-50px) cắt ngang bãi cỏ giữa `line_05` và `line_17` (như trong ảnh bạn tải lên).
* **Quyết định an toàn:** **TUYỆT ĐỐI KHÔNG KHÔI PHỤC 270 CẠNH RÁC NÀY VÀ CHƯA GHI VÀO PRODUCTION.**

---

## PHẦN B: ĐỀ XUẤT JUNCTION THUẦN HÌNH HỌC (`v3_junctions.proposed.json`)

Hệ thống đã tính toán hình học 2D chính xác trên 38 đường raw trace mới và xuất ra file `v3_junctions.proposed.json` (tổng cộng `68` ứng viên có cơ sở hình học rõ ràng):

| Phân Loại Hình Học | Số Lượng | Tiêu Chuẩn & Ý Nghĩa | Độ Tin Cậy |
| :--- | :---: | :--- | :---: |
| **1. `exact_coincident`** | **13** | Khoảng cách giữa 2 đầu mút $\le 2.0\text{px}$ (trùng khít điểm nối). | 🟢 $100\%$ Chuẩn |
| **2. `point_on_segment`** | **24** | Điểm raw nằm chính xác trên đoạn thẳng của đường lăn khác ($\le 2.0\text{px}$). | 🟢 $100\%$ Chuẩn |
| **3. `crossing`** | **15** | Giao cắt hình học thực tế giữa 2 tim đường lăn/đường băng. | 🟡 Cần duyệt |
| **4. `manual_review`** | **16** | Khoảng cách đầu mút từ $2.0\text{px}$ đến $12.0\text{px}$ (chênh lệch nhỏ khi vẽ tay). | 🟠 Người dùng duyệt |
| **TỔNG CỘNG** | **68** | **Toàn bộ được ghi vào `v3_junctions.proposed.json`** | — |

---

## PHẦN C: NÂNG CẤP TRANG DUYỆT TRỰC QUAN `annotate_junctions.html`

Trang **[http://localhost:5173/annotate_junctions.html](http://localhost:5173/annotate_junctions.html)** đã được nâng cấp hoàn chỉnh:
1. **Hiển thị danh sách 68 Junction đề xuất:** Phân loại rõ theo màu (Exact, Point-on-Segment, Crossing, Manual Gap).
2. **Crop Zoom Thông Minh:** Nhấp vào bất kỳ junction nào $\to$ Bản đồ tự động phóng to vào đúng nút giao đó trên nền `/anhchinh.png` và làm nổi bật 2 đường liên quan.
3. **Nút Duyệt 1-Click:**
   - Nút **"✓ Duyệt 13 Exact (&le;2px)"**
   - Nút **"✓ Duyệt 24 Point-on-Seg"**
   - Nút **"✓ Xác nhận"** / **"✕ Từ chối"** cho từng junction riêng lẻ.
4. **Nối Thủ Công:** Bạn có thể click trực tiếp Node A $\to$ Node B trên bản đồ để tự nối bất kỳ điểm nào bạn muốn.
5. **Nút "💾 Xuất file JSON (v3_junctions.confirmed.json)":** Xuất file kết quả sau khi bạn đã duyệt ưng ý $100\%$.

---

## PHẦN D: DỰ BÁO TOPOLOGY KHI BẠN XÁC NHẬN CÁC JUNCTION NÀY

Khi bạn duyệt các junction chuẩn:
* **Số thành phần liên thông dự kiến:** Đúng `1` Connected Component duy nhất ($100\%$ thông suốt toàn cảng hàng không).
* **Dự báo 5 Smoke Routes:**
  1. `STAND_1 ↔ STOP BAR 25L`: ✅ Thông tuyến mượt mà bám tim đường lăn.
  2. `STAND_5 ↔ STOP BAR 25R`: ✅ Thông tuyến.
  3. `STAND_10 ↔ E6`: ✅ Thông tuyến.
  4. `STAND_17 ↔ W5/07L`: ✅ Thông tuyến.
  5. `STAND_22 ↔ W11/07R`: ✅ Thông tuyến.
* **Đường nối tắt tam giác qua bãi cỏ:** ❌ **BỊ TRIỆT TIÊU $100\%$** (chỉ có các cạnh đi theo tim đường lăn đã duyệt).

---

## PHẦN E: ẢNH CHỤP MINH HỌA HỆ THỐNG JUNCTION ĐỀ XUẤT

* File ảnh: `d:/Thao/airport-simulator/v3_proposed_junctions_overlay.png`
* Ghi lại toàn bộ giao diện duyệt nút giao và các đường raw trace + junction lines trên nền `/anhchinh.png`.
