# Định hướng sa bàn 3D theo ảnh tham chiếu của người dùng

> **Cập nhật phạm vi:** vẫn tham khảo phong cách sa bàn dưới đây, nhưng nền tảng hiện hành là [Web 3D](ban_giao_web_3d_luna_antigravity.md), hỗ trợ laptop/điện thoại/máy tính bảng, cả tự chạy và thực hành GND/TWR, có editor bố cục. Các mô tả “chỉ trên máy tính, máy bay tự chạy” bên dưới là quyết định lịch sử đã được mở rộng. Không làm LED vật lý.

Trạng thái: cập nhật thiết kế cho Luna; chưa thay đổi model hoặc code runtime. Ảnh tham chiếu được gửi trong hội thoại ngày 23/09/2026. **Xác nhận cuối cùng: chỉ dựng sa bàn 3D trên máy tính, máy bay tự chạy trong mô phỏng.** Đèn là hiệu ứng ảo; không làm sa bàn vật lý hoặc LED thật. Xác nhận này thay thế câu trả lời trước đó về cả hai loại sa bàn.

## 1. Đích hình ảnh

Sản phẩm chính là **một sa bàn sân bay thu nhỏ đặt trên đế trưng bày**, có thể xoay, zoom và điều hành. Người xem nhìn được cả hệ thống đường băng, đường lăn, sân đỗ, vị trí tàu bay và tuyến đèn đang được cấp.

Các đặc điểm quan sát được trong ảnh cần kế thừa:

- Đế chữ nhật có độ dày, viền gọn và chất liệu tối/giả gỗ tạo cảm giác mô hình trưng bày.
- Góc nhìn cao, nghiêng từ phía sân đỗ; hai runway nằm ở phía sau, apron và tàu bay ở phía trước.
- Địa hình cỏ thấp, cây phân bố thành cụm; công trình và tàu bay có hình khối thu nhỏ rõ ràng.
- Đường băng tối, vạch sơn sáng; sân đỗ bê tông xám, vạch vàng và số stand dễ đọc.
- Các điểm đèn có độ sáng nổi bật, kích thước thị giác vừa đủ để nhận ra từ toàn cảnh.
- Nhãn taxiway/runway có nền xanh đậm, chữ trắng; bố cục biển tên và chú giải kiểu triển lãm.
- Tháp kiểm soát là điểm nhấn; phòng KSVKL có thể xuất hiện ở góc nhìn phụ.

Ảnh là tham chiếu phong cách và cách trình bày. Không dùng ảnh làm nguồn xác nhận chính xác topology, số hiệu đường lăn, vị trí tháp, màu đèn theo quy định hoặc số liệu hiệu quả FTG. Những phần này lấy từ dữ liệu dự án hoặc cấu hình minh họa có ghi rõ.

## 2. Những gì phải giữ từ dự án

1. Graph đã resolve là nguồn định danh và liên kết vận hành; không vẽ lại tuyến chỉ để giống ảnh.
2. Owner GND/TWR, clearance, readback, holding và bàn giao phải điều khiển hành vi thật của mô phỏng.
3. Sa bàn và màn hình console dùng chung session, clock và trạng thái.
4. Không sửa ứng dụng 2D trong giai đoạn này.
5. Không bật toàn bộ đèn xanh ở chế độ vận hành rồi gọi là tuyến được cấp.

## 3. Phân lớp sa bàn

| Lớp | Nội dung | Yêu cầu |
| --- | --- | --- |
| Đế | Bàn/viền/chân đế tối giản | Có cạnh và chiều dày; không chỉ một plane vô hạn |
| Nền | Cỏ, đất, đường dịch vụ | Màu/độ nhám phân biệt, tránh texture lặp quá rõ |
| Bề mặt khai thác | Runway, taxiway, apron | Bám geometry dữ liệu; có biên và giao nối sạch |
| Vạch/nhãn | Tim tuyến, hold line, số stand, tên đường | Không z-fighting; không che tàu hoặc đèn |
| Đèn | Tim tuyến, mép, runway và Stop Bar | Các nhóm độc lập, đọc trạng thái từ hệ thống |
| Tàu/xe | Máy bay, tug, cứu hỏa, xe phục vụ | Đúng tỷ lệ tương đối, có animation khi zoom gần |
| Công trình | Tháp, nhà ga, nhà phụ trợ | Bố trí không lấn hành lang vận hành; ghi rõ phần minh họa |
| Trang trí | Cây, bụi, hàng rào | Không che điểm giao hoặc gây nhầm với vật cản có logic |
| Trình bày | Biển tên, bảng chú giải | Chữ thật, rõ dấu tiếng Việt; không bake chữ lỗi vào ảnh |

