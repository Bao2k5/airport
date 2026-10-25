// Cấu hình nhận diện thương hiệu (tên trường / logo trường).
//
// Mặc định ĐANG ẨN tên + logo trường để tuân thủ quy định Bán kết Euréka 2026
// (không đưa tên trường hoặc logo trường vào phần mềm/demo).
//
// Cách khôi phục sau cuộc thi (chọn 1 trong 2):
//   1. Tạo file `.env.local` ở thư mục airport-simulator với nội dung:
//        VITE_SHOW_SCHOOL_BRANDING=true
//      rồi chạy lại `npm run dev` / `npm run build`.
//   2. Hoặc sửa trực tiếp hằng số HIDE_SCHOOL_BRANDING bên dưới thành `false`.
// Lưu ý: favicon / tiêu đề tab nằm trong index.html (xem chú thích trong file đó).

export const HIDE_SCHOOL_BRANDING: boolean = import.meta.env.VITE_SHOW_SCHOOL_BRANDING !== 'true';

// Mỗi chuỗi: HIDE_SCHOOL_BRANDING ? <bản trung tính> : <bản có tên trường>.
// Viết dạng ternary trực tiếp để khi build, chuỗi có tên trường bị loại khỏi bundle.

export const BRANDING = {
  appWarningHeader: HIDE_SCHOOL_BRANDING ? 'MÔ PHỎNG GIÁO DỤC (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)' : 'HỌC VIỆN HÀNG KHÔNG VIỆT NAM — MÔ PHỎNG GIÁO DỤC (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)',
  appSubtitle: HIDE_SCHOOL_BRANDING ? 'Hệ thống huấn luyện A-SMGCS & Follow-the-Green' : 'Học viện Hàng không Việt Nam · Hệ thống huấn luyện A-SMGCS & Follow-the-Green',
  guideSubtitle: HIDE_SCHOOL_BRANDING ? 'Mô phỏng di chuyển mặt đất (Follow-the-Green)' : 'Học viện Hàng không Việt Nam — Mô phỏng di chuyển mặt đất (Follow-the-Green)',
  shellWarningHeader: HIDE_SCHOOL_BRANDING ? 'MÔ PHỎNG GIÁO DỤC A-SMGCS (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)' : 'HỌC VIỆN HÀNG KHÔNG VIỆT NAM — MÔ PHỎNG GIÁO DỤC A-SMGCS (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)',
  logoAlt: HIDE_SCHOOL_BRANDING ? 'Biểu tượng ứng dụng' : 'Học viện Hàng không Việt Nam — VAA Logo',
  signName: HIDE_SCHOOL_BRANDING ? 'Biển hiệu mô hình (SGN)' : 'Biển hiệu mô hình VAA (SGN)',
  newSignName: HIDE_SCHOOL_BRANDING ? 'Biển hiệu (SGN)' : 'Biển hiệu VAA (SGN)',
  addSignButton: HIDE_SCHOOL_BRANDING ? '+ Biển hiệu (Sa bàn)' : '+ Biển hiệu VAA (Sa bàn)',
  signColorNavy: HIDE_SCHOOL_BRANDING ? 'Xanh navy' : 'Xanh VAA',
} as const;

/** Ẩn chữ "VAA" trong tên vật thể đã lưu (localStorage) khi đang ẩn nhận diện trường. */
export function neutralizeName(name: string): string {
  return HIDE_SCHOOL_BRANDING ? name.replace(/\s*\bVAA\b/g, '') : name;
}
