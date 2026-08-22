# BÁO CÁO ĐỐI SOÁT NGHIỆM THU KỊCH BẢN 5: TRUYỀN THỐNG VS A-SMGCS + FOLLOW-THE-GREEN (GRAPH V3)

---

## 1. THÔNG TIN MÔI TRƯỜNG THỰC THI CHUẨN
- **Cấu hình đồ thị**: Graph V3 Canonical (119 nodes, 169 edges).
- **Hình nền bản đồ**: `/anhchinh.png` (1200 x 860 px).
- **Mã băm topo**: `31e293e035c8f216`.
- **Số lượng tàu bay**: Đúng 8 tàu bay (`OUT01`..`OUT04`, `INB01`..`INB02`, `PUSH01`..`PUSH02`).

---

## 2. KẾT QUẢ ĐỐI SOÁT RUNTIME GIỮA HAI MÀN HÌNH

| Tiêu chí đối soát | Màn TRÁI (Điều hành truyền thống) | Màn PHẢI (A-SMGCS + Follow-the-Green) | Đánh giá & Chênh lệch |
| :--- | :--- | :--- | :---: |
| **Phương thức điều phối** | Đàm thoại thoại VHF tuần tự từng tàu | Tự động hóa Auto-Freeze & Phân pha Dijkstra | Khác biệt $100\%$ |
| **Đèn xanh FtG (`greenFtGCount`)** | **`0`** (Tuyệt đối không có đèn xanh) | **`51`** (Rolling Window 4 segment trước mũi) | **ĐẠT** |
| **Route Preview (`blueRoutePreviewCount`)** | **`0`** (Không có đường nét đứt) | **`224`** (Nét đứt xanh dương toàn tuyến) | **ĐẠT** |
| **Phản ứng khi đảo chiều $25 \to 07$** | KSVKL phát lệnh dừng chờ qua sóng VHF | Tức thời kích hoạt Auto-Freeze (8 Stop Bar đỏ) | Không giật cục / 0 trễ |
| **Thời gian giải phóng Pha 1** | $t=50\text{s}$ (Chỉ phát lệnh cho `OUT01`) | $t=25\text{s}$ (Cấp FtG cho `OUT01`, `OUT02`, `INB`) | Nhanh hơn $25\text{s}$ |
| **Thời gian giải phóng Pha 2** | $t=140\text{s}$ (`OUT03`, `OUT04`) | $t=45\text{s}$ (`OUT03`, `OUT04`, `PUSH`) | Nhanh hơn $95\text{s}$ |
| **Giải phóng Pushback** | $t=200\text{s}$ (`PUSH01`, `PUSH02`) | $t=45\text{s}$ (Khi trục lăn an toàn) | Nhanh hơn $155\text{s}$ |
| **Tốc độ taxi trung bình** | $11.4\text{ kts}$ (Do LVC không có đèn tim đường) | $15.0\text{ kts}$ (Đèn FtG dẫn đường tự tin) | Tăng $+31.6\%$ |
| **Thời gian hoàn tất mô phỏng** | **68:53 (4133s)** | **52:44 (3164s)** | **Tiết kiệm 16:09 (969s)** |
| **Hiệu quả cải thiện khai thác** | — | — | **+23.45%** |
| **Va chạm / Xâm nhập đường băng** | **0** | **0** | **AN TOÀN TUYỆT ĐỐI** |

---

## 3. DANH SÁCH 5 ẢNH BẰNG CHỨNG RUNTIME
1. 📸 `scenario5_t24_before_event.png`: Hai màn hình tại $t=24\text{s}$ trước biến cố đảo chiều.
2. 📸 `scenario5_t26_after_autofreeze.png`: Tại $t=26\text{s}$ sau Auto-Freeze, Stop Bar đỏ dựng trước mũi các tàu, Màn phải cấp Pha 1 cho OUT01/02.
3. 📸 `scenario5_t46_after_phase2.png`: Tại $t=46\text{s}$ sau Pha 2, Màn phải giải phóng OUT03/04 và PUSH01/02 với đèn xanh và route preview.
4. 📸 `scenario5_ftg_completed.png`: Màn phải FtG hoàn tất $8/8$ tàu tại $52:44$, đồng hồ FtG đóng băng.
5. 📸 `scenario5_traditional_completed.png`: Màn trái Truyền thống hoàn tất $8/8$ tàu tại $68:53$, bảng modal so sánh tổng kết tự động hiển thị.
