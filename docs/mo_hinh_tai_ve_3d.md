# Tích hợp model sân bay đã tải

Cập nhật ngày 26/09/2026. Đã kiểm tra đệ quy `public/models/airport-assets/`: 10 GLB gốc, không có GLTF rời; tạo thêm 9 GLB tối ưu trong `optimized/`. Giữ nguyên các tệp gốc.

## Phạm vi và vị trí

Nhà ga và máy bay tải về nằm trên một sân trưng bày riêng ở ngoài rìa phía đông của sa bàn. Máy bay trong khu này là vật trang trí, mũi hướng vào nhà ga; không thay thế máy bay đang chạy FTG và không tham gia kịch bản. Giữ nguyên tower đang có, các stand vận hành, W11, runway, taxiway và graph 2D.

`getAssetZone(graph)` tìm giới hạn phía đông của toàn bộ đoạn đường, kể cả bề rộng mặt đường, rồi đặt mép sân trưng bày cách thêm ít nhất 5 đơn vị 3D. Sân rộng 24 × 24 đơn vị. Với graph V3 hiện tại, tâm sân là `[73.6, 0.025, 12.9708333333]`. Đây là khu trưng bày bổ sung theo yêu cầu đặt model ngoài vùng bay, không phải tọa độ nhà ga thật của TSN.

## Các file gốc đã kiểm tra

Dung lượng theo MiB; số tam giác tính từ accessor của primitive TRIANGLES, bao gồm mesh collider nếu tệp gốc có.

| File gốc | MiB | Mesh | Tam giác | Cách sử dụng |
| --- | ---: | ---: | ---: | --- |
| `airport_hangar.glb` | 0.30 | 2 | 5.528 | Bỏ collider, xuất hangar đặt bên ngoài vùng bay |
| `airport_jetway.glb` | 12.57 | 2 | 212.846 | Giảm còn 17.999 tam giác, nối nhà ga tới máy bay trang trí |
| `airport_pack_total.glb` | 13.04 | 98 | 315.626 | Tách riêng nhà ga, máy bay, xe kéo hành lý, xe hành lý và bus |
| `airport_stairs.glb` | 0.17 | 2 | 3.725 | Bỏ collider, dùng xe thang ở sân trưng bày |
| `a_minimalist_airport_diorama.glb` | 54.51 | 5.110 | 1.022.823 | Không dựng cả sa bàn khác đè lên TSN |
| `broadcast_tower_game_ready.glb` | 21.00 | 2 | 13.810 | Không thêm tháp phát sóng vào hệ thống tower hiện tại |
| `control_tower_san_francisco.glb` | 62.58 | 2 | 86.168 | Giữ tower TSN hiện có theo yêu cầu |
| `dumpster.glb` | 12.64 | 1 | 3.288 | Giảm texture, dùng ở khu kỹ thuật trưng bày |
| `ncl_airport_sign.glb` | 0.24 | 5 | 6.700 | Không thêm biển NCL vào mô phỏng TSN |
| `runway.glb` | 6.36 | 9 | 195.203 | Không thay runway và nhãn đang lấy từ graph TSN |

Các model gốc có phong cách cách điệu. Tích hợp giữ hình dáng và vật liệu của tài nguyên đã tải; không đồng nghĩa với chất lượng ảnh chụp như concept.

## Tài nguyên thực sự được tải trong scene

| File trong `optimized/` | MiB | Nguồn | Hiển thị |
| --- | ---: | --- | --- |
| `terminal.glb` | 1.12 | Pack: `07.Modulo1` | Cả hai mức đồ họa |
| `aircraft-static.glb` | 0.37 | Pack: `18.1.Airplane` | 1 máy bay khi tiết kiệm, 2 khi chi tiết |
| `baggage-tug.glb` | 0.33 | Pack: `21.1.BaggageTruck` | Cả hai mức |
| `baggage-cart.glb` | 0.27 | Pack: `21.2.BaggageTruck` | Cả hai mức |
| `bus.glb` | 0.67 | Pack: `20.PassengerBus` | Cả hai mức |
| `jetbridge.glb` | 2.59 | Jetway riêng | 1 cầu khi tiết kiệm, 2 khi chi tiết |
| `stairs.glb` | 0.13 | Stairs riêng | Mức chi tiết |
| `hangar.glb` | 0.25 | Hangar riêng | Mức chi tiết |
| `dumpster.glb` | 4.54 | Dumpster riêng | Mức chi tiết |