Không chép các tuyên bố hiệu quả hoặc cấp độ hệ thống trên biển trong ảnh vào sản phẩm như kết quả đã chứng minh. Biển chính đề xuất: “MÔ PHỎNG SA BÀN SÂN BAY TÂN SƠN NHẤT — FOLLOW THE GREEN”. Không tự gắn logo tổ chức để ngụ ý sản phẩm chính thức.

## 4. Camera và bố cục

- **Toàn sa bàn:** góc 3/4 từ apron, thấy đủ đế và hệ thống tuyến; đây là góc mặc định và ảnh nghiệm thu chính.
- **Tuyến được chọn:** đưa máy bay, điểm chờ và tuyến vào khung; không cắt mất giới hạn di chuyển.
- **Theo tàu:** camera sát hơn để xem pushback, xe kéo, bánh, động cơ và docking.
- **Bàn KSVKL:** góc riêng hoặc cửa sổ phụ; không bắt người dùng đi bộ trong phòng mới điều hành được.

Orbit quanh tâm sa bàn; giới hạn pitch và zoom để không chui dưới đế. Có nút về toàn cảnh. Góc toàn cảnh có thể dùng perspective với tiêu cự dài để giảm méo; chọn bằng ảnh thử, không khóa thông số trước khi xem scene.

UI thao tác đặt cạnh hoặc bên dưới viewport theo kích thước màn hình. Không che apron bằng hai panel quá rộng. Chế độ trình diễn có thể thu panel và giữ chú giải, tên bài, thời gian, người đang điều khiển.

## 5. Hai chế độ ánh sáng phải phân biệt

### Chế độ vận hành

Tuyến được cấp có đèn xanh cuốn theo tàu. Đoạn chưa cấp không phát tín hiệu cho phép. Stop Bar và holding line có vị trí riêng, bật/tắt theo clearance và trạng thái bảo vệ. Chọn tàu hiển thị preview bằng overlay khác với đèn thật.

### Chế độ trưng bày hệ thống đèn

Cho phép bật các nhóm để giải thích vị trí/màu/chức năng, tạo hình ảnh gần ảnh tham chiếu. Phải có nhãn **“Trưng bày đèn — không cấp phép di chuyển”**. Chuyển sang chế độ này pause mô phỏng và khóa lệnh di chuyển; quay lại vận hành khôi phục đèn từ state, không giữ tùy chỉnh trưng bày.

Bloom nhẹ giúp thấy đèn, không để các điểm sáng hòa thành dải trắng. Ưu tiên emissive/instancing; không dùng hàng nghìn point light có shadow. Với pipeline hiện tại chưa có bloom phù hợp, dùng hình học/material phát sáng dễ đọc trước; đánh giá pipeline sau ảnh đối chiếu.

## 6. Tỷ lệ mô hình và dữ liệu chuyển động

Domain giữ mét, m/s và giây. Cảm giác sa bàn chủ yếu đến từ đế, camera, vật liệu và ánh sáng, không bắt buộc thu nhỏ toàn bộ tọa độ vật lý.

Phương án đầu tiên: giữ tọa độ Unity hiện tại để tái sử dụng chuyển động, dựng đế bao quanh bounds graph và chỉnh camera tạo cảm giác mô hình. Nếu cần scale phần hiển thị sau này, dùng một transform thống nhất và chuyển đổi raycast/pose đúng; không scale riêng tàu, đèn và đường khiến chúng lệch nhau.

Độ lớn nhãn hoặc quầng sáng có thể điều chỉnh theo camera để dễ đọc. Kích thước footprint dùng cho điều phối vẫn lấy từ domain; không lấy quầng sáng hoặc kích thước nhãn làm vùng va chạm.

## 7. Thứ tự thực hiện dành cho Luna

### S01 — Khung sa bàn

