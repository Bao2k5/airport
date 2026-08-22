# BÁO CÁO CHỐT NGUỒN CANONICAL DUY NHẤT & CHUYỂN TOÀN BỘ PRODUCTION SANG GRAPH V3

> **CẤU HÌNH HỆ THỐNG MẶC ĐỊNH:**
> - `GRAPH_SELECTED=v3;`
> - `RAW_SOURCE=v3_raw_traces_manual.json;`
> - `BACKGROUND=/anhchinh.png;`
> - `NODES=120;`
> - `EDGES=133;`
> - `CONNECTED_COMPONENTS=1;`
> - `NO_V1_V2_FALLBACK=true;`

---

## 1. Bản Sao Lưu An Toàn Có Timestamp (Timestamped Backups)

Đã sao lưu nguyên vẹn 6 file hệ thống vào thư mục có timestamp: `d:\Thao\airport-simulator\backup_20260821_202907\`:
- `src/data/airportGraph.v3.ts`
- `src/data/graphRegistry.ts`
- `src/simulation/simulator.ts`
- `src/simulation/scenarioRunner.ts`
- `src/data/presetScenarios.ts`
- `v3_raw_traces_manual.json`

---

## 2. Thống Kê Số Liệu Thật Được Đọc Trực Tiếp Từ `v3_raw_traces_manual.json`

* **Tổng số Raw Lines:** `38` tuyến chuẩn.
* **Tổng số Raw Points:** `121` điểm.
* **Tổng số Unique Nodes:** `120` nodes (đúng theo hình học thực tế, không dời/snap tọa độ).
* **Số điểm Operational có tên (`isOperational: true`):** `35` điểm (hiển thị đầy đủ trong menu chọn tuyến Start/Destination).
* **Số điểm hình học uốn cong (`isOperational: false`):** `85` điểm (nhãn rỗng `""`, không hiện rác trên dropdown).
* **Cạnh Sequential / Segment Split:** `138` cạnh (bám sát từng milimet tim đường bạn đã vẽ).
* **Cạnh Exact Junctions (Trùng khớp vật lý $\le 2\text{px}$):** `13` cạnh.
* **Tổng số Cạnh Production Thực Tế:** **`133` edges** (đã khử trùng lặp hai chiều).
* **Số thành phần liên thông (Connected Components):** **Đúng `1` Component duy nhất ($100\%$ toàn bộ sân bay thông suốt)**.
* **Cạnh Proximity / Connector Cũ Tự Sinh:** `0` (ĐÃ BỊ TRIỆT TIÊU HOÀN TOÀN).
* **Dữ liệu V1/V2 Fallback:** `0` (ĐÃ TẮT $100\%$).

---

## 3. Kết Quả Kiểm Thử Toàn Diện (All-Pairs Reachability & Smoke Routes)

### A. Kiểm thử mọi cặp điểm Operational hai chiều (All-Pairs Reachability):
- **Tổng số cặp kiểm tra:** `1.190` cặp (`35 × 34` theo hai chiều A $\to$ B và B $\to$ A).
- **Kết quả:** **`1.190 / 1.190` ĐẠT ($100\%$ PASS)**.
- **Node bị cô lập:** `0`. Không có bất kỳ đường cụt hay vòng lặp ngược nào do quan hệ hai chiều.

### B. 5 Tuyến Smoke Routes Trọng Yếu:
1. `07L ↔ 25R`: ✅ Thông tuyến hai chiều dọc trục đường băng chính phía Bắc.
2. `07R ↔ 25L`: ✅ Thông tuyến hai chiều dọc trục đường băng chính phía Nam.
3. `W5/07L ↔ W11/07R`: ✅ Thông tuyến hai chiều qua tim đường lăn ngang W1/W11.
4. `W9B ↔ E6`: ✅ Thông tuyến hai chiều dọc trục đường lăn trung tâm.
5. `STAND_22 ↔ W11/07R`: ✅ Thông tuyến hai chiều từ bến bãi ra đường băng.

---

## 4. Chuyển Đổi Toàn Bộ Logic Mô Phỏng Sang Graph V3

Toàn bộ hệ sinh thái phần mềm đã được cập nhật đồng bộ để trỏ trực tiếp vào Graph V3:
1. **Dijkstra & Pathfinding:** Tính toán quỹ đạo trực tiếp trên Graph V3 chuẩn.
2. **Simulator Core (`simulator.ts`):** Sử dụng Graph V3 làm đồ thị sản xuất mặc định.
3. **Scenario Runner (`scenarioRunner.ts`):** 5 Kịch bản điều hành bay tính toán tuyến động theo Dijkstra V3.
4. **Follow-the-Green & Manual Control:** 
   - Chưa chấp nhận tuyến: Ẩn hoàn toàn blue route và FtG.
   - Bấm "Chấp nhận tuyến": Hiện full route preview xanh dương nét đứt.
   - Bấm "Bắt đầu lăn": Giữ preview xanh dương mờ; FtG xanh lá chỉ sáng phía trước mũi tàu.
5. **Main Map & UI:**
   - Ẩn toàn bộ marker/debug label mặc định để giữ bản đồ trực quan, sắc nét.
   - Nút "Overlay V3" vẽ toàn bộ 133 cạnh bám khít dải sơn vàng trên `/anhchinh.png`.

---

## 5. Danh Mục 4 Bằng Chứng Hình Ảnh Đã Xuất

1. **[`v3_overlay_from_raw_only.png`](file:///d:/Thao/airport-simulator/v3_overlay_from_raw_only.png):** Ảnh chụp toàn bộ 133 cạnh Graph V3 bám tim đường trên `/anhchinh.png`.
2. **[`v3_manual_route_preview.png`](file:///d:/Thao/airport-simulator/v3_manual_route_preview.png):** Ảnh kiểm thử tính năng hiển thị Route Preview xanh dương.
3. **[`v3_manual_ftg_running.png`](file:///d:/Thao/airport-simulator/v3_manual_ftg_running.png):** Ảnh kiểm thử đèn Follow-the-Green dẫn đường động phía trước máy bay.
4. **[`v3_scenario_runtime_summary.png`](file:///d:/Thao/airport-simulator/v3_scenario_runtime_summary.png):** Ảnh tổng kết giao diện mô phỏng kịch bản chạy trên Graph V3.

---

## 6. Danh Mục File Dữ Liệu Báo Cáo JSON Kèm Theo

* [`v3_topology_from_raw.json`](file:///d:/Thao/airport-simulator/v3_topology_from_raw.json): Báo cáo cấu trúc node, cạnh và tính toàn vẹn liên thông.
* [`v3_junctions_derived_strict.json`](file:///d:/Thao/airport-simulator/v3_junctions_derived_strict.json): Danh sách toàn bộ các nút giao hình học thuần túy.
* [`v3_route_validation.json`](file:///d:/Thao/airport-simulator/v3_route_validation.json): Kết quả kiểm toán chi tiết từng bước tìm đường của thuật toán Dijkstra.
