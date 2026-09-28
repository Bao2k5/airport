# Mặt đường, vạch sơn và đèn FTG 3D — 25/09/2026

## Sửa tiếp theo ảnh phản hồi: đường hụt, đèn nhỏ và hướng máy bay

- Đã xác minh nguyên nhân hụt mặt đường: các node INTL_S2/S3/S4 trên trục taxiway có metadata `type: stand`. Bộ vẽ cũ nhận nhầm chúng là bến đỗ và bỏ phần asphalt. Bộ vẽ mới dùng tên/danh sách stand vận hành để xác định vị trí đỗ, giữ mặt đường tại những nút này. Không sửa dữ liệu graph.
- Tăng thân đèn từ bán kính 0.06 lên 0.085 đơn vị cảnh; thêm quầng sáng theo kích thước màn hình: 9 px cho FTG/stop bar và 5 px cho đèn biên. Đèn tắt không phát quầng. Vị trí đèn vẫn cố định.
- Chuyển nguyên hàm tính tư thế 2D sang `src/presentation/aircraftPose.ts`, cả 2D và 3D dùng chung. 3D áp dụng cả chuyển động lùi và các bước xoay pushback, kể cả stand phía Nam. Model GLB hướng mũi theo -Z nên góc yaw phải mang dấu âm của góc phương vị SVG. Khi đỗ/đến stand, lấy hướng của stand hiện tại.
- `ftgScenarios.ts` cung cấp một luồng FTG cho mỗi tình huống 3D và mô tả chỉ nói về FTG. Không mở màn so sánh/truyền thống trong 3D; thư viện 5 tình huống và phần so sánh 2D vẫn được giữ.
- Kiểm tra hồi quy đã qua: INTL_S2/S3/S4 không bị coi là bến đỗ; tư thế 3D khớp hàm 2D trên các đoạn tuyến ở nhiều mức progress; các hướng mũi 0/90/180/270 đúng hệ trục; dữ liệu mô tả 3D chỉ FTG; cả 5 kịch bản có chuyển động và cập nhật đèn. Tổng số fixture sau sửa là 780. Vẫn cần nghiệm thu ảnh trên trình duyệt thực tế.

## Phạm vi đã sửa

- Thay các khối đường riêng theo edge bằng một mặt phẳng có bản vẽ bề mặt được sinh từ graph. Các nét đường nối liên tục, không còn thành hộp dựng lên ở điểm giao. Bản vẽ này là texture thủ tục từ dữ liệu sân bay, không phải ảnh concept hay ảnh nền chụp sẵn. Máy bay, đèn, camera và tương tác vẫn là 3D trực tiếp.
- Tim taxiway và vạch runway dùng các chuỗi graph liên tục. Vạch tim đường băng không bắt đầu lại ở mỗi đoạn ngắn. Vạch biên được ngắt ở miệng giao lộ theo diện tích mặt đường.
- Lead-in bám chính đoạn nối tới stand; stop line ở node stand. Bỏ các thanh/vòng stand độc lập. Các nhánh stand nằm trên sân bê tông, không có thanh đường nhô lên.
- Đèn được tạo một lần theo graph, có ID và liên kết edge cố định. Thay đổi trạng thái chỉ cập nhật màu instance. Có lọc đèn biên rơi trong mặt đường khác tại giao lộ, lọc vị trí trùng và bỏ đèn biên ở nhánh stand.
- Xanh FTG chỉ đọc `lightStates`; đỏ/blocked có ưu tiên chặn xanh. Đèn tắt vẫn có thân tối ở vị trí cố định. Stop bar chỉ đặt tại node có metadata holding/runway-entry hoặc nhãn STOP BAR và có đường tiếp cận. Liên kết điều khiển dùng các edge kề node; đây là ánh xạ hiển thị từ dữ liệu hiện có.
- Đường đóng có dấu X theo chuỗi đóng, thay cho việc tự dựng stop bar giữa từng edge. Chú giải trong viewport thông báo trạng thái FTG và phân biệt màu đèn.
- Cảnh nhìn qua cửa phòng KSVKL tái sử dụng cùng module mặt đường/đèn.
- Giữ nền bê tông và việc bỏ nhà ga/cây của workspace hiện tại. Không sửa graph, engine, quy tắc GND/TWR hoặc dữ liệu kịch bản trong đợt này.

## Các file triển khai

Đường dẫn tương đối dưới `src/features/airport3d/`:

| File | Trách nhiệm |
| --- | --- |
| `Airport3DView.tsx` | Ghép Canvas, scene, camera preset và trạng thái editor |
| `viewTypes.ts` | Kiểu riêng của view; nhập domain types từ `src/types.ts` |
| `sceneCoordinates.ts` | Đổi tọa độ và nội suy vị trí máy bay dùng chung cho camera/model |
| `hooks/useSafeDispose.ts` | Dọn tài nguyên Three.js có xử lý StrictMode |
| `hooks/useTiledTexture.ts` | Tải và cấu hình texture lặp |
| `components/AircraftModel.tsx` | Model GLB, tư thế và chọn máy bay |
| `components/AirportCameraControls.tsx` | Orbit và theo máy bay |
| `components/AirportScene.tsx` | Ghép sân bay, tháp, máy bay và ánh sáng môi trường |
| `components/ControlRoomScene.tsx` | Phòng KSVKL và cảnh ngoài cửa |
| `components/LayoutInspector.tsx` | Giao diện chỉnh bố cục hiện có |
| `surface/geometry.ts` | Đoạn/chuỗi hiển thị, lấy mẫu và khoảng cách tới đường |
| `surface/paintSurface.ts` | Sinh bản vẽ mặt đường và vạch sơn từ graph |
| `surface/AirportPavement.tsx` | Texture và mesh mặt đường, giới hạn độ phân giải |
| `surface/lightLayout.ts` | Vị trí/ID đèn cố định, ánh xạ màu theo state |
| `surface/AirportLights.tsx` | Render đèn bằng instancing |
| `surface/AirportRestrictions.tsx` | Dấu đóng đường |
| `surface/SurfaceLegend.tsx` | Chú giải và trạng thái FTG trong viewport |

`TowerCutaway.tsx`, `layout.ts`, `visualTokens.ts` và `Airport3DConsole.tsx` tiếp tục được tái sử dụng. Không tạo store mô phỏng thứ hai.

## Kiểm tra

```powershell
cd D:\Thao\airport-simulator
npm.cmd run build
node scripts/check-3d-surface.mjs
npm.cmd run dev
```

Mở `http://localhost:5173/3d`. Kiểm tra nút giao đường băng/đường lăn và cụm stand ở góc gần, sau đó chạy kịch bản và tạm dừng/tiếp tục. Chuyển 2D/3D bằng nút trong ứng dụng để giữ phiên hiện tại.

Script `scripts/check-3d-surface.mjs` đã kiểm tra trên graph hiện có: 133 đoạn không có chiều dài bằng 0, 778 fixture cố định; mỗi đoạn có liên kết FTG; đèn biên không nằm trong diện tích một đường khác; trạng thái đỏ/blocked chặn xanh; vị trí/ID đèn và graph không bị thay đổi. Cả 5 kịch bản được chạy 120 giây mô phỏng, có chuyển động và ánh xạ FTG đúng; pause giữ thời gian.

## Giới hạn nghiệm thu

- Chưa có trình duyệt kết nối với công cụ trong phiên này, nên chưa chụp được ảnh trước/sau hoặc thử các nút bằng thao tác UI. Kiểm tra engine không thay thế nghiệm thu hình ảnh.
- Texture bề mặt giới hạn 4096 px trên desktop, 2048 px trên viewport nhỏ; cần xem độ sắc của vạch khi zoom rất gần và đo FPS trên thiết bị thật.
- Graph cung cấp tim tuyến, không cung cấp polygon khảo sát chính xác cho từng sân đỗ. Bề rộng đường và phần bao sân đỗ vẫn là hình học hiển thị suy ra từ dữ liệu hiện có. Không khẳng định đã dựng đầy đủ hình học sân bay TSN thực tế.
- Chưa phải bộ tài sản photorealistic hoàn chỉnh. Mục tiêu đợt này là sửa đường/vạch/đèn và tách module để tiếp tục tinh chỉnh có kiểm soát.
# Cập nhật tiếp ngày 26/09/2026

Xem [tiến độ đồng bộ Tower và FTG](tien_do_dong_bo_tower_ftg_3d.md) cho thay đổi mới nhất: camera ở cabin của tháp thật, bản đồ 2D trên màn hình nghiệp vụ, cửa sổ đèn FTG dùng chung, màu tàu bay, tùy chỉnh cảnh và danh sách yêu cầu còn thiếu. Các ghi nhận phía dưới là các lần sửa trước.
