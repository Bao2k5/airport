# BÁO CÁO ĐỐI SOÁT NGHIỆP VỤ & LỘ TRÌNH KỊCH BẢN 5 (CANONICAL GRAPH V3)

---

## 1. THÔNG SỐ ĐỒ THỊ CANONICAL GRAPH V3
- **Nền bản đồ**: `/anhchinh.png` (1200 x 860 px).
- **Số Node**: 119 nodes (100% đối soát từ `src/data/v3_coordinates_complete.json`).
- **Số Edge**: 169 edges (83 sequential lines + 86 confirmed junctions).
- **Mã Topology Hash**: `31e293e035c8f216`.
- **Tuyệt đối không dùng**: Fallback V1/V2, connector tự sinh, hay node ngoài danh mục.

---

## 2. KẾT QUẢ KIỂM THỬ 9 BẬC ASSERTION NGHIỆP VỤ

| Tên Assertion | Ý nghĩa kiểm tra | Trạng thái |
| :--- | :--- | :---: |
| `ASSERT_TRADITIONAL_NO_FTG_GREEN` | Màn Trái 100% không có đèn xanh FtG | **TRUE (PASS)** |
| `ASSERT_TRADITIONAL_NO_BLUE_PREVIEW` | Màn Trái 100% không có route preview xanh dương | **TRUE (PASS)** |
| `ASSERT_FTG_BLUE_PREVIEW_AFTER_CLEARANCE` | Màn Phải có route preview nét đứt xanh dương khi được cấp tuyến | **TRUE (PASS)** |
| `ASSERT_FTG_ROLLING_GREEN_AFTER_CLEARANCE` | Màn Phải có rolling window xanh lá 4 segment trước mũi khi di chuyển | **TRUE (PASS)** |
| `ASSERT_ROUTE_PLANS_DIFFER_AFTER_T25` | Kế hoạch điều phối và thời điểm cấp tuyến khác nhau hoàn toàn sau $t=25\text{s}$ | **TRUE (PASS)** |
| `ASSERT_OUT01_OUT02_RELEASED_BEFORE_OUT03_OUT04` | Pha 1 ($t=25\text{s}$) chỉ giải phóng OUT01/OUT02; OUT03/OUT04 giữ Stop Bar đến Pha 2 ($t=45\text{s}$) | **TRUE (PASS)** |
| `ASSERT_PUSHBACK_HELD_UNTIL_APRON_CLEAR` | PUSH01/PUSH02 được giữ an toàn tại bến đến khi hành lang thông thoáng ($t=45\text{s}$ vs $t=200\text{s}$) | **TRUE (PASS)** |
| `ASSERT_NO_COLLISION` | 0 va chạm vật lý giữa 8 tàu bay trên cả 2 màn hình | **TRUE (PASS)** |
| `ASSERT_NO_DUAL_RUNWAY_OCCUPANCY` | Không xảy ra tình huống 2 tàu bay chiếm cùng hành lang đường cất hạ cánh | **TRUE (PASS)** |

---

## 3. BẢNG ĐỐI CHIẾU LỘ TRÌNH VÀ THỜI ĐIỂM CẤP PHÉP CHI TIẾT TỪNG TÀU BAY

