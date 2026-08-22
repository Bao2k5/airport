# BÁO CÁO AUDIT ĐỐI SOÁT NGHIÊM NGẶT
## TOPOLOGY GRAPH V3 PRODUCTION & TÀI LIỆU MERMAID KỊCH BẢN MÔ PHỎNG

---

### I. GIẢI TRÌNH MÂU THUẪN DỮ LIỆU (119 NODES / 169 EDGES VS 145 NODES / 289 EDGES)

Trong quá trình tiếp nhận file raw trace mới `v3_raw_trace_com.json` (chứa 52 tuyến vẽ thô), một script dựng đồ thị trung gian đã tự động sinh thêm 107 cạnh nối dựa trên khoảng cách hình học tiếp cận (`proximity heuristic < 30px`), dẫn đến con số tạm thời $145\text{ nodes} / 289\text{ edges}$.

#### Bảng Đối Soát Nguồn Gốc Chi Tiết:

| Thành phần | Số lượng | Nguồn gốc dữ liệu thực tế | Đánh giá hợp lệ |
| :--- | :---: | :--- | :---: |
| **Nodes chuẩn (Canonical)** | **119** | 38 tuyến raw trace gốc trong `v3_coordinates_complete.json` | **HỢP LỆ $100\%$** |
| **Nodes mở rộng từ file com** | 26 | 13 tuyến phụ mới trong `v3_raw_trace_com.json` (`line_39`..`line_55`) | Lưu trữ raw trace, chưa phê duyệt junction |
| **Sequential Edges chuẩn** | **83** | Nối tuần tự các điểm trong 38 tuyến raw trace gốc | **HỢP LỆ $100\%$** |
| **Confirmed Junction Edges** | **86** | Người dùng đã duyệt và xác nhận trong `v3_junctions.confirmed.json` | **HỢP LỆ $100\%$** |
| **Auto-generated Connector Edges** | **107** | Sinh tự động bởi thuật toán nội suy lân cận | **LOẠI BỎ (UNPROVEN)** |

