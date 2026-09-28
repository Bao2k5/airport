# Trạng thái nhánh Web 3D

> Cập nhật 25/09/2026: xem [đợt sửa mặt đường, vạch và đèn FTG](sua_mat_duong_den_ftg_3d.md) cho cấu trúc module, kết quả kiểm tra và giới hạn hình ảnh mới nhất. Phần mặt đường/đèn và nền bê tông trong tài liệu mới thay thế mô tả hình học cũ bên dưới.

## Hai trang làm việc

- `/2d` (hoặc `/`) mở bản đồ và bảng điều khiển 2D hiện hữu. `/3d` mở sa bàn/phòng KSVKL với `Airport3DConsole` riêng; nút **Trang 2D / Trang 3D** trên đầu trang chuyển giữa hai giao diện.
- `src/components/AirportMap.tsx` phục vụ 2D. `src/features/airport3d/Airport3DView.tsx` và `layout.ts` phục vụ 3D; App tải renderer và console 3D bằng `lazy()` khi cần.
- Hai trang nhận cùng graph và `simState`; 3D không chạy một vòng simulation tick độc lập. Chuyển trang bằng thanh đầu trang trong giao diện chính giữ phiên hiện tại. Các màn hình so sánh riêng của kịch bản 1 và 5 vẫn là giao diện 2D; trang 3D phát một cảnh sân bay cho từng kịch bản.

## Đã triển khai

- Sa bàn có nền grass/asphalt/concrete texture tiling, bệ mô hình có viền, sân đỗ bê tông liền tính từ cụm stand, dấu runway, tim taxiway, đèn biên, điểm holding/stop bar và nhãn vận hành. Đèn biên được rải theo chuỗi graph liên tục, chừa khoảng ở nút giao và lọc vị trí trùng; đèn FTG xanh chỉ bật theo `SimulationState.lightStates`, cùng nguồn trạng thái với 2D. Vạch stand xoay theo hướng đỗ của từng stand.
- Máy bay dùng model A321 GLB từ nguồn Blender prototype Unity; các mesh được gộp theo vật liệu để giảm draw calls từ 168 xuống 7. Hướng, hiệu gọi, lựa chọn và vị trí vẫn đọc route/progress của phiên mô phỏng. Tháp KSVKL là mô hình cắt lớp có bàn, ghế, màn hình FTG và đồng hồ; màn hình đọc trạng thái mô phỏng chung.
- Bố cục mặc định không có nhà ga theo yêu cầu hiện tại của người dùng. Hàng cây dùng tán nhiều cụm với màu/kích thước thay đổi để tránh hình cầu đồng nhất.
- Camera tổng quan, bốn góc 90 độ, theo máy bay, xoay/pan/zoom bằng chuột và điều khiển cảm ứng qua OrbitControls. Điều chỉnh góc/thu phóng thủ công vẫn có tác dụng khi đang theo máy bay.
- Chế độ toàn phòng KSVKL, bàn GND, bàn TWR; có cửa kính nhìn ra graph sân bay và console hiển thị hiệu gọi, vị trí, tuyến, trạng thái phiên/thời gian và vị trí đang kiểm soát. Có thể chọn chuyến bay trên màn hình console ở chế độ thủ công.
- Console 3D có hai luồng riêng: **Tự chạy** để chọn/phát/tạm dừng/đổi tốc độ kịch bản và **Thực hành KSVKL** để một người chuyển vai GND/TWR. Chế độ thực hành có phiếu bay, cấp tuyến, readback, yêu cầu/tiếp nhận bàn giao và xác nhận đường băng. Quyền được gán theo chuyến bay; sai vai không thể nhận tuyến hoặc bắt đầu lăn. Máy bay dừng tại điểm holding phù hợp để bên đang giữ quyền đề nghị bàn giao; bên nhận phải chuyển sang đúng vị trí và tiếp nhận. TWR xác nhận đường băng rồi mô phỏng readback trước khi máy bay tiếp tục.
- Editor chọn tháp và đèn sân đỗ trong bố cục mặc định; dịch theo trục bằng nút hoặc nhập tọa độ, nhập góc xoay/tỉ lệ, đổi vật liệu; mỗi lần nhập số được gom thành một bước undo; có undo/redo, lưu cục bộ, reset, nhập/xuất JSON có version và kiểm tra giới hạn, lưu góc camera. Máy bay, graph và đèn nghiệp vụ không chỉnh được trong editor.
- Bảng `ControlPanel`/`PresetScenariosPanel` hiện hữu chỉ xuất hiện ở trang 2D. Trang 3D dùng `Airport3DConsole` riêng; các lệnh của hai giao diện vẫn cập nhật cùng trạng thái mô phỏng.
- Điều kiện sương mù ở các kịch bản tầm nhìn thấp đã được chỉnh để camera tổng quan vẫn thấy sân bay; trước đó giới hạn sương mù gần hơn khoảng cách camera nên cảnh 3D chỉ hiện nền xám và nhãn.

