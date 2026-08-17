# Báo Cáo Kiểm Tra & Phân Tích Hành Vi Mô Phỏng Website Cũ (https://airport-simulator.vercel.app/)

> **Thời điểm kiểm tra**: 2026-08-17  
> **Nguồn phân tích**: Bundle production JS (`assets/index-70THNDgT.js`), CSS (`assets/index-DiOP5IWe.css`), và DOM runtime của https://airport-simulator.vercel.app/  
> **Mục tiêu**: Trích xuất chính xác 100% BEHAVIOR logic, tham số động học, cơ chế Follow-the-Green phân đoạn (segmented active edge), an toàn khoảng cách và 7 preset scenarios để áp dụng lên Graph V2 (162 nodes / 166 edges / nền `/anhtren.png`).

---

## 1. Route Acceptance Flow & State Machine

### 1.1 Khởi tạo & Chấp nhận tuyến đường
- **Trạng thái ban đầu**:
  - Tàu bay ở trạng thái `PARKED` (hoặc `waiting` khi vừa khởi tạo).
  - Tốc độ: `0 kts`, `progressOnEdge: 0`, `currentEdgeId: null`, `routeEdgeIndex: 0`.
  - Tuyến đường `assignedRoute` được tính toán bằng thuật toán Dijkstra từ `startNodeId` đến `destinationNodeId`.
  - Chưa bấm "Chấp nhận tuyến đường" (`routeStatus === 'pending'`): Hệ thống **không** bật đèn xanh guidance trên mặt sân.
- **Khi bấm "Chấp nhận tuyến đường" (`acceptRoute`)**:
  - `routeStatus` chuyển sang `'accepted'`.
  - Tàu bay chuyển sang sẵn sàng lăn bánh.
  - Guidance Follow-the-Green được kích hoạt cho **cạnh đầu tiên** (`routeEdgeIndex = 0`).
- **Khi bấm "Bắt đầu lăn bánh" (`startTaxi`)**:
  - `isRunning` chuyển sang `true`, `isPaused` chuyển sang `false`.
  - Tàu bay chuyển trạng thái sang `TAXIING` (hoặc `waiting` nếu chưa đến thời điểm `releaseAtSeconds`).
  - Động cơ hoạt họa `requestAnimationFrame` bắt đầu cập nhật `progressOnEdge` theo `dt`.

---

## 2. Follow-the-Green: Cơ Chế Phân Đoạn Từng Cạnh (Segmented Active Guidance)

Quy tắc Follow-the-Green hoạt động theo cơ chế dẫn hướng phân đoạn từng cạnh (Segmented Single Active Edge), **tuyệt đối không bật xanh toàn bộ tuyến hay vẽ hiệu ứng đèn pin**:

### 2.1 Trạng thái các cạnh trên tuyến đường:
1. **Edge hiện tại (`active edge`)**:
   - Chỉ các bóng đèn có tọa độ **phía trước mũi máy bay** ($r \ge \text{progressOnEdge}$) mới được hiển thị sáng xanh.
   - Các bóng đèn nằm sau đuôi máy bay ($r < \text{progressOnEdge}$) **tắt hoàn toàn** (`off`).
2. **Edge kế tiếp (`preview lookahead`)**:
   - Khi $\text{progressOnEdge} < 0.75$: Edge kế tiếp hoàn toàn **tắt** (`off`).
   - Khi $\text{progressOnEdge} \ge 0.75$ (máy bay tiếp cận cuối đoạn): Chỉ bật **vài bóng đầu tiên** (hoặc 25% chiều dài đầu tiên) của edge kế tiếp để làm dấu đón đầu. Tuyệt đối **không** bật toàn bộ edge kế tiếp.
3. **Các edge xa hơn phía trước**:
   - Luôn ở trạng thái tắt hoàn toàn (`off`).
4. **Khi máy bay vượt qua node chuyển tiếp**:
   - Edge cũ chuyển sang **tắt hoàn toàn** (`off`).
   - Edge kế tiếp trở thành **active edge duy nhất**.
   - Bắt đầu lại guidance từ đầu edge mới (trước mũi tàu bay).
