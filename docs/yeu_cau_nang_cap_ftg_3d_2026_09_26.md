## YÊU CẦU NÂNG CẤP HỆ THỐNG FTG 3D

Mục tiêu của phần nâng cấp này là làm cho hệ thống **3D liên kết chặt chẽ với hệ thống 2D hiện có**, cả về giao diện, dữ liệu, huấn lệnh, trạng thái tàu bay, hệ thống đèn và quy trình khai thác. Phiên bản 3D không được hoạt động như một module riêng biệt mà phải được xem như **phiên bản trực quan hóa 3D của hệ thống 2D**.

### 1. Đồng bộ giao diện 2D và 3D

Hệ thống nút bấm, thanh điều khiển, bảng chức năng và màu sắc của màn hình 3D cần được thiết kế đồng bộ với giao diện của trang 2D.

Sử dụng **bảng màu, phong cách nút, trạng thái active/inactive, icon và cách bố trí điều khiển của trang 2D** làm ngôn ngữ thiết kế chính cho trang 3D.

Không thiết kế giao diện 3D theo một phong cách hoàn toàn khác khiến người dùng có cảm giác đang sử dụng hai hệ thống riêng biệt.

Có thể cải tiến UI/UX cho hiện đại và đẹp hơn, nhưng phải giữ được nhận diện chung của hệ thống 2D.

---

### 2. Xây dựng phòng KSVKL bên trong Tower

Toàn bộ khu vực làm việc của **Kiểm soát viên không lưu (KSVKL)** trong chế độ 3D phải được đặt bên trong **tháp kiểm soát không lưu (ATC Tower)** đã xây dựng.

Khi chuyển vào chế độ Tower View, người dùng cần có cảm giác mình đang thực sự ngồi bên trong phòng kiểm soát.

Góc nhìn mặc định có thể đặt ở vị trí người KSVKL đang ngồi tại bàn điều khiển.

Từ bên trong phòng phải quan sát được:

- sân đỗ;
- các stand;
- taxiway;
- runway;
- tàu bay;
- hệ thống đèn FTG;
- stopbar;
- các hoạt động bên ngoài sân bay.

Các cửa kính của Tower phải cho phép nhìn trực tiếp ra khu vực sân bay.

Trong phòng cần bố trí:

- bàn điều khiển;
- ghế KSVKL;
- máy tính/màn hình nghiệp vụ;
- microphone/bộ đàm;
- các bảng giám sát;
- thiết bị điều khiển;
- hai nhân vật KSVKL đang làm việc.

Các thành phần này phải có liên kết tương tác với nhau.

Ví dụ: khi người dùng bấm vào màn hình hoặc laptop trên bàn điều khiển, hệ thống có thể mở giao diện nghiệp vụ tương ứng hoặc chuyển camera đến vị trí làm việc của KSVKL.

---

### 3. Thiết kế màn hình GND và TWR

Không cần xây dựng một giao diện laptop hoàn toàn khác với hệ thống hiện tại.

Các màn hình nghiệp vụ trong Tower nên hiển thị **phiên bản thu nhỏ của hệ thống 2D hiện có**.

Có hai vị trí KSVKL chính:

**GND – Ground Control**

KSVKL GND chịu trách nhiệm giám sát và điều phối tàu bay trên khu vực mặt đất liên quan, ví dụ:

- apron;
- taxiway;
- quá trình pushback;
- taxi;
- di chuyển từ stand ra khu vực runway theo phạm vi mô phỏng.

**TWR – Tower Control**

KSVKL TWR phụ trách các hoạt động liên quan đến runway, chẳng hạn:

- cho phép vào runway;
- cất cánh;
- hạ cánh;
- giám sát tàu bay trên khu vực runway.

Mỗi màn hình GND/TWR phải lấy dữ liệu trực tiếp từ hệ thống 2D thay vì tạo ra dữ liệu riêng.

---

### 4. Trực quan hóa huấn lệnh KSVKL và liên lạc Pilot – ATC

Trong phiên bản 2D hiện tại đã có hệ thống huấn lệnh giữa tàu bay và KSVKL.

Ở phiên bản 3D cần trực quan hóa quá trình này giống một cuộc trao đổi qua radio.

Khi phi công gửi yêu cầu, ví dụ:

- xin pushback;
- xin taxi;
- xin vào đường cất hạ cánh;
- xin cất cánh;
- xin hạ cánh;

thì trong môi trường 3D phải xuất hiện **khung hội thoại/radio message** thể hiện lời nói của phi công.

Sau đó KSVKL phản hồi bằng chính huấn lệnh được sinh ra từ hệ thống 2D.

Có thể thể hiện bằng dạng:

**Pilot → ATC**

Khung thoại xuất hiện gần tàu bay hoặc khu vực giao diện liên lạc.

**ATC → Pilot**

Khi KSVKL trả lời, khung thoại xuất hiện tại vị trí KSVKL đang sử dụng microphone/bộ đàm.