## Giới hạn còn lại

- Các model GLB và texture cải thiện cảnh nhưng chưa phải một bộ tài sản photorealistic hoàn chỉnh. Tháp và tán cây vẫn là hình học thủ tục; chưa có địa hình sân bay chi tiết dạng mesh, bảng hiệu lớn, vật liệu normal/roughness đầy đủ, xe tug tương tác hoặc QA hình ảnh trực tiếp trên trình duyệt. Cần tinh chỉnh tiếp sau khi xem ở máy của người dùng.
- Luồng thực hành hiện là bản mô phỏng đơn giản: readback là thao tác xác nhận, chưa kiểm tra nội dung đọc lại; chưa mô hình hóa pushback/tug, xung đột hai tàu bay tại một nút, nhiều điều kiện runway occupancy riêng theo quyền TWR, hoặc đầy đủ luồng hạ cánh. Cần đối chiếu swimlane/rule inventory và kiểm thử từng nhánh trước khi coi là hoàn tất.
- Động cơ của cả năm kịch bản đã được kiểm tra tiến thời gian và cập nhật tọa độ, nhưng chưa xác nhận hình ảnh/chuyển trang trên trình duyệt trong lượt kiểm tra này. Chưa kiểm tra nhập/xuất bố cục trên thiết bị thật hoặc chất lượng/hiệu năng trên laptop/điện thoại.
- `npm.cmd run build` đã qua sau thay đổi hiện tại. Vite báo chunk 3D khoảng 1,056 KB minified / 285 KB gzip; chunk được tải lười khi chọn 3D. Ba texture JPEG tổng khoảng 1.1 MB; A321 GLB khoảng 2.8 MB/7 meshes. Cần theo dõi hiệu năng và thời gian tải trên điện thoại.
- `npm.cmd run lint` không chạy được ở repo hiện tại vì thiếu `eslint.config.js` (ESLint 10 yêu cầu flat config). Chưa thêm cấu hình lint toàn dự án.

## Chạy

Từ thư mục gốc dự án:

```powershell
npm.cmd run dev
```

Mở `http://localhost:5173/2d` hoặc `http://localhost:5173/3d`, hoặc dùng nút **Trang 2D / Trang 3D** trên đầu trang. Trang 3D có nút **Tự chạy** và **Thực hành KSVKL** trong console riêng. Trong 3D chọn **Sa bàn sân bay**, **Toàn phòng KSVKL**, **Bàn GND**, hoặc **Bàn TWR**. Ở sa bàn, kéo chuột trái để xoay, kéo chuột phải để di chuyển, cuộn để thu phóng; trên màn hình cảm ứng dùng kéo/chụm. Bật **Chỉnh bố cục** để mở editor. **Lưu bố cục** lưu trên trình duyệt/thiết bị hiện tại; dùng xuất/nhập JSON để chuyển sang thiết bị khác.