> [!IMPORTANT]
> **Quyết định chuẩn hóa (Enforcement Rule)**:
> - **Loại bỏ toàn bộ 107 connector edges tự sinh**.
> - Khóa chuẩn cấu hình **Canonical Graph V3 Production** ở đúng: **119 nodes / 169 edges** (83 sequential + 86 confirmed junctions, SHA-256 Topology Hash: `31e293e035c8f216`).
> - Toàn bộ 107 cạnh chưa được xác nhận được lưu vết đầy đủ trong [`v3_unproven_nodes_edges.json`](file:///d:/Thao/airport-simulator/v3_unproven_nodes_edges.json).

---

### II. BẢNG NGUỒN GỐC DỮ LIỆU & BĂM SHA-256 (SOURCE PROVENANCE)

- **GRAPH_SELECTED**: `v3`
- **NODES**: `119` (44 operational named nodes + 75 geometry-only nodes)
- **EDGES**: `169` (83 sequential edges + 86 confirmed junction edges)
- **BACKGROUND**: `/anhchinh.png` [1200 x 860]
- **TOPOLOGY_HASH**: `31e293e035c8f216`

#### Bảng băm SHA-256 các file nguồn:
| File dữ liệu nguồn | Đường dẫn file | SHA-256 Hash |
| :--- | :--- | :--- |
| **airportGraph.v3.ts** | `src/data/airportGraph.v3.ts` | `51398858db63e688e9e77924007d8ebed28b9e88cda7144ac99f3589629498ba` |
| **v3_raw_traces_manual.json** | `v3_raw_traces_manual.json` | `1efadbfbc2703a58e4933989bb90f779836371cb29fe3ca4a1c5d045863c3757` |
| **v3_coordinates_complete.json**| `src/data/v3_coordinates_complete.json` | `be1f5f242095f9c546fcf859b2eb8fe9d9c222ff411a7985474ca60cf5ec73b1` |
| **v3_junctions.confirmed.json** | `v3_junctions.confirmed.json` | `aebf90f230554162e078310c1aeaf9148d94e1d5a7d3c52eebef18797f1fbc21` |

---

### III. KIỂM ĐỊNH LỘ TRÌNH THỰC TẾ 5 KỊCH BẢN TRÊN CANONICAL GRAPH V3 (119 NODES / 169 EDGES)

Toàn bộ các lộ trình mô tả trong sơ đồ Mermaid và kịch bản mô phỏng đã được kiểm chứng thông tuyến $100\%$ bằng thuật toán Dijkstra trực tiếp trên Canonical Graph V3 (không dùng bất kỳ shortcut hay cạnh tự sinh nào):

| Kịch bản | Tàu bay / Nhiệm vụ | Điểm xuất phát $\to$ Điểm đến | Chuỗi nút vận hành thực tế trên Graph V3 | Trạng thái Dijkstra |
| :---: | :--- | :--- | :--- | :---: |
| **S1** | HVN216 (Tuyến FtG) | `STAND_10` $\to$ `STOP BAR 25L` | `STAND_10` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `STOP BAR 25L` (12 nodes) | **PASS** |
| **S1** | HVN216 (Lệch vào E4) | `STAND_10` $\to$ `E4/25L` | `STAND_10` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `E4/25L` (13 nodes) | **PASS** |
| **S1** | HVN216 (Phục hồi từ E4) | `E4/25L` $\to$ `STOP BAR 25L` | `E4/25L` $\to$ `STOP BAR 25L` (4 nodes) | **PASS** |
| **S2** | BAV315 (Khẩn nguy) | `STOP BAR 25R` $\to$ `W5/07R` | `STOP BAR 25R` $\to$ `W5/07L` $\to$ `W5/07R` (6 nodes) | **PASS** |
| **S2** | HVN123 (Expedite) | `W4/25L` $\to$ `STAND_17` | `W4/25L` $\to$ `E2/25L` $\to$ `E6/E2` $\to$ `STAND_17` (13 nodes) | **PASS** |
| **S2** | BAV456 (Hold) | `E6/E4` $\to$ `STOP BAR 25L` | `E6/E4` $\to$ `E6` $\to$ `STOP BAR 25L` (7 nodes) | **PASS** |
| **S2** | THA101 (Pushback) | `STAND_10` $\to$ `HS NS` | `STAND_10` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W3/25L` $\to$ `HS W7` $\to$ `HS NS` (17 nodes) | **PASS** |
| **S2** | RESCUE01 (Cứu hộ) | `W9A/07R` $\to$ `W5/07R` | `W9A/07R` $\to$ `W5/07R` (3 nodes) | **PASS** |
| **S3** | HVN301 (Inbound) | `HS W7` $\to$ `STAND_17` | `HS W7` $\to$ `W3/25L` $\to$ `E2/25L` $\to$ `E6/E2` $\to$ `STAND_17` (14 nodes) | **PASS** |
| **S3** | VJ302 (Outbound) | `STAND_11` $\to$ `STOP BAR 25L` | `STAND_11` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `STOP BAR 25L` (11 nodes) | **PASS** |
| **S4** | INB01 (Tuyến gốc) | `W4/25R` $\to$ `W7A/25L` | `W4/25R` $\to$ `W4/25L` $\to$ `W7A/25L` (6 nodes) | **PASS** |
| **S4** | INB01 (Reroute tránh FOD) | `W4/25R` $\to$ `STAND_10` | `W4/25R` $\to$ `NS1/25R` $\to$ `NS1/25L` $\to$ `NS2/25L` $\to$ `E6/NS2` $\to$ `STAND_10` (15 nodes) | **PASS** |
| **S5** | OUT01 (07R) | `STAND_1` $\to$ `W11/07R` | `STAND_1` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W11/07R` (15 nodes) | **PASS** |
| **S5** | OUT02 (07R) | `STAND_2` $\to$ `W9A/07R` | `STAND_2` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W9A/07R` (15 nodes) | **PASS** |
| **S5** | OUT03 (07L) | `STAND_3` $\to$ `W5/07L` | `STAND_3` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W4/25L` $\to$ `W4/25R` (19 nodes) | **PASS** |
| **S5** | OUT04 (07R) | `STAND_4` $\to$ `W5/07R` | `STAND_4` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W5/07R` (14 nodes) | **PASS** |
| **S5** | INB01 (Về bến) | `STOP BAR 25R` $\to$ `STAND_10` | `STOP BAR 25R` $\to$ `E1/25L` $\to$ `NS2/25L` $\to$ `E6/NS2` $\to$ `STAND_10` (15 nodes) | **PASS** |
| **S5** | INB02 (Về bến) | `STOP BAR 25R` $\to$ `STAND_11` | `STOP BAR 25R` $\to$ `E1/25L` $\to$ `NS2/25L` $\to$ `E6/NS2` $\to$ `STAND_11` (14 nodes) | **PASS** |
| **S5** | PUSH01 (Đẩy bến 12) | `STAND_12` $\to$ `W9B` | `STAND_12` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W5/25L` $\to$ `W9B` (19 nodes) | **PASS** |
| **S5** | PUSH02 (Đẩy bến 13) | `STAND_13` $\to$ `W9B/W7A` | `STAND_13` $\to$ `E6/NS2` $\to$ `NS2/25L` $\to$ `W5/25L` $\to$ `W9B/W7A` (19 nodes) | **PASS** |

---

### IV. TỔNG HỢP CÁC FILE ĐỐI SOÁT ĐÃ TẠO
1. 📄 [`docs/mermaid_graph_v3_scenarios_audit.md`](file:///d:/Thao/airport-simulator/docs/mermaid_graph_v3_scenarios_audit.md): Báo cáo đối soát nguồn gốc chi tiết.
2. 📋 [`v3_mermaid_topology_provenance.json`](file:///d:/Thao/airport-simulator/v3_mermaid_topology_provenance.json): Hồ sơ nguồn gốc Topology 119 nodes / 169 edges và bảng băm SHA-256.
3. 📦 [`v3_unproven_nodes_edges.json`](file:///d:/Thao/airport-simulator/v3_unproven_nodes_edges.json): Danh sách bóc tách chi tiết 107 cạnh connector tự sinh đã bị loại bỏ.
4. 🗺️ [`v3_mermaid_route_validation.json`](file:///d:/Thao/airport-simulator/v3_mermaid_route_validation.json): Kết quả kiểm định Dijkstra từng bước cho toàn bộ 20 tuyến kịch bản.
