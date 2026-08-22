# BÁO CÁO PREFLIGHT MIGRATION GRAPH V3

> **NGUỒN CHÂN LÝ:** `D:\Thao\airport-simulator\v3_raw_traces_manual.json`
> **SHA-256:** `30b8a929fcb6ca1e25ae80f430fa49de8b06f4db4e0292d57db28a5da89d8991` (Khớp 100% với SHA kỳ vọng)
> **THỜI GIAN:** `21:21:00 21/8/2026`

---

## 1. KẾT QUẢ KIỂM TOÁN SHA & TÍNH TOÀN VẸN
- **SHA-256 đối chiếu:** `30b8a929fcb6ca1e25ae80f430fa49de8b06f4db4e0292d57db28a5da89d8991` $\to$ **✅ PASS 100%**
- **Xử lý trùng lặp Line ID:** Line ID thứ hai mang tên `"Tuyến line_39"` được ánh xạ nội bộ thành `line_39` (Node ID: `v3_line_39_p00`) mà không đổi tọa độ hay thứ tự trong file raw.
- **Phân loại Node:**
  - **Operational Nodes:** `20` nodes (hiển thị trên giao diện điều khiển).
  - **Geometry Nodes:** `101` nodes (nhãn rỗng, bo cua mượt mà).

---

## 2. KẾT QUẢ TOPOLOGY & LIÊN THÔNG
- **Tổng số Nodes:** `121`
- **Tổng số Edges:** `136`
- **Số thành phần liên thông (Connected Components):** `1` (✅ Toàn mạng lưới thông suốt)
- **All-Pairs Operational Reachability:** `380/380` (**100% PASS**)

---

## 3. KẾT LUẬN PREFLIGHT
- **Trạng thái:** **PREFLIGHT PASS**
- Đủ điều kiện để tiến hành ghi đè Graph V3 production và chuyển đổi toàn bộ logic mô phỏng!
