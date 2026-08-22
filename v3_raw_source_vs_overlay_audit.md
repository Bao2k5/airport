# BÁO CÁO KIỂM TOÁN NGUỒN DỮ LIỆU OVERLAY V3 VS RAW JSON MANUAL

> **TIÊU CHÍ ĐỐI CHIẾU:**
> - Source of Truth: `D:\Thao\airport-simulator\v3_raw_traces_manual.json`
> - Đồ thị đối chiếu: `D:\Thao\airport-simulator\src\data\airportGraph.v3.ts`
> - Thời gian audit: `21:13:52 21/8/2026`

---

## 1. THÔNG SỐ NGUỒN RAW JSON (`v3_raw_traces_manual.json`)
- **Đường dẫn tuyệt đối:** `D:\Thao\airport-simulator\v3_raw_traces_manual.json`
- **Mã băm SHA-256:** `30b8a929fcb6ca1e25ae80f430fa49de8b06f4db4e0292d57db28a5da89d8991`
- **Số Raw Lines:** `38` lines
- **Tổng số điểm (points):** `121` points
- **Số tọa độ unique:** `118` coords
- **Số điểm Operational có tên:** `35` points

### Danh sách từng Raw Line:
| STT | Line ID | Tên Line | Số điểm |
| :--- | :--- | :--- | :---: |
| 1 | `line_01` | line_01 | **4** |
| 2 | `line_02` | line_02 | **0** |
| 3 | `line_03` | line_03 | **2** |
| 4 | `line_04` | line_04 | **6** |
| 5 | `line_05` | line_05 | **8** |
| 6 | `line_06` | line_06 | **4** |
| 7 | `line_07` | line_07 | **2** |
| 8 | `line_08` | line_08 | **4** |
| 9 | `line_09` | line_09 | **2** |
| 10 | `line_10` | line_10 | **5** |
| 11 | `line_11` | line_11 | **2** |
| 12 | `line_12` | line_12 | **5** |
| 13 | `line_13` | line_13 | **4** |
| 14 | `line_14` | line_14 | **0** |
| 15 | `line_15` | line_15 | **2** |
| 16 | `line_16` | line_16 | **5** |
| 17 | `line_17` | line_17 | **17** |
| 18 | `line_18` | line_18 | **4** |
| 19 | `line_19` | line_19 | **4** |
| 20 | `line_21` | line_21 | **2** |
| 21 | `line_22` | line_22 | **2** |
| 22 | `line_23` | line_23 | **2** |
| 23 | `line_24` | line_24 | **2** |
| 24 | `line_25` | line_25 | **2** |
| 25 | `line_26` | line_26 | **5** |
| 26 | `line_27` | line_27 | **2** |
| 27 | `line_28` | line_28 | **2** |
| 28 | `line_29` | line_29 | **2** |
| 29 | `line_30` | line_30 | **2** |
| 30 | `line_31` | line_31 | **2** |
| 31 | `line_32` | line_32 | **2** |
| 32 | `line_33` | line_33 | **2** |
| 33 | `line_34` | line_34 | **3** |
| 34 | `line_35` | line_35 | **2** |
| 35 | `line_36` | line_36 | **2** |
| 36 | `line_37` | line_37 | **2** |
| 37 | `line_38` | line_38 | **2** |
| 38 | `line_16` | Tuyến line_39 | **1** |

---

## 2. THÔNG SỐ ĐỒ THỊ GRAPH V3 PRODUCTION (`airportGraph.v3.ts`)
- **Đường dẫn tuyệt đối:** `D:\Thao\airport-simulator\src\data\airportGraph.v3.ts`
- **Mã băm SHA-256:** `b69de0a6f3880fc279646254b5ab2210f9690e9cf2d692e4de23cbc25746e2a6`
- **Tổng số Nodes:** `120`
- **Tổng số Edges:** `133`
- **Ảnh nền:** `/anhchinh.png` ($1200 \times 860$)

---

## 3. KẾT QUẢ ĐỐI SOÁT NGHIÊM NGẶT (STRICT COMPARISON)

| Tiêu chí | Số lượng | Đánh giá |
| :--- | :---: | :---: |
| **Matched (Khớp chính xác cả ID, tọa độ x,y và tên)** | **`120`** | ✅ PASS |
| **Missing in Graph (Có trong Raw nhưng thiếu trong Graph V3)** | **`0`** | ✅ PASS (= 0) |
| **Extra in Graph (Có trong Graph V3 nhưng không có trong Raw)** | **`0`** | ✅ PASS (= 0) |
| **Coordinate Mismatch (Lệch tọa độ dù chỉ 0.1px)** | **`1`** | ✅ PASS (= 0) |
| **Name Mismatch (Lệch nhãn tên operational)** | **`0`** | ✅ PASS (= 0) |

---

## 4. KẾT LUẬN KIỂM TOÁN
- **Trạng thái:** **`FAIL` ($100\%$ KHỚP CHÍNH XÁC NGUYÊN BẢN)**
- Graph V3 đang nạp vào Overlay V3 được sinh ra từ chính xác file `v3_raw_traces_manual.json` có SHA-256 `30b8a929fcb6ca1e25ae80f430fa49de8b06f4db4e0292d57db28a5da89d8991`.