5. **Ràng buộc duy nhất**:
   - Không bao giờ có nhiều hơn 1 active guidance edge hoàn chỉnh tại một thời điểm.
   - Không vẽ dải polyline xanh liên tục xuyên suốt qua nhiều cạnh.
   - Không áp dụng tỷ lệ lookahead giả định 60% cho toàn bộ tuyến.

### 2.2 Cấu trúc đồ họa SVG của bóng đèn dẫn đường (`function ot`):
- **Khoảng cách bố trí**: Cứ mỗi `16 pixel` (tương đương mét quy đổi trên đồ thị) đặt 1 bóng đèn.
  - `dotCount = Math.max(1, Math.round(edgePixelLength / 16))`.
  - Tọa độ bóng đèn: nội suy tuyến tính $r = \text{index} / \text{dotCount}$.
- **Cấu trúc SVG 3 lớp (Concentric Circles)**:
  1. Vòng ngoài cùng: $r = 6.5$, fill bằng `url(#lead-green)` (radial gradient `#4ade80` $\rightarrow$ `#22c55e` $\rightarrow$ `#15803d`).
  2. Vòng giữa: $r = 3.0$, fill `#22c55e`.
  3. Lõi tâm: $r = 1.3$, fill `#f0fff6` (trắng ngọc phát quang).
  4. Bộ lọc hiệu ứng: `filter="url(#glow-green)"` với `feGaussianBlur stdDeviation="3"`.
  5. Class CSS: `.guidance-dot`.

---

## 3. Tách Biệt Động Học & Xử Lý An Toàn Tỷ Lệ Pixel (`pixelScale`)

Không dùng trực tiếp $0.5144$ cho pixel mà tách bạch an toàn:
1. **Tốc độ thực tế**:
   $$\text{speedMetersPerSecond} = \text{speedKts} \times 0.5144$$
2. **Độ dài pixel của cạnh (`edgePixelLength`)**:
   - Nếu cạnh có dữ liệu toạ độ cong (`raw trace` / `geometry points`): Tính tổng độ dài các phân đoạn đường gấp khúc của trace:
     $$\text{edgePixelLength} = \sum_{i=1}^{k} \sqrt{(x_i - x_{i-1})^2 + (y_i - y_{i-1})^2}$$
   - Nếu là cạnh thẳng:
     $$\text{edgePixelLength} = \sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}$$
3. **Tỷ lệ pixel trên mét an toàn (`safePixelScale`)**:
   $$\text{pixelScale} = \begin{cases} \dfrac{\text{edgePixelLength}}{\text{edge.lengthMeters}} & \text{khi } \text{edge.lengthMeters} > 0 \\ 1 & \text{khi } \text{edge.lengthMeters} \le 0 \end{cases}$$
4. **Quãng đường di chuyển trong khoảng thời gian $\Delta t$**:
   $$\text{meterDistance} = \text{speedMetersPerSecond} \times \Delta t$$
   $$\text{pixelDistance} = \text{meterDistance} \times \text{pixelScale}$$
   $$\Delta p = \begin{cases} \dfrac{\text{meterDistance}}{\text{edge.lengthMeters}} & \text{khi } \text{edge.lengthMeters} > 0 \\ 1 & \text{khi } \text{edge.lengthMeters} \le 0 \end{cases}$$
5. **Góc quay mũi máy bay (Heading)**:
   $$\text{heading} = \text{atan2}(y_B - y_A, x_B - x_A) \times \frac{180}{\pi} + 90^\circ$$

---

## 4. Tham Số An Toàn & Khoảng Cách Tránh Va Chạm (Separation Constants Trích Xuất)

