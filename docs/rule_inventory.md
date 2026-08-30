# RULE INVENTORY — DANH MỤC QUY TẮC VÀ THAM SỐ TOÀN DỰ ÁN

Danh mục toàn bộ các quy tắc điều phối, ngưỡng khoảng cách, tốc độ, bộ đếm thời gian và logic xử lý an toàn được trích xuất trực tiếp từ mã nguồn simulator.

---

## Bảng danh mục quy tắc (Rule Inventory)

| Rule ID | Code Location | Điều kiện hiện tại (Current Condition) | Hành vi / Tác động trong Engine | Giá trị số (Numeric Value) | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SURFACE_STOPBAR_001` | `scenarioRunner.ts:494` | `ac.holdReason === 'stop-bar' && ac.status === 'holding'` | Stop Bar hiển thị ĐỎ, máy bay dừng $v = 0$ trước vạch dừng đường băng | $v = 0	ext{ kts}$ | Nghiêm cấm vượt vạch dừng đường băng khi đèn đỏ đang sáng. |
| `SURFACE_RUNWAY_OCC_001` | `scenarioRunner.ts:563` | `runwayOccupancy[NORTH/SOUTH] !== null` | Độc quyền chiếm dụng đường băng: từ chối cấp phép vào đường băng cho tàu thứ hai | 1 aircraft / RWY | Bảo vệ chống xâm nhập đường băng (Runway Incursion Protection). |
| `SURFACE_SEPARATION_001`| `scenarioRunner.ts:21` | Tàu bay lăn nối đuôi trên đường lăn | Tàu sau giảm tốc hoặc dừng khi cự ly $\le 	ext{SEPARATION\_TAXIWAY\_M}$ | $28	ext{ m}$ ($9.33	ext{ px}$) | Khoảng cách đệm an toàn dọc trục tim đường lăn giữa 2 tàu bay. |
| `SURFACE_SEPARATION_002`| `scenarioRunner.ts:22` | Tàu bay di chuyển trong khu vực sân đỗ (Apron Taxilane)| Tàu sau duy trì cự ly an toàn sân đỗ | $36	ext{ m}$ ($12.0	ext{ px}$) | Khoảng cách an toàn dãn cách trong khu vực sân đỗ (Apron). |
| `SURFACE_STAND_CLEAR_001`| `scenarioRunner.ts:25`| Tàu bay chuẩn bị khởi hành từ bến đỗ | Chờ khu vực lân cận bến đỗ không có tàu khác đang lăn | $34	ext{ m}$ ($11.33	ext{ px}$) | Bán kính an toàn giải phóng bến đỗ trước khi tàu đẩy/lăn ra. |
| `SPEED_TAXI_BASE_001` | `scenarioRunner.ts:29` | Tàu bay lăn bình thường trên đường lăn chính | Tốc độ lăn tiêu chuẩn của simulator | $15	ext{ kts}$ | Tốc độ lăn chuẩn trên đường lăn thẳng trong điều kiện bình thường. |
| `SPEED_APRON_001` | `scenarioRunner.ts:30` | Tàu bay lăn trong khu vực sân đỗ (Apron/Stand) | Giới hạn tốc độ lăn khu vực sân đỗ | $7	ext{ kts}$ | Giới hạn tốc độ khu vực bến đỗ đông đúc nhân viên và thiết bị mặt đất. |
| `SPEED_JUNCTION_001` | `scenarioRunner.ts:31` | Tàu bay tiếp cận nút giao hoặc vạch dừng | Giảm tốc độ khi chuẩn bị rẽ hoặc dừng | $5	ext{ kts}$ | Tốc độ tiếp cận nút giao an toàn. |
| `FTG_LOOKAHEAD_001` | `scenarioRunner.ts:490` | Tàu bay có lộ trình được cấp phép và đã khóa block | Bật đèn tâm xanh Follow-the-Green phía trước tàu | $2 - 3	ext{ edges}$ | Cửa sổ dẫn đường động trước đầu mũi tàu bay. |
| `FTG_TRAILING_OFF_001`| `scenarioRunner.ts:489`| Tàu bay đã lăn qua các đoạn đường phía sau | Tắt đèn xanh phía sau đuôi tàu | $0	ext{ segments}$ | Tắt đèn xanh phía sau để tránh gây hiểu lầm cho tàu bay khác. |
| `FTG_STOPBAR_LINK_001`| `scenarioRunner.ts:495`| Đoạn đường giao cắt với đường băng hoặc Stop Bar | Đèn Stop Bar ĐỎ ghi đè lên đèn FtG | Đèn ĐỎ sáng | Khóa liên động giữa Stop Bar và đèn dẫn hướng tim đường lăn. |
| `RES_BLOCK_LOCK_001` | `ReservationManager.ts:45`| Tàu bay di chuyển trên lộ trình | Khóa độc quyền đoạn block đường lăn (Exclusive Block Locking) | $1	ext{ Owner / Block}$ | Cơ chế loại trừ lẫn nhau ngăn xung đột cùng làn và đối đầu. |
| `CONFLICT_HEADON_001` | `ConflictEngine.ts:50` | 2 tàu bay di chuyển ngược chiều trên cùng corridor | Phát hiện xung đột đối đầu, dừng tàu ưu tiên thấp hơn | Khoảng cách $< 100	ext{m}$ | Ngăn ngừa kẹt cứng đối đầu trên đường lăn hai chiều. |
| `EMERGENCY_PRIO_001` | `ConflictEngine.ts:98` | Tàu bay có cờ `role = 'emergency'` | Được ưu tiên cấp quyền khóa đường lăn trước tàu bình thường | `priority = 1` | Ưu tiên phân luồng cho phương tiện khẩn nguy khẩn cấp. |
| `EVENT_FOD_BLOCK_001` | `EventEffects.ts:45` | Phát hiện vật thể lạ (FOD) trên mặt đường lăn | Thu hồi reservation, đưa cạnh vào `edgeBlockers`, FtG ĐỎ/TẮT | $20	ext{s}$ cleanup | Bảo vệ an toàn khu bay khi mặt đường bị nhiễm bẩn/chướng ngại vật. |
| `EVENT_RADIO_FAIL_001`| `EventEffects.ts:55` | Sự cố mất liên lạc thoại vô tuyến | Đặt `radioFailure = true`, dựa vào đèn dẫn đường FtG & Stop Bar | $30	ext{s}$ recovery | Quy trình vận hành khi mất liên lạc vô tuyến mặt đất. |
| `EVENT_WRONG_TURN_001`| `EventEffects.ts:25` | Phi công rẽ nhầm nhánh tại nút giao | Tàu lệch lộ trình (`deviated = true`), dừng lại chờ cấp lại route | $12	ext{s}$ recovery | Mô hình hóa sai lệch tổ lái do giảm tầm nhìn. |
| `EVENT_DISABLED_001` | `EventEffects.ts:65` | Tàu bay gặp trục trặc kỹ thuật chết máy | $v = 0$, biến vị trí dừng thành vật cản bị khóa trong `edgeBlockers` | $25	ext{s}$ tow time | Xử lý chướng ngại vật tàu bay hỏng hóc trên hệ thống đường lăn. |
| `RWY_CONFIG_25_07_001` | `RunwayOperatingConfig.ts:15`| Khai thác song song 25L/25R hoặc 07L/07R | Chỉ định đường băng cất cánh và hạ cánh theo hướng gió | $250^\circ / 070^\circ$ | Cấu hình khai thác hướng cất/hạ cánh tại Cảng HKQT Tân Sơn Nhất. |
