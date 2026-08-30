# UNVERIFIED RULES & EXPERIMENTAL PARAMETERS

Báo cáo phân loại các tham số, ngưỡng khoảng cách và hằng số số học chưa có nguồn ICAO/AIP chính thức hoặc là tham số thực nghiệm nội bộ (`PROJECT_EXPERIMENTAL_PARAMETER`).

---

## 1. Danh sách tham số thực nghiệm mô phỏng (Project Experimental Parameters)

### 1.1 Ngưỡng dãn cách dọc trên đường lăn (Taxiway Separation Buffers)
* **Giá trị trong mã nguồn**: `SEPARATION_TAXIWAY_M = 28m` (`scenarioRunner.ts:21`), `SEPARATION_APRON_M = 36m` (`scenarioRunner.ts:22`), `STAND_CLEARANCE_RADIUS_M = 34m` (`scenarioRunner.ts:25`).
* **Thực trạng quy chuẩn**: ICAO Annex 14 Table 3-1 chỉ quy định khoảng cách giữa tim đường lăn tới tim đường lăn song song hoặc tim đường lăn tới vật chướng ngại (ví dụ Code C: 26m / Code E: 47.5m), không quy định một con số dãn cách dọc đuôi-đầu cố định 28m trên đường lăn.
* **Phân loại chuẩn**: **`PROJECT_SIMULATION_PARAMETER`** (Khoảng cách vùng an toàn va chạm đồ họa).
* **Khuyến nghị**: Không ghi nhận "28m là tiêu chuẩn ICAO". Ghi rõ đây là buffer an toàn đồ họa của simulator.

### 1.2 Khoảng thời gian giãn cách sinh tàu ngẫu nhiên (Runway Spawn Interval)
* **Giá trị trong mã nguồn**: `minimumSpawnIntervalSeconds = 60s` (`ConstrainedTrafficGenerator.ts:20`).
* **Thực trạng quy chuẩn**: Dãn cách cất/hạ cánh thực tế phụ thuộc Wake Turbulence Categories (ví dụ ICAO Doc 4444 quy định 2 - 3 phút hoặc 4 - 6 NM). Con số 60s là tham số điều tiết lưu lượng sinh tàu của simulator nhằm tối ưu hóa nhịp trình diễn.
* **Phân loại chuẩn**: **`PROJECT_EXPERIMENTAL_PARAMETER`**.
* **Khuyến nghị**: Tách biệt hoàn toàn giữa "Traffic Generator Spawn Timer" và "ATC Wake Turbulence Separation".

### 1.3 Thời gian phục hồi sự cố ngẫu nhiên (Incident Recovery Durations)
* **Giá trị trong mã nguồn**:
  * FOD cleanup: $20	ext{s}$ (`EventRegistry.ts:27`)
  * Radio failure recovery: $30	ext{s}$ (`EventRegistry.ts:35`)
  * Disabled aircraft tow: $25	ext{s}$ (`EventRegistry.ts:43`)
  * Wrong turn recovery: $12	ext{s}$ (`EventRegistry.ts:19`)
  * Emergency priority window: $35	ext{s}$ (`EventRegistry.ts:51`)
* **Thực trạng quy chuẩn**: Không có tài liệu ICAO nào quy định dọn FOD mất 20 giây hay kéo tàu mất 25 giây. Đây là các tham số phục vụ cho vòng lặp tương tác giao diện người dùng.
* **Phân loại chuẩn**: **`PROJECT_EXPERIMENTAL_PARAMETER`** (`STRESS_PROFILE`).

### 1.4 Thứ tự ưu tiên an toàn phần mềm (Software Priority Numeric Values)
* **Giá trị trong mã nguồn**: `priority = 1` (Khẩn nguy), `priority = 2` (Đến), `priority = 3` (Đi), `priority = 4` (Thấp).
* **Thực trạng quy chuẩn**: ICAO Doc 4444 Điều 15.1.1 quy định nguyên tắc ưu tiên cao nhất cho chuyến bay khẩn nguy, nhưng không gán thang điểm số học 1..4.
* **Phân loại chuẩn**: **`PROJECT_SIMULATION_PRIORITY_POLICY`** (Chính sách phân xử thuật toán của phần mềm).