KSVKL có animation cầm hoặc thao tác với microphone khi phát huấn lệnh.

Nội dung trao đổi trong 3D **phải đồng bộ với logic huấn lệnh của hệ thống 2D**, không tự sinh một luồng nghiệp vụ khác.

---

### 5. Hoàn thiện hệ thống đèn FTG

Hệ thống FTG trong 3D phải tuân theo logic hoạt động của FTG trong hệ thống 2D.

Cần kiểm tra lại:

- khoảng cách các đèn xanh xuất hiện phía trước mũi tàu bay;
- số lượng đèn cần hiển thị;
- hướng dẫn đường đi theo route;
- thời điểm bật đèn;
- thời điểm tắt đèn.

Đặc biệt, khi tàu bay đã đi qua một đoạn FTG thì **các đèn phía sau tàu bay phải tự động tắt**, thay vì toàn bộ tuyến đường vẫn sáng.

Hiệu ứng ánh sáng phải đủ rõ để người dùng có thể quan sát từ:

- Tower;
- góc nhìn sân bay;
- góc nhìn gần tàu bay.

Không tự ý đặt một khoảng cách cố định nếu chưa xác định được logic/tiêu chuẩn đang áp dụng. Phần khoảng cách cần được cấu hình để có thể hiệu chỉnh theo requirement hoặc tiêu chuẩn sử dụng cho mô phỏng.

---

### 6. Bổ sung Stopbar

Hiện tại hệ thống 3D chưa thể hiện Stopbar đầy đủ.

Cần dựa trên hệ thống 2D để đặt các **dãy đèn đỏ Stopbar chắn ngang taxiway** tại đúng vị trí tương ứng.

Stopbar phải:

- nằm ngang mặt đường;
- không nổi khỏi bề mặt taxiway;
- phát sáng đỏ rõ ràng;
- có trạng thái ON/OFF;
- đồng bộ với trạng thái bên hệ thống 2D.

Khi tàu bay chưa được phép đi qua, Stopbar phải bật.

Khi nhận được huấn lệnh cho phép và điều kiện hệ thống thỏa mãn, Stopbar mới chuyển trạng thái phù hợp.

---

### 7. Nâng cấp Aircraft Stand

Các vị trí đỗ tàu bay hiện tại còn đơn giản và thiếu chi tiết.

Cần nâng cấp stand để giống sân bay thực tế hơn, bao gồm:

- stand marking;
- centerline;
- stop position;
- số hiệu stand;
- các ký hiệu mặt sân;
- vùng giới hạn tàu bay;
- đường dẫn tàu bay vào stand;
- texture mặt apron.

Các đường marking phải nằm sát bề mặt sân, không được nổi lên như vật thể 3D.

Không thay đổi vị trí các stand hiện tại nếu không có yêu cầu.

---

### 8. Mô phỏng cất cánh và hạ cánh

Tàu bay trong phiên bản 3D phải có khả năng **cất cánh và hạ cánh thực sự trong không gian 3D**, thay vì chỉ chạy trên mặt đất.

#### Cất cánh

Luồng hoạt động:

Stand → Pushback → Taxi → Holding Point → Runway → Takeoff.

Khi tàu bay chạy trên runway và đạt đến vị trí/tốc độ cất cánh được hệ thống mô phỏng xác định:

- tàu bay bắt đầu rotate;
- mũi tàu bay nâng lên;
- main gear rời runway;
- tàu bay tăng độ cao;
- tiếp tục bay theo hướng departure;
- sau khi ra khỏi phạm vi mô phỏng có thể được loại khỏi scene.

Có thể giữ logic đơn giản hóa tương tự hệ thống 2D hiện tại, chẳng hạn tàu bay chạy khoảng một phần của runway trước khi bắt đầu cất cánh, nhưng animation 3D phải tự nhiên hơn.

#### Hạ cánh

Luồng ngược lại:

Approach → Final → Touchdown → Deceleration → Vacate Runway → Taxi → Stand.

Tàu bay phải:

- xuất hiện từ trên không;
- giảm độ cao;
- tiếp cận runway;
- flare trước touchdown;
- chạm bánh xuống runway;
- giảm tốc;
- rời runway;
- taxi về stand.

Mục tiêu là mô phỏng trực quan hợp lý dựa trên quy trình khai thác hàng không, không cần xây dựng flight dynamics simulator hoàn chỉnh.

---

### 9. Bổ sung hệ thống điều khiển thủ công trong 3D

Trang 3D phải có **Manual Control System** tương tự trang 2D.

Người dùng có thể tạo và điều khiển một chuyến bay thủ công với các thông tin như:

- Aircraft ID/Callsign;
- loại tàu bay;
- điểm xuất phát;
- điểm đến;
- stand;
- runway;
- route;
- trạng thái chuyến bay.

Hệ thống phải hỗ trợ đầy đủ vòng đời cơ bản:

Spawn → Stand → Pushback → Taxi → Runway → Takeoff → Flight

và:

Flight → Approach → Landing → Taxi → Stand.

Không được giới hạn hệ thống thủ công chỉ ở việc di chuyển tàu bay trên mặt đất.

---

### 10. Nâng cấp tổng thể UI/UX và môi trường sân bay

Mục tiêu của sản phẩm là tạo một hệ thống có chất lượng trình bày cao, đủ khả năng sử dụng trong **demo, nghiên cứu khoa học hoặc cuộc thi**.

Do đó cần nâng cấp tổng thể UI/UX của môi trường 3D.

Có thể bổ sung:

- nhân viên sân bay;
- KSVKL;
- ground staff;
- xe dịch vụ mặt đất;
- pushback tug;
- GPU;
- baggage cart;
- xe follow-me;
- thiết bị sân đỗ;
- biển báo;
- lighting;
- vật liệu;
- reflection;
- glass;
- environment effects;
- animation.

Tuy nhiên có một nguyên tắc bắt buộc:

**Không được thay đổi hoặc làm sai cấu trúc sân bay hiện tại.**

Không được tự ý:

- di chuyển taxiway;
- thay đổi runway;
- thay đổi stand;
- thay đổi yellow line;
- thay đổi FTG route;
- thay đổi stopbar;
- đặt vật thể chắn đường tàu bay.

Các vật thể trang trí hoặc phương tiện phải được bố trí ở khu vực phù hợp và không ảnh hưởng đến hoạt động khai thác.

Ngoài ra nên xây dựng một **Environment/Scene Settings Panel** để người dùng có thể bật/tắt hoặc điều chỉnh:

- con người;
- xe mặt đất;
- thiết bị sân đỗ;
- mật độ vật thể;
- chất lượng graphics;
- lighting;
- shadow;
- reflection;
- hiệu ứng môi trường.

Như vậy có thể vừa trình diễn phiên bản đẹp nhất, vừa giảm tải khi cần chạy trên máy yếu hơn.

---

### 11. Phân biệt 6 tàu bay bằng màu sắc

Sáu tàu bay hiện tại không được sử dụng cùng một màu.

Cần đồng bộ với hệ thống 2D và gán **6 màu sắc khác nhau cho 6 tàu bay** để người dùng dễ phân biệt và theo dõi.

Màu của từng tàu bay phải được giữ nhất quán giữa:

**Aircraft trên 2D ↔ Aircraft trong 3D ↔ Callsign ↔ Flight information ↔ Radio/command information.**

Nếu Aircraft 01 có một màu nhận diện trên bản đồ 2D thì Aircraft 01 trong môi trường 3D cũng phải sử dụng màu nhận diện tương ứng.

---

## YÊU CẦU LIÊN KẾT HỆ THỐNG

Điểm quan trọng nhất là:

**2D không phải một hệ thống và 3D là một hệ thống khác.**

Hai giao diện phải sử dụng **cùng một trạng thái mô phỏng (Shared Simulation State).**

Ví dụ khi tàu bay A01 đang taxi từ Stand 01 đến Runway:

**2D Map**
→ cập nhật vị trí A01  
→ cập nhật FTG  
→ cập nhật Stopbar  
→ cập nhật trạng thái chuyến bay

đồng thời:

**3D World**
→ Aircraft A01 di chuyển  
→ FTG tương ứng sáng/tắt  
→ Stopbar thay đổi  
→ KSVKL theo dõi  
→ radio message xuất hiện.

Tương tự, khi KSVKL phát huấn lệnh từ Tower 3D thì trạng thái đó cũng phải được cập nhật ngược lại cho hệ thống 2D.

Kiến trúc mong muốn:

**Simulation Core**

↓  

**Aircraft State**

**ATC Command State**

**FTG State**

**Stopbar State**

**Flight State**

**Airport State**

↓ ↓

**2D Visualization** ↔ **3D Visualization**

Cả hai giao diện chỉ là hai cách khác nhau để quan sát và điều khiển **cùng một hệ thống mô phỏng**.

---

## NGUYÊN TẮC KHI CHỈNH SỬA

Ưu tiên cao nhất là giữ nguyên chính xác layout sân bay hiện tại.

Không tự ý xây dựng lại airport map.

Không thay đổi các vị trí đã đúng chỉ để làm cảnh đẹp hơn.

Khi bổ sung vật thể mới phải kiểm tra chúng không giao nhau với aircraft route.

Tách hệ thống thành nhiều module/component nhỏ, tránh viết toàn bộ logic vào một file lớn.

Ưu tiên tái sử dụng logic từ hệ thống 2D thay vì viết lại một bộ logic riêng cho 3D.

Mọi animation 3D phải phản ánh trạng thái thật của Simulation Core.

Mục tiêu cuối cùng là tạo cảm giác:

**Người dùng có thể quan sát hệ thống từ bản đồ điều hành 2D, sau đó bước trực tiếp vào Tower và nhìn thấy chính hoạt động đó đang diễn ra ngoài sân bay trong môi trường 3D.**