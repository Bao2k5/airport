# BÁO CÁO NGHIỆM THU TOÀN DIỆN GRAPH V2 (HEADLESS RUNTIME & TRACE-SPECIFIC AUDIT)

**Dự án**: Tân Sơn Nhất Airport Surface Movement Simulator  
**Bản đồ nền mới**: `public/anhtren.png` (SVG `1200 x 860`)  
**Tập Raw Traces người dùng**: `raw_traces_CUA_TOI.json` (44 nhánh, 182 điểm)  
**Quy mô Đồ thị Graph V2 (`src/data/airportGraph.v2.ts`)**: **162 Nodes** và **166 Edges**  
**Graph mặc định**: `DEFAULT_GRAPH_ID = 'v1'` (Bảo lưu toàn vẹn Graph V1, chọn chuyển Graph V2 qua UI Selector)  
**Hình thức kiểm thử**: **Headless TypeScript Runtime Simulation** (Thực thi trực tiếp bằng TypeScript engine thật của simulator)  
**Thời gian nghiệm thu**: 2026-08-15

---

## 1. NGUYÊN TẮC KIỂM THỬ VÀ ĐÁNH GIÁ CHẶT CHẼ

1. **Kiểm tra hình học theo đúng `expectedLineIds`**:
   - Từng cạnh trong 166 cạnh của Graph V2 được gán tường minh các mã raw trace tương ứng (`expectedLineIds`, tối đa 2 line đối với các cạnh nối giao lộ).
   - **Không dùng khoảng cách tới raw trace gần nhất toàn cục (global nearest)** làm tiêu chuẩn.
   - Mỗi cạnh được lấy **11 điểm mẫu** từ $t=0.0$ đến $t=1.0$ (bao gồm 2 endpoint và 9 điểm trung gian) để đo khoảng cách trực giao tới chính các đường trong `expectedLineIds`.
   - **Ngưỡng sai số nghiêm ngặt**: $\le 5.00$ px cho toàn bộ 164 cạnh thông thường.
2. **Quy tắc nghiệm thu 2 cạnh nối giao lộ đặc biệt (Junction Connector Geometry Exceptions)**:
   - Giữ nguyên cấu trúc 162 nodes, 166 edges; **không gộp node, không xóa cạnh, không thay đổi tọa độ**.
   - `J_T11_T32`: Khoảng hở $13.15$ px do 2 nét vẽ `line_04` và `line_03` dừng tách rời tại nút giao; 2 đầu mút nằm chính xác $0.00$ px trên tim đường.
   - `J_HS4_L11`: Cạnh nối chéo giữa 2 nhánh `line_10` và `line_11`; 2 đầu mút nằm chính xác $0.00$ px trên tim đường.
   - Cả 2 cạnh được phân loại rõ ràng là `REVIEW_EXCEPTION` với lý do kỹ thuật tường minh.
3. **Headless TypeScript Runtime Simulation (7 Scenarios)**:
   - Thực thi trực tiếp toàn bộ 120 chu kỳ thời gian thực ($dt = 1$s) bằng `startScenario` và `scenarioTick` trên `airportGraphV2`.
   - **Kịch bản 3 (`taxiway_closure`)**: Lấy trực tiếp `actualClosureEdge` từ runtime state; $100\%$ tàu bay liên quan đổi lộ trình tránh cạnh đóng thành công.
   - **Kịch bản 5 (`wrong_route_deviation`)**: Xác nhận `VN801` rẽ lệch sang `T43` ($t=25$s), dừng hẳn (`speed=0`, `holding`), phát cảnh báo; đến $t=40$s nhận lộ trình an toàn mới $T43 \to H25L$ và tiếp tục lăn bánh.
   - **Kịch bản 6 (`radio_failure`)**: Xác nhận `VN901` kích hoạt `radioFailure: true`, phát cảnh báo, duy trì di chuyển an toàn theo vệt đèn xanh FTG.
   - **Kịch bản 7 (`runway_change`)**: Đánh giá toàn bộ 6 tàu bay, 3 tàu bay đổi hướng reroute chính xác từ vị trí thực tế trên sân.

---

## 2. BẢNG TỔNG HỢP KIỂM TRA HÌNH HỌC 166 CẠNH (`edge_geometry_audit_v2.json`)

| Phân Loại Trạng Thái | Số Lượng Cạnh | Tỷ Lệ | Tiêu Chí Đánh Giá & Ghi Chú |
| :--- | :---: | :---: | :--- |
| **PASS** | **164** | **98.8%** | Sai lệch hình học $\le 4.80$ px so với đúng `expectedLineIds` (Ngưỡng nghiêm ngặt $\le 5.00$ px) |
| **REVIEW_EXCEPTION** | **2** | **1.2%** | Cạnh chuyển tiếp giao lộ đặc biệt (`J_T11_T32`, `J_HS4_L11`), 2 đầu mút đạt $0.00$ px |
| **FAIL** | **0** | **0.0%** | Không có cạnh nào bị lỗi sai tuyến hoặc vượt ngưỡng không có lý do |
| **UNKNOWN** | **0** | **0.0%** | Toàn bộ 166 cạnh đã được ánh xạ tường minh `expectedLineIds` |
| **Tổng số cạnh** | **166** | **100%** | Kiểm tra toàn diện toàn bộ đồ thị Graph V2 |

