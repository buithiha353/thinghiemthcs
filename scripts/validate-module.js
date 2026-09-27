/**
 * validate-module.js
 * Script tự động kiểm tra cấu trúc module thí nghiệm ảo KHTN THCS
 * Cách dùng: node scripts/validate-module.js experiments/<id_bai>.html
 */

import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Lỗi: Vui lòng cung cấp đường dẫn file thí nghiệm HTML.');
  console.log('Ví dụ: node scripts/validate-module.js experiments/vl6-do-chieu-dai.html');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ Lỗi: Không tìm thấy file tại "${filePath}"`);
  process.exit(1);
}

const html = fs.readFileSync(fullPath, 'utf-8');
let errors = [];
let warnings = [];
let passed = [];

console.log(`\n🔍 Đang kiểm tra module thí nghiệm: ${filePath}`);
console.log('='.repeat(60));

// 1. Kiểm tra Doctype và thẻ cơ bản
if (html.includes('<!DOCTYPE html>') && html.includes('<html') && html.includes('</html>')) {
  passed.push('Định dạng tài liệu HTML5 chuẩn');
} else {
  errors.push('Thiếu khai báo <!DOCTYPE html> hoặc cấu trúc HTML chưa đầy đủ');
}

// 2. Kiểm tra manifest nhúng
const manifestRegex = /<script\s+type=["']application\/json["']\s+id=["']manifest["']>([\s\S]*?)<\/script>/i;
const manifestMatch = html.match(manifestRegex);

if (!manifestMatch) {
  errors.push('Thiếu thẻ <script type="application/json" id="manifest"> ở cuối body');
} else {
  try {
    const manifest = JSON.parse(manifestMatch[1].trim());
    const requiredKeys = ['id', 'subject', 'grade', 'title', 'sgk_ref', 'objective', 'controls', 'outputs', 'status'];
    const missingKeys = requiredKeys.filter(k => !(k in manifest));
    
    if (missingKeys.length > 0) {
      errors.push(`Manifest JSON thiếu các trường bắt buộc: ${missingKeys.join(', ')}`);
    } else {
      passed.push(`Manifest JSON hợp lệ (id: "${manifest.id}", status: "${manifest.status}")`);
    }
  } catch (e) {
    errors.push(`Lỗi cú pháp JSON trong manifest: ${e.message}`);
  }
}

// 3. Kiểm tra bàn thực hành SVG #scene
if (html.includes('<svg') && html.includes('id="scene"')) {
  passed.push('Khu vực bàn thực hành chứa SVG #scene');
} else {
  errors.push('Không tìm thấy SVG với id="scene"');
}

// 4. Kiểm tra Direct Manipulation (Pointer Events)
const hasPointerDown = html.includes('pointerdown');
const hasPointerMove = html.includes('pointermove');
const hasPointerUp = html.includes('pointerup');
const hasPointerEvents = hasPointerDown && hasPointerMove && hasPointerUp;

if (hasPointerEvents) {
  passed.push('Có xử lý Pointer Events (pointerdown, pointermove, pointerup) cho thao tác kéo thả trực tiếp');
} else {
  warnings.push('Chưa phát hiện đủ sự kiện Pointer Events (pointerdown/pointermove/pointerup)');
}

// 5. Kiểm tra không dùng ảnh ngoài (anti external asset)
const imgHttpRegex = /<img[^>]+src=["']https?:\/\/(?!fonts\.gstatic\.com)[^"']+["']/gi;
const externalImgMatches = html.match(imgHttpRegex);
if (externalImgMatches) {
  errors.push(`Phát hiện hình ảnh bên ngoài (cần vẽ bằng SVG thuần): ${externalImgMatches.join(', ')}`);
} else {
  passed.push('Không dùng hình ảnh bên ngoài (vẽ bằng SVG thuần)');
}

// 6. Kiểm tra câu hỏi trắc nghiệm nhanh
const quizRegex = /class=["'][^"']*quiz-q[^"']*["']/g;
const quizMatches = html.match(quizRegex);
if (quizMatches && quizMatches.length > 0) {
  passed.push(`Chứa phần kiểm tra nhanh (${quizMatches.length} câu hỏi)`);
} else {
  warnings.push('Chưa có khối câu hỏi kiểm tra nhanh (.quiz-q)');
}

// 7. Báo cáo kết quả
console.log('\n✅ CÁC ĐIỂM ĐẠT:');
passed.forEach(p => console.log(`  ✓ ${p}`));

if (warnings.length > 0) {
  console.log('\n⚠️  CẢNH BÁO (LƯU Ý):');
  warnings.forEach(w => console.log(`  ! ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ CÁC LỖI CẦN SỬA:');
  errors.forEach(e => console.log(`  ✗ ${e}`));
  console.log('='.repeat(60));
  console.log('🔴 KẾT QUẢ: KHÔNG ĐẠT TIÊU CHUẨN MODULE\n');
  process.exit(1);
} else {
  console.log('='.repeat(60));
  console.log('🎉 KẾT QUẢ: ĐẠT TẤT CẢ TIÊU CHUẨN KIỂM TRA!\n');
  process.exit(0);
}
