# Prompt giao triển khai Web 3D

Copy phần bên dưới cho Luna và Antigravity. Cần cho cả hai quyền đọc cùng bản [đặc tả chính](ban_giao_web_3d_luna_antigravity.md). Nếu môi trường nhận không truy cập được repo, đính kèm nguyên tài liệu đó; không chỉ gửi đường dẫn cục bộ.

---

Bạn triển khai Web 3D cho `D:\Thao\airport-simulator`.

Đọc `AGENTS.md`, sau đó đọc toàn bộ `docs/ban_giao_web_3d_luna_antigravity.md`. Đây là đặc tả hiện hành, bao gồm các quyết định của người dùng, camera/chuột/cảm ứng, năm kịch bản, thực hành GND/TWR, editor trên mobile, phân công và nghiệm thu A01–A15. Các quyết định nền tảng Unity trong kế hoạch cũ đã bị thay thế.

Mục tiêu: hoàn thành phiên bản chức năng chạy đúng trước, có cấu trúc để nâng cấp UI/UX dần. Web 3D là bản chính; Unity chỉ tham khảo. Không dừng ở kế hoạch, scaffold hoặc nút giả.

Các điều kiện bắt buộc:

1. Một phiên mô phỏng chung cho 2D, 3D và màn hình trong phòng KSVKL. Không viết lại bộ kịch bản riêng cho renderer 3D.
2. Giữ chức năng và hành vi bản 2D; được refactor tối thiểu để chia sẻ logic, có hồi quy.
3. Đối chiếu đủ năm bài theo source, gồm các nhánh so sánh và vòng chạy riêng; không chỉ nhập `setup()` rồi báo khớp hoàn toàn.
4. Có tự chạy và thực hành; thực hành chờ lệnh đúng quyền GND/TWR, một người chuyển vai trước.
5. Có toàn sân, bốn góc, theo máy bay, toàn phòng KSVKL, bàn GND và TWR. Cảnh ngoài kính và màn hình trong bàn dùng dữ liệu phiên thật.
6. Chuột: wheel zoom; trái kéo vùng trống orbit; phải kéo pan; Toàn cảnh reset camera. Cảm ứng: pinch zoom, một ngón orbit, hai ngón pan. Kéo vật thể không đồng thời xoay camera.
7. Có editor bố cục trên laptop và cảm ứng: chọn/chỉnh mô hình, đèn, vật liệu, camera; undo/redo; save/reload; import/export; reset mặc định. Không ghi đè graph hoặc trạng thái máy bay đang chạy.
8. UI bản đầu đơn giản nhưng dùng được, dễ đọc, không che hết cảnh. Không hứa mọi thiết bị mượt; kiểm tra và điều chỉnh chất lượng.
9. Chưa làm multiplayer, API dữ liệu thật, phần cứng LED, đăng nhập/backend không cần thiết hoặc tự publish.
10. Báo cáo bằng chứng build/lint/runtime/hành vi; tách “đã làm”, “đã kiểm tra”, “còn thiếu”. Không lấy ảnh đẹp hoặc build Unity cũ làm bằng chứng hoàn tất Web 3D.

Thực hiện tuần tự các giai đoạn 0–5 của đặc tả. Sau mỗi giai đoạn có kết quả chạy được, tiếp tục công việc đã được phép, không hỏi lại “có làm tiếp không”. Chỉ hỏi khi có quyết định thiếu thật sự ảnh hưởng phạm vi, chi phí hoặc hành động không thể đảo ngược.

Phân công đề xuất khi chạy hai công cụ:

- **Luna:** khảo sát, contract phiên/command/tọa độ, logic dùng chung, kịch bản, thực hành, tích hợp và hồi quy.
- **Antigravity:** renderer/cảnh, assets, camera, phòng KSVKL, bảng thao tác, editor, responsive và kiểm tra trải nghiệm trình duyệt.
- Thống nhất contract và danh sách file sở hữu trước khi làm song song. Luna tích hợp các file chung như `App.tsx`, `src/types.ts`, `package.json` và lockfile; không để hai bên cùng sửa chồng nhau.
- Nếu chỉ chạy một công cụ, công cụ đó thực hiện toàn bộ các giai đoạn theo cùng đặc tả.

Đọc tình trạng thực tế trước khi sửa; không ghi đè thay đổi có sẵn. Khi cần thêm chức năng ngoài đặc tả, ghi rõ đề xuất trước. Giữ tài liệu bàn giao và bảng nghiệm thu cập nhật theo kết quả thực tế.

---

## Lưu ý bàn giao ảnh

Hai ảnh mẫu (sa bàn đèn và phòng KSVKL nhìn qua kính) ở hội thoại, chưa xác nhận được lưu thành file trong repo. Đặc tả chính đã mô tả bố cục bằng chữ. Nếu bên triển khai cần đối chiếu hình ảnh chính xác, gửi kèm ảnh gốc; không nhầm ảnh chụp prototype Unity là ảnh mẫu.