| Callsign | Loại tàu | Điểm xuất phát | Đích đến 07 | Màn TRÁI (Truyền thống VHF) | Màn PHẢI (A-SMGCS + FtG) | Chênh lệch thời gian ($Delta t$) | Lý do khác biệt nghiệp vụ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **OUT01** | A321 | STAND_1 (`v3_line_37_p00`) | STOP BAR 07R (`v3_line_16_p01`) | Cấp lệnh lúc **$t=50\text{s}$**, giữ Stop Bar $25\text{s}$, taxi $11.4\text{ kts}$ | Cấp Pha 1 lúc **$t=25\text{s}$**, taxi $15.0\text{ kts}$ với FtG xanh + preview | **Tiết kiệm $25\text{s}$** | FtG kích hoạt tự động tức thời qua Dijkstra, không mất thời gian đàm thoại thoại. |
| **OUT02** | A320 | STAND_2 (`v3_line_38_p00`) | STOP BAR 07R (`v3_line_17_p01`) | Cấp lệnh lúc **$t=90\text{s}$**, xếp hàng chờ $65\text{s}$, taxi $11.4\text{ kts}$ | Cấp Pha 1 lúc **$t=25\text{s}$**, taxi $15.0\text{ kts}$ với FtG xanh + preview | **Tiết kiệm $65\text{s}$** | Truyền thống phải đợi OUT01 giãn cách; FtG phân luồng song song an toàn. |
| **OUT03** | B787 | STAND_3 (`v3_line_34_p02`) | STOP BAR 07L (`v3_line_01_p00`) | Cấp lệnh lúc **$t=140\text{s}$**, xếp hàng chờ $115\text{s}$, taxi $11.4\text{ kts}$ | Giữ Stop Bar đến **$t=45\text{s}$** (Pha 2), taxi $15.0\text{ kts}$ | **Tiết kiệm $95\text{s}$** | Cả hai đều phân pha, nhưng FtG giải phóng Pha 2 ngay khi hành lang đệm thông ($t=45\text{s}$ vs $t=140\text{s}$). |
| **OUT04** | A350 | STAND_4 (`v3_line_35_p00`) | STOP BAR 07L (`v3_line_03_p01`) | Cấp lệnh lúc **$t=140\text{s}$**, xếp hàng chờ $115\text{s}$, taxi $11.4\text{ kts}$ | Giữ Stop Bar đến **$t=45\text{s}$** (Pha 2), taxi $15.0\text{ kts}$ | **Tiết kiệm $95\text{s}$** | Tái định tuyến sang 07L giảm tải cho trục W về 07R. |
| **INB01** | B777 | STOP BAR 25R (`v3_line_01_p03`) | STAND_10 (`v3_line_33_p00`) | Cấp lệnh lúc **$t=90\text{s}$**, dừng chờ $65\text{s}$ | Cấp Pha 1 lúc **$t=25\text{s}$**, Dijkstra né nút HS NS | **Tiết kiệm $65\text{s}$** | FtG tự động tính tuyến tránh điểm nghẽn giao cắt mà không cần KSVKL can thiệp thủ công. |
| **INB02** | A330 | STOP BAR 25R (`v3_line_01_p03`) | STAND_11 (`v3_line_32_p00`) | Cấp lệnh lúc **$t=90\text{s}$**, dừng chờ $65\text{s}$ | Cấp Pha 1 lúc **$t=25\text{s}$**, Dijkstra né nút HS NS | **Tiết kiệm $65\text{s}$** | Đồng bộ luồng hạ cánh vào bến an toàn. |
| **PUSH01**| A321 | STAND_12 (`v3_line_31_p00`) | Entry 07R (`v3_line_17_p04`) | Cấp lệnh đẩy lùi lúc **$t=200\text{s}$**, giữ tại bến $175\text{s}$ | Giữ Stop Bar đến **$t=45\text{s}$** (Pha 2), đẩy lùi an toàn | **Tiết kiệm $155\text{s}$** | Truyền thống sợ nghẽn apron nên giữ rất lâu; FtG giám sát cảm biến bến và mở sớm khi trục thông. |
| **PUSH02**| A320 | STAND_13 (`v3_line_30_p00`) | Entry 07R (`v3_line_18_p03`) | Cấp lệnh đẩy lùi lúc **$t=200\text{s}$**, giữ tại bến $175\text{s}$ | Giữ Stop Bar đến **$t=45\text{s}$** (Pha 2), đẩy lùi an toàn | **Tiết kiệm $155\text{s}$** | Giải phóng mặt bằng sân đỗ tối ưu. |

---

## 4. CHI TIẾT DANH MỤC NODE VÀ EDGE CỦA TỪNG TUYẾN TRÊN GRAPH V3
Mọi Node ID và Edge ID của 8 tàu bay đều được truy xuất 100% từ Graph V3 Canonical:
- `OUT01`: 15 nodes [`v3_line_37_p00` $\to$ `v3_line_37_p01` $\to$ `v3_line_34_p00` $\to$ `v3_line_12_p04..p00` $\to$ `v3_line_05_p04..p00` $\to$ `v3_line_16_p00..p01`]; 14 edges.
- `OUT02`: 15 nodes [`v3_line_38_p00` $\to$ `v3_line_38_p01` $\to$ `v3_line_34_p00` $\to$ `v3_line_12_p04..p00` $\to$ `v3_line_05_p04..p00` $\to$ `v3_line_17_p00..p01`]; 14 edges.
- `OUT03`: 19 nodes [`v3_line_34_p02..p00` $\to$ `v3_line_12_p04..p00` $\to$ `v3_line_05_p04..p00` $\to$ `v3_line_01_p02..p00`]; 18 edges.
- `OUT04`: 14 nodes [`v3_line_35_p00..p01` $\to$ `v3_line_34_p00` $\to$ `v3_line_12_p04..p00` $\to$ `v3_line_05_p04..p00` $\to$ `v3_line_03_p02..p01`]; 13 edges.
- `PUSH01`: 19 nodes [`v3_line_31_p00..p01` $\to$ `v3_line_29_p00` $\to$ `v3_line_12_p03..p00` $\to$ `v3_line_05_p04..p02` $\to$ `v3_line_10_p00..p03` $\to$ `v3_line_11_p00..p01` $\to$ `v3_line_17_p06..p04`]; 18 edges.
- `PUSH02`: 19 nodes [`v3_line_30_p00..p01` $\to$ `v3_line_29_p00` $\to$ `v3_line_12_p03..p00` $\to$ `v3_line_05_p04..p02` $\to$ `v3_line_10_p00..p03` $\to$ `v3_line_11_p00..p01` $\to$ `v3_line_17_p06..p05` $\to$ `v3_line_18_p03`]; 18 edges.