Từ `AirfieldBuilder` hoặc phần tương ứng trong `AirportWorld`: tính bounds, tạo đế/viền/nền, đặt camera toàn cảnh. Chưa thêm cây dày hoặc hiệu ứng nặng.

**Nghiệm thu:** một ảnh thấy cả sa bàn, không clipping, tỷ lệ bố cục giống hướng ảnh tham chiếu; topology vẫn đúng dữ liệu.

### S02 — Bề mặt và sơn

Chỉnh runway/taxiway/apron, các vùng nối, vạch và nhãn. Tách apron khỏi kiểu mỗi stand là một tấm vuông chồng nhau. Thêm nguồn bề mặt bổ sung nếu graph chưa đủ thông tin.

**Nghiệm thu:** ảnh toàn cảnh và cận ba giao điểm không có khe hở, giao chồng, z-fighting hoặc vạch bị che.

### S03 — Hệ thống đèn

Tách nhóm đèn, nối state, thêm chế độ trưng bày có khóa chuyển động. Hoàn thiện chú giải tương ứng với các nhóm thực tế đã triển khai.

**Nghiệm thu:** cùng một góc chụp ba trạng thái: trưng bày, tuyến đang cấp, hold tại Stop Bar; người xem phân biệt ngay.

### S04 — Tàu bay, tháp, nhà ga và cây

Chỉnh model hiện có, bổ sung công trình và cây theo lớp. Làm cụm sân đỗ mẫu trước khi nhân rộng. Chỉ triển khai tài sản có tên trong manifest; ghi rõ phần minh họa.

**Nghiệm thu:** ảnh 3/4 toàn cảnh, cận máy bay/xe kéo, cận tháp/sân đỗ; không có cây che tuyến và máy bay xuyên công trình.

### S05 — Một lượt điều hành hoàn chỉnh trên sa bàn

Chọn tàu ở stand → GND cấp pushback → readback → tug đẩy/tháo/rời → cấp taxi → đèn theo tàu → dừng holding point → bàn giao TWR → line-up và takeoff riêng.

**Nghiệm thu:** thao tác thật qua UI, có log; pause/reset hoạt động; không chỉ quay video animation viết sẵn.

### S06 — Hoàn thiện sản phẩm

Tiếp tục các luồng và chặng còn lại trong kế hoạch bàn giao. Phòng KSVKL chi tiết là góc phụ sau sa bàn chính. Đo FPS và kiểm tra 1366×768/1600×1000; giữ bản build và ảnh nghiệm thu theo phiên bản.

## 8. Máy bay tự chạy trong sa bàn số

Máy bay tự di chuyển theo tuyến sau khi nhận clearance và readback hợp lệ. Tug thực hiện pushback; tàu taxi, dừng tại giới hạn, chờ bàn giao, tiếp tục khi có lệnh. Người dùng điều hành bằng bàn GND/TWR, không phải kéo máy bay bằng chuột từng đoạn.

Đèn ảo, máy bay, xe kéo, phiếu bay và màn hình console đều đọc cùng trạng thái Unity. Có thể thêm chế độ trình diễn tự động đóng vai KSVKL, nhưng phải ghi rõ DEMO; chế độ người chơi vẫn đòi hỏi thao tác cấp lệnh. Không tạo hardware adapter, firmware, BOM hoặc hỏi kích thước/ngân sách sa bàn thật.

## 9. Đoạn bổ sung vào prompt cho Luna

```text
Cập nhật quan trọng: người dùng muốn phong cách SA BÀN SÂN BAY THU NHỎ
như ảnh đã gửi, có đế trưng bày, góc toàn cảnh nghiêng, cây, sân đỗ,
máy bay nhỏ và đèn FTG nổi bật. Đọc docs/dinh_huong_sa_ban_3d.md.

Ưu tiên sa bàn chính trước phòng điều hành chi tiết. Dùng graph dự án
cho topology, ảnh chỉ định hướng hình thức. Tách chế độ trưng bày đèn
khỏi vận hành có clearance; không bật toàn mạng xanh khi điều hành.
Giữ nguyên web 2D. Phạm vi cuối cùng chỉ là sa bàn số trên máy tính:
máy bay tự chạy theo clearance, đèn ảo đồng bộ trong Unity.
Không thực hiện phần cứng hoặc nhiệm vụ trong ke_hoach_sa_ban_led.md.
```
