# Đồng bộ Tower và FTG — 26/09/2026

Nguồn yêu cầu: [bản yêu cầu đầy đủ](yeu_cau_nang_cap_ftg_3d_2026_09_26.md).

## Phần đã triển khai

- Bốn góc Sa bàn / Toàn phòng / GND / TWR render cùng `AirportScene`, cùng graph, fleet, đèn và layout. Không còn dùng sân bay thu nhỏ làm phông ngoài cửa sổ. Camera phòng lấy tọa độ cabin từ chính transform của tower, bao gồm bố cục đã lưu.
- Bấm màn hình chính / màn hình bên trái mở GND; màn hình bên phải mở TWR. Bản đồ nghiệp vụ mở bằng component `AirportMap` hiện có, nhận cùng `SimulationState` và callback chọn tàu bay. Trong thực hành, chuyển bàn dùng callback đổi vai hiện tại; không tự nhận bàn giao.
- Cabin có hai nhân vật, ghế, headset, microphone và animation tay theo `comicBubble` ATC/GND/TWR, lấy thời gian từ đồng hồ mô phỏng nên không tiếp tục animation khi pause. Đây là nhân vật procedural, chưa phải asset người chân thực.
- Khung liên lạc dùng nguyên văn `comicBubble` và `liveEventLog`. Không tạo hội thoại hay huấn lệnh giả. Log hệ thống vẫn được ghi là nhật ký, không gán nhầm tất cả thành lời phi công.
- `presentation/ftgGuidance.ts` chứa hàm cửa sổ FTG được tách từ renderer 2D. 2D và 3D dùng cùng khoảng mẫu, chiều dài nhìn trước, số cạnh tối đa và dung sai phía sau. Đây là cấu hình SVG mô phỏng kế thừa, **không phải khoảng cách chuẩn hàng không**.
- Đèn 3D cố định trên từng cạnh, bật/tắt theo các điểm từ hàm dùng chung. Không bật cả cạnh phía sau máy bay. Đã bỏ điểm sáng giả do cạnh dài 0 ở cả hai renderer. Giữ dãy stopbar theo metadata graph và trạng thái đỏ/blocked hiện tại.
- Sơn màu thân/đuôi và nhãn tàu bay dùng bảng hãng bay có sẵn của 2D; 6 máy bay mặc định có 6 màu. Màu phiếu bay và thông tin radio lấy cùng hãng của tàu bay, không chỉ suy luận từ callsign.
- Chế độ thực hành có trường hiệu gọi, loại tàu bay, hãng/màu và form tạo chuyến mới (tối đa 20 tàu). `manualFlights.ts` kiểm tra hiệu gọi, vị trí đang bị chiếm dụng và tuyến khả dụng trước khi thêm vào fleet chung.
- Thêm số stand sơn lên atlas mặt sân, theo hướng nhánh stand; không dịch chuyển node, tuyến hay stop line.
- Thiết lập cảnh: đồ họa thấp/cao (DPR), bóng đổ, hiện/ẩn KSVKL, độ rõ đèn, mật độ thiết bị, phản chiếu và model trang trí. Các thiết lập này chỉ thay đổi hiển thị.
- `flightMotion.ts` lưu approach/flare/rollout và lineup/takeoff-roll/rotate/climb trong trạng thái core; hai renderer đọc cùng tọa độ, altitude và pitch. Đây là chuyển động minh họa có thời gian cấu hình, không phải mô hình khí động học. Camera theo tàu bay lấy cả độ cao.
- Stopbar dùng chung `presentation/stopBars.ts` cho vị trí cố định và trạng thái đỏ; cảnh báo hold động của 2D vẫn là lớp riêng.
- Có VDGS minh họa, thiết bị sân đỗ và tug pushback. Vị trí thiết bị tĩnh được kiểm tra khoảng cách với đường lăn; thêm vật liệu bề mặt và phản chiếu môi trường cục bộ.
- Theo yêu cầu mới, thêm khu nhà ga **trưng bày bên ngoài vùng vận hành** bằng model người dùng cung cấp. Không đưa nhà ga vào các stand đang vận hành; không thay tháp hiện có. Xem [kiểm kê model và cách mở](mo_hinh_tai_ve_3d.md).