Các hằng số trích xuất trực tiếp từ mã nguồn website cũ:
- `_n = 28`: Khoảng cách an toàn tiêu chuẩn giữa 2 máy bay trên đường lăn ($28\text{m}$).
- `vn = 36`: Khoảng cách an toàn tại khu vực sân đỗ/gate ($36\text{m}$).
- `hn = 14`: Độ lệch tim đường ngang cho phép ($14\text{m}$).
- `Zn = 34`: Bán kính giải phóng tĩnh tại vị trí đỗ ($34\text{m}$).
- `gn = 4.0\text{s}`: Thời gian giữ ưu tiên trước khi cho phép giải tỏa cưỡng bức nếu bế tắc.
- `Yn = 20.0\text{s}`: Thời gian cooldown tối thiểu giữa 2 lần reroute liên tiếp.
- `Xn = 12.0\text{s}`: Thời gian giữ sau khi tàu bay đến điểm chờ cất cánh trước khi chuyển trạng thái `DEPARTED`.
- `yn = 30.0\text{s}`: Thời gian giữ tối đa trước khi kích hoạt né tránh xung đột.

---

## 5. Chuẩn Hóa 7 Kịch Bản Mẫu (Preset Scenarios)

| Thứ tự | Mã Kịch Bản (ID) | Tiêu Đề | Số Máy Bay | Thời Tiết | Triggers & Expected Logs |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | `emergency_priority` | Tàu bay khẩn nguy được ưu tiên tuyệt đối | 5 | Fog | VN9999 (Mayday, priority: 0) đi thẳng, các tàu bay khác nhường đường bằng Stop Bar đỏ. |
| **2** | `lvc_intersection_conflict` | Hai tàu bay cùng tiến vào một nút giao trong LVC | 2 | Fog | VN302 dừng trước Stop Bar nhường VN301 đi qua giao điểm trước. |
| **3** | `taxiway_closure` | Đường lăn bị đóng đột xuất | 4 | Clear | Tại giây 60 đóng đường lăn chung $\rightarrow$ kích hoạt Dijkstra reroute 4 tàu bay. |
| **4** | `peak_hour_lvc` | Giờ cao điểm kết hợp LVC | 12 | Fog | 5 arriving, 5 departing, 2 pushback xếp hàng tuần tự theo releaseAtSeconds. |
| **5** | `wrong_route_deviation` | Tàu bay taxi sai tuyến trong LVC | 2 | Fog | VN801 rẽ sai $\rightarrow$ cảnh báo cam nhấp nháy, dừng khẩn $\rightarrow$ cấp lại lộ trình an toàn sau 4s. |
| **6** | `radio_failure` | Mất liên lạc vô tuyến (Radio Failure) | 2 | Fog | Tại giây 50 VN901 mất sóng (nhãn MẤT LIÊN LẠC), FtG dẫn đường tự động bằng đèn. |
| **7** | `runway_change` | Chuyển đổi đường cất hạ cánh đang khai thác | 6 | Clear | Tại giây 75 đổi hướng từ đầu 07 sang đầu 25, 3 tàu bay quay đầu cùng lúc. |

---

## 6. Chế Độ Điều Khiển Thủ Công (Manual Control)

- **6 máy bay đỗ cố định**: `P1`, `P2`, `P3`, `P4`, `P5`, `T49`.
- **Trạng thái ban đầu**: Toàn bộ `PARKED`.
- **Độc lập tuyệt đối**: Chọn máy bay nào chỉ máy bay đó hiển thị điều khiển; chạy hoặc reset 1 máy bay không ảnh hưởng máy bay khác.
- **Guidance**: Chỉ hiển thị khi máy bay được chọn và đã chấp nhận lộ trình.

---

## 7. Ràng Buộc Bắt Buộc Khi Chạy Trên Graph V2
Mỗi bài chạy mô phỏng phải log đúng format:
```text
GRAPH_SELECTED: v2
GRAPH_NAME: Sân bay TSN (v2)
NODES: 162
EDGES: 166
BACKGROUND: /anhtren.png
```
Tuyệt đối không can thiệp thay đổi danh sách node ID, edge ID hay topology của Graph V2.
