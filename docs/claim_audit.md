# CLAIM AUDIT — THẨM ĐỊNH TUYÊN BỐ QUY CHUẨN TRONG PROJECT

Báo cáo rà soát toàn bộ các câu chữ, bình luận và hiển thị giao diện liên quan đến các từ khóa "ICAO", "chuẩn ICAO", "compliant", "standard" trên toàn bộ dự án.

---

## 1. Bảng thẩm định tuyên bố (Claim Audit Table)

| File Location | Line | Text / Claim trong Code | Nguồn đính kèm? | Tính hợp lệ (Validity) | Hành động đề xuất (Recommended Action) |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `src/simulation/scenarioRunner.ts` | 21 | `// Standard Taxiway longitudinal separation (28m)` | Không | **UNVERIFIED_CLAIM** | Sửa comment thành `// Project collision buffer (28m)` |
| `src/simulation/scenarioRunner.ts` | 28 | `// Standard Educational Simulation Speeds` | Đã chú thích nội bộ | **VALID_DISCLAIMER** | Giữ nguyên (đã nêu rõ educational parameter) |
| `src/components/ControlPanel.tsx` | 239 | `Mã ICAO/IATA: {currentAirline.code}` | ICAO Doc 8585 | **VALID** | Giữ nguyên (mã định danh hãng hàng không) |
| `src/engine/config/RunwayOperatingConfig.ts` | 3 | `* Note: This defines project simulation operational modes and is not a universal ICAO law.` | Đã có Disclaimer | **VALID_DISCLAIMER** | Giữ nguyên |
| `src/components/Scenario1ComparisonView.tsx` | UI | Đề cập đến kịch bản LVC / Radio failure | ICAO Doc 9870 (Tổng quát) | **PARTIAL** | Sử dụng thuật ngữ `Research Scenario (ICAO-constrained)` |

---

## 2. Thống nhất quy chuẩn diễn đạt (Documentation Language Policy)

1. **Tuyệt đối KHÔNG sử dụng**:
   * *"Hệ thống mô phỏng tuân thủ 100% tiêu chuẩn ICAO (ICAO Compliant Simulator)"*
   * *"Quy chuẩn dãn cách 28m theo quy định ICAO"*
   * *"Tần suất sự cố ngẫu nhiên theo xác suất tai nạn thực tế"*
2. **CHUẨN HÓA SỬ DỤNG**:
   * **`Research Simulator with selected rules traceable to ICAO / AIP sources`** (Hệ thống mô phỏng nghiên cứu với các quy tắc chọn lọc có thể truy xuất nguồn gốc ICAO / AIP).
   * **`PROJECT_SIMULATION_PARAMETER`** cho tất cả các ngưỡng đồ họa, khoảng cách đệm va chạm và tốc độ điều tiết.
   * **`PILOT_ROUTE_DEVIATION`** cho mô hình rẽ nhầm thay vì coi đó là lỗi hệ thống đèn.