## Tệp chính

| Tệp | Trách nhiệm |
| --- | --- |
| `src/presentation/ftgGuidance.ts` | Hàm và cấu hình FTG dùng chung |
| `src/components/AirportMap.tsx` | Import hàm FTG chung, giữ renderer 2D |
| `src/features/airport3d/surface/{lightLayout,guidanceColors}.ts` | Vị trí bóng cố định và trạng thái từng bóng |
| `src/features/airport3d/surface/{AirportLights,LightGlow}.tsx` | Hiển thị bóng và quầng sáng |
| `src/features/airport3d/surface/paintSurface.ts` | Sơn số stand |
| `src/features/airport3d/components/TowerCameraControls.tsx` | Camera trong cabin đúng tọa độ tower |
| `src/features/airport3d/components/{TowerOperator,RadioOverlay,SceneSettings,FlightIdentityFields}.tsx` | Nhân vật, liên lạc và tùy chỉnh |
| `src/features/airport3d/components/{AirportScene,AircraftModel}.tsx` | Cùng scene và màu máy bay |
| `src/features/airport3d/{TowerCutaway,Airport3DView,Airport3DConsole}.tsx` | Tích hợp màn hình nghiệp vụ và điều khiển |
| `src/App.tsx` | Truyền callback cấu hình hiện có sang console 3D |

## Kiểm tra

```powershell
cd D:\Thao\airport-simulator
npm.cmd run build
node scripts/check-3d-surface.mjs
node scripts/check-3d-guidance.mjs
node scripts/check-flight-lifecycle.mjs
node scripts/check-scenario5-flight.mjs
npm.cmd run dev -- --host 0.0.0.0
```

Mở địa chỉ Vite in ra, đường dẫn `/3d`.

- Kiểm tra bề mặt và hồi quy 5 kịch bản: không sửa graph, hướng đỗ/pushback cùng 2D, đèn đỏ ưu tiên, pause.
- Kiểm tra mới: 1.014 tổ hợp tuyến/tiến độ từ 5 kịch bản. Đèn 3D sáng đúng tọa độ cửa sổ 2D, không còn bóng sáng ngoài cửa sổ và không có đèn xanh của tàu đang hold.
- Layout hiện có 771 fixture sau khi chuyển sang vị trí mẫu 2D; số lượng thay đổi không có nghĩa graph bị thay đổi.
- Build có cảnh báo kích thước chunk 3D trên 500 kB.
- Chưa kiểm tra trực tiếp trình duyệt: công cụ Browser không có browser kết nối. Vì vậy chưa nghiệm thu hình ảnh cabin, hit target, chất lượng model và responsive.

Thử trên UI: chạy FTG → vào GND/TWR → bấm màn hình → chọn máy bay → đóng bản đồ → quay lại sa bàn. Thử pause, đổi độ rõ đèn và chuyển 2D để so vị trí. Trong thực hành, đổi thông tin tàu, cấp tuyến/readback/bàn giao bằng điều khiển hiện tại.

## Giới hạn nghiệm thu

- Kiểm tra tự động đã qua các pha đến/đi, bàn giao từ bay sang lăn, pause/reset, tạo chuyến mới, W11 của kịch bản 5 và graph không bị thay đổi. Chưa kiểm tra trực tiếp thao tác trong trình duyệt vì không có Browser kết nối.
- Model tàu đang vận hành vẫn là model minh họa A321 đổi màu theo hãng; trường loại máy bay không đồng nghĩa đã có mesh riêng cho từng loại. Máy bay tải về chỉ nằm trong khu trưng bày, không tham gia fleet hay chiếm dụng FTG.
- Nhân vật và thiết bị procedural, VDGS minh họa, mô hình tải về và UI cần nghiệm thu hình ảnh trên máy người dùng; chưa thể gọi là hình ảnh chân thực như concept.
- Quy mô hình học và thời gian mô phỏng không được coi là số liệu đo đạc sân bay hay quy trình nghiệp vụ đã chứng nhận. Không sửa đường line TSN để khớp ảnh concept.