### 🔍 Chi tiết 2 cạnh Junction Connector Exceptions:
1. **`J_T11_T32`** (`T11` $\to$ `T32`):
   - `expectedLineIds`: `["line_04", "line_03"]`
   - `maxDistancePx`: **$6.58$ px** (tại $t=0.5$).
   - `exceptionNote`: "Junction connector bridging gap between line_04 end and line_03 start (13.15 px gap in user drawing). Both endpoints lie exactly 0.00 px on raw trace."
   - 🖼️ Ảnh phóng to kiểm thử: [zoom_edge_j_t11_t32.png](file:///d:/Thao/airport-simulator/public/zoom_edge_j_t11_t32.png)
2. **`J_HS4_L11`** (`HS4` $\to$ `L11_P1`):
   - `expectedLineIds`: `["line_10", "line_11"]`
   - `maxDistancePx`: **$8.20$ px** (tại $t=0.5$).
   - `exceptionNote`: "Diagonal connector between rapid exit line_10 and bypass line_11. Both endpoints lie exactly 0.00 px on raw trace; main movement axis is HS4 -> M1_ENT -> line_03."
   - 🖼️ Ảnh phóng to kiểm thử: [zoom_edge_j_hs4_l11.png](file:///d:/Thao/airport-simulator/public/zoom_edge_j_hs4_l11.png)

---

## 3. KẾT QUẢ KIỂM THỬ HEADLESS RUNTIME 7 KỊCH BẢN (`scenario_route_audit_v2.json`)

| STT | Kịch Bản (`scenarioId`) | Số Tàu Bay | Kiểm Thử Động Thực Tế (Headless Runtime) | Kết Quả Lộ Trình | Trạng Thái Kịch Bản |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **1** | `emergency_priority` | 5 | VN9999 ưu tiên tuyệt đối; 4 tàu bay dừng nhường đường | 5/5 PASS | **PASS** ✅ |
| **2** | `lvc_intersection_conflict` | 2 | VN302 dừng trước Stop Bar, VN301 đi qua giao lộ an toàn | 2/2 PASS | **PASS** ✅ |
| **3** | `taxiway_closure` | 4 | Đóng `actualClosureEdge` trong runtime $\to$ **4/4 tàu bay đổi tuyến tránh cạnh đóng** | 4/4 Reroute PASS | **PASS** ✅ |
| **4** | `peak_hour_lvc` | 12 | Định tuyến thông suốt 12 luồng bay giờ cao điểm trong LVC | 12/12 PASS | **PASS** ✅ |
| **5** | `wrong_route_deviation` | 2 | VN801 sang `T43` ($t=25$) $\to$ **Holding, speed=0, Warning $\to$ Reroute mới $T43 \to H25L$ ($t=40$)** | 2/2 PASS | **PASS** ✅ |
| **6** | `radio_failure` | 2 | VN901 mất vô tuyến ($t=50$) $\to$ **`radioFailure: true`, tiếp tục hành trình bằng đèn xanh FTG** | 2/2 PASS | **PASS** ✅ |
| **7** | `runway_change` | 6 | Đổi $07 \to 25$ ($t=75$) $\to$ **Toàn bộ 6 tàu bay được đánh giá, 3 tàu bay đổi hướng reroute từ vị trí thực** | 6/6 PASS | **PASS** ✅ |

---

## 4. BẢO TOÀN HỆ THỐNG & TRẠNG THÁI MÃ NGUỒN

- **Graph V1**: Bảo toàn $100\%$ không bị thay đổi (`src/data/airportGraph.ts`).
- **Graph V2**: Giữ nguyên toàn bộ 162 nodes, 166 edges và tọa độ (`src/data/airportGraph.v2.ts`).
- **Graph Mặc định**: `DEFAULT_GRAPH_ID = 'v1'` trong [`src/data/graphRegistry.ts`](file:///d:/Thao/airport-simulator/src/data/graphRegistry.ts).
- **Kiểm tra TypeScript**: `npx tsc --noEmit` hoàn toàn sạch lỗi (**0 errors**).
- **Production Build**: `npm run build` thành công.
- **Tệp sao lưu**: Được lưu trữ an toàn tại `scratch/backup/`.

---

## 5. DANH SÁCH TỆP ĐẦU RA ĐÃ ĐƯỢC CẬP NHẬT

1. 📄 [`edge_geometry_audit_v2.json`](file:///d:/Thao/airport-simulator/edge_geometry_audit_v2.json): Báo cáo hình học 166 cạnh theo đúng `expectedLineIds` (164 PASS, 2 REVIEW_EXCEPTION, 0 FAIL, 0 UNKNOWN).
2. 📄 [`scenario_route_audit_v2.json`](file:///d:/Thao/airport-simulator/scenario_route_audit_v2.json): Báo cáo kiểm thử headless runtime đầy đủ của 7 kịch bản mô phỏng.
3. 📄 [`migration_report.md`](file:///d:/Thao/airport-simulator/migration_report.md): Báo cáo nghiệm thu chi tiết, minh bạch.
4. 🖼️ [`public/zoom_edge_j_t11_t32.png`](file:///d:/Thao/airport-simulator/public/zoom_edge_j_t11_t32.png): Ảnh phóng to phân tích cạnh `J_T11_T32`.
5. 🖼️ [`public/zoom_edge_j_hs4_l11.png`](file:///d:/Thao/airport-simulator/public/zoom_edge_j_hs4_l11.png): Ảnh phóng to phân tích cạnh `J_HS4_L11`.