Tổng file GLB riêng biệt khoảng 10,27 MiB ở mức chi tiết và 5,34 MiB ở mức tiết kiệm, chưa kể tài nguyên vốn có của ứng dụng. Các bản sao máy bay/cầu dùng chung cache GLTF; không tải lại tệp cho từng bản sao. Scene nhà ga được lazy load, mỗi model có Suspense và ranh giới lỗi riêng. Tắt **Model nhà ga bên ngoài** sẽ không dựng khu này; cache đã tải có thể vẫn ở bộ nhớ.

Texture được thu về tối đa 1.024 px mỗi chiều lớn nhất. Chỉ model vượt ngân sách mới giảm lưới. File gốc hơn 200 nghìn tam giác của jetway không được tải trực tiếp khi chạy.

Xe trong pack là xe kéo hành lý, không phải model xe kéo tàu bay chuyên dụng. Được đặt cạnh máy bay trưng bày. Khu trưng bày còn tái sử dụng `ServiceVehicle` làm xe kéo tàu bay minh họa; hoạt động pushback và xe kéo của máy bay FTG vẫn dùng thành phần hiện có. Xe minh họa này là hình học bằng code, không phải GLB trong bộ tải về.

## Loader và cấu hình

- `src/features/airport3d/assets/modelConfig.ts`: tên file, vị trí trong sân trưng bày, hướng, kích thước và mức chi tiết.
- `assets/ImportedModel.tsx`: clone scene, chuẩn hóa kích thước, đặt đáy geometry lên mặt đất; giữ lại vật liệu/texture thực khi chạy.
- `assets/assetPlacement.ts`: vị trí sân trưng bày tính từ graph, không sửa graph.
- `assets/DecorativeTerminal.tsx`: ghép sân, các model và nhãn khu vực.
- `assets/BoardingConnections.tsx`: đoạn nối đàn hồi ngắn từ đầu cầu tới cửa bên trái máy bay.
- `AirportScene.tsx`: gắn khu trang trí vào scene đang chạy.
- `Airport3DView.tsx`: nút camera **Khu nhà ga**.
- `components/SceneSettings.tsx`: bật/tắt model và mức đồ họa.

Model máy bay tải về có mũi theo trục +X. Xoay +90° quanh Y đưa mũi về -Z, hướng vào mặt nhà ga. Loader tính bounds sau khi xoay, scale theo kích thước mong muốn rồi bù `minY`, không đoán độ cao từ origin của file. Jetbridge dùng kích thước riêng để vừa khoảng cách nhà ga–cửa máy bay; không có animation tự nối/tách cầu trong khu trưng bày.

## Chạy và kiểm tra

Trong PowerShell:

```powershell
Set-Location D:\Thao\airport-simulator
npm.cmd run dev -- --host 0.0.0.0
```

Mở địa chỉ Vite in trong terminal, chọn **Trang 3D → Sa bàn sân bay → Khu nhà ga**. Camera có thể xoay, kéo và thu phóng như sa bàn chính. Trong **Thiết lập cảnh**, thử **Đồ họa → Tiết kiệm/Chi tiết** và **Model nhà ga bên ngoài**. Bấm **Tổng quan** để quay lại khu vận hành rồi chạy một kịch bản FTG; máy bay trang trí không được xuất hiện trong danh sách chuyến bay.

Kiểm tra cấu trúc bằng:

```powershell
node scripts/check-airport-assets.mjs
npm.cmd run build
```

Kết quả audit: `ASSETS_OK`, đọc cả 19 GLB, kiểm tra 11 vị trí model đặt đúng mặt đất, nằm trong sân trưng bày, đúng kích thước/scale và cách mọi edge vận hành ít nhất 5 đơn vị. Graph giữ nguyên trước/sau kiểm tra. Báo cáo đầy đủ: `artifacts/asset-review/asset-audit.json`.

Script test bỏ texture chỉ khi kiểm tra geometry trong Node; ứng dụng vẫn tải model với texture đầy đủ. Đã có kiểm tra hình ảnh bằng render Blender ngoại tuyến cho hướng máy bay và vị trí cầu nối. Chưa xác nhận thao tác trực tiếp bằng trình duyệt tự động trong môi trường này; render ngoại tuyến không thay thế kiểm tra UI trên máy người dùng.

## Tạo lại bản tối ưu nếu đổi file nguồn

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python scripts/prepare-airport-assets.py
node scripts/check-airport-assets.mjs
```

Script chỉ xuất vào `public/models/airport-assets/optimized/`, không ghi đè các GLB gốc. Nếu đổi model sang bộ khác, cần cập nhật tên mesh được tách trong script, hướng mũi trong cấu hình và kiểm tra lại cầu nối bằng hình ảnh.
