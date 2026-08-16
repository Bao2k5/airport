// Modal Hướng Dẫn Sử Dụng — Chuẩn nhận diện Học viện Hàng không Việt Nam (VAA).

import { useEffect, type ReactNode } from 'react';

interface Props {
  onClose: () => void;
}

export default function HuongDanModal({ onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-[#E6ECF0] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#172033]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D254C] text-white flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Hướng dẫn sử dụng hệ thống</h2>
            <p className="text-xs text-[#CBD5E1] mt-0.5">
              Học viện Hàng không Việt Nam — Mô phỏng di chuyển mặt đất (Follow-the-Green)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition text-2xl leading-none px-2 cursor-pointer"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 text-sm text-[#334155]">
          {/* Section 1 */}
          <Section title="1. Giới thiệu tổng quan">
            <p>
              Đây là hệ thống <strong className="text-[#0D254C]">mô phỏng di chuyển mặt đất sân bay</strong> phục vụ đào tạo và nghiên cứu. Hệ thống mô phỏng công nghệ <strong className="text-[#16845B]">Đèn Dẫn Đường Xanh (Follow-the-Green / A-SMGCS)</strong> — giải pháp dẫn dắt tàu bay trực quan theo tuyến lăn được kiểm soát viên không lưu cấp phép.
            </p>
            <Alert type="warning">
              Hệ thống dùng cho mục đích học thuật và mô phỏng giáo dục. Không sử dụng trong điều hành bay thực tế.
            </Alert>
          </Section>

          {/* Section 2 */}
          <Section title="2. Quy trình thao tác">
            <ol className="flex flex-col gap-2 list-none">
              <StepItem n={1} title="Chọn tàu bay & Tuyến lăn">
                Trong bảng <em>Điều khiển</em>, chọn 1 trong 6 tàu bay, cấu hình <strong className="text-[#0D254C]">Điểm xuất phát</strong> và <strong className="text-[#0D254C]">Điểm đến</strong>.
              </StepItem>
              <StepItem n={2} title="Thiết lập môi trường & Tốc độ">
                Tùy chỉnh thời tiết, thời điểm và tốc độ lăn bánh chuẩn (3–30 knot).
              </StepItem>
              <StepItem n={3} title="Chấp thuận tuyến & Khởi chạy">
                Nhấn <strong className="text-[#1C67DA]">Chấp nhận tuyến</strong> rồi nhấn <strong className="text-[#16845B]">Cho lăn bánh</strong> để bắt đầu.
              </StepItem>
              <StepItem n={4} title="Thực hành xử lý sự cố">
                Tạo sự cố đường lăn hoặc chuyển sang tab <strong className="text-[#0D254C]">Kịch bản mẫu</strong> để quan sát 7 tình huống điều phối phức tạp.
              </StepItem>
            </ol>
          </Section>

          {/* Section 3 */}
          <Section title="3. Hệ thống đèn tín hiệu (Follow-the-Green)">
            <div className="flex flex-col gap-2">
              <LightBadge color="bg-[#16845B]" label="Xanh lá — Đoạn đường thông thoáng">
                Các đoạn đường phía trước máy bay được cấp phép lăn bánh an toàn.
              </LightBadge>
              <LightBadge color="bg-[#D32F2F]" label="Đỏ — Vạch dừng (Stop Bar) / Chướng ngại vật">
                Vạch dừng kích hoạt, cấm tàu bay vượt qua cho đến khi được cấp phép tiếp.
              </LightBadge>
              <LightBadge color="bg-[#94A3B8]" label="Tắt — Ngoài tuyến cấp phép">
                Các đoạn đường lăn không nằm trong lộ trình đã phân bổ.
              </LightBadge>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-[#E6ECF0] bg-[#F8FAFC] flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-[#0D254C] hover:bg-[#173A73] text-white text-sm font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-sm"
          >
            Đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wider font-bold text-[#0D254C] border-b border-[#E6ECF0] pb-1">{title}</h3>
      {children}
    </div>
  );
}

function Alert({ children }: { type?: 'warning' | 'info'; children: ReactNode }) {
  return (
    <div className="p-3 rounded-xl border bg-[#FFFBEB] border-[#FCD34D] text-[#92400E] text-xs leading-relaxed">
      {children}
    </div>
  );
}

function StepItem({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
      <span className="w-5 h-5 rounded-full bg-[#0D254C] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <div className="flex flex-col gap-0.5">
        <strong className="text-[#0D254C] text-xs">{title}</strong>
        <span className="text-xs text-[#475569]">{children}</span>
      </div>
    </li>
  );
}

function LightBadge({ color, label, children }: { color: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${color}`} />
      <div className="flex flex-col">
        <strong className="text-xs text-[#172033]">{label}</strong>
        <span className="text-xs text-[#64748B]">{children}</span>
      </div>
    </div>
  );
}
