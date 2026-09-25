import { CoachingRecord } from '../types';
import { REAL_COACHING_RECORDS } from './realCoachingData';

export const INITIAL_COACHING_RECORDS: CoachingRecord[] = REAL_COACHING_RECORDS;

export const COACHING_TOPIC_CATALOG: Record<string, string[]> = {
  'กระทิง': [
    'ฝึกฟังให้เข้าใจก่อนตัดสิน Active Listening',
    'การบริหารความขัดแย้ง (Conflict Management)',
    'สื่อสารเชิงบวก ลดการเผชิญหน้า',
    'ให้ Feedback ที่สร้างแรงจูงใจ (Communication & Feedback)',
    'มอบหมายงานอย่างมีประสิทธิภาพ (Empowerment)',
    'นำทีมผ่านการเปลี่ยนแปลง (Change Leadership)',
    'ควบคุมอารมณ์และเข้าใจผู้อื่น Emotional Intelligence (EQ)',
    'ลดความเครียดและป้องกันภาวะหมดไฟ (Work life Balance)',
    'พัฒนาทักษะการเป็นโค้ช (Coaching Skills)',
    'มองภาพรวมและผลกระทบระยะยาว Strategic Thinking',
    'บริหารความขัดแย้งเชิงระบบ (Systemic Conflict)'
  ],
  'อินทรีย์': [
    'การจัดลำดับความสำคัญ (Priority Management)',
    'การบริหารเวลาอย่างมีประสิทธิภาพ (Time Management)',
    'Focus & Discipline การจดจ่อและการมีวินัย',
    'การคิดอย่างเป็นระบบ (Systematic Thinking)',
    'ติดตามงานอย่างเป็นระบบ (Execution Follow-up)',
    'สื่อสารให้ตรงประเด็นและกระชับ (Direct Communication)',
    'การวางแผนงานระยะยาว (Strategic Planning)',
    'การวิเคราะห์ข้อมูลเพื่อการตัดสินใจ (Data-Driven Decision)'
  ],
  'หมี': [
    'การกล้าตัดสินใจ (Decision Making)',
    'การเจรจาต่อรอง (Negotiation)',
    'การนำเสนออย่างมั่นใจ (Presentation Skills)',
    'การบริหารความเสี่ยง (Risk Management)',
    'การปฏิเสธอย่างสร้างสรรค์ (Assertive Communication)',
    'การคิดเชิงรุก (Proactive Thinking)',
    'การบริหารการเปลี่ยนแปลง (Change Management)',
    'ทักษะการ Feedback',
    'การพัฒนาสภาวะผู้นำ (Leadership Development)',
    'การสร้างความสัมพันธ์ในทีม (Team Building)'
  ],
  'หนู': [
    'การกล้าแสดงออก (Assertiveness)',
    'การตัดสินใจภายใต้ข้อมูลจำกัด',
    'การบริหารความเสี่ยง',
    'ทักษะการทำงานข้ามสายงาน (Cross-functional Collaboration)',
    'การสร้างความมั่นใจในตนเอง (Self-Confidence)',
    'การตั้งเป้าหมายที่ท้าทาย (Stretch Goal Setting)'
  ],
  'Leader': [
    'ทักษะ/แนวทาง การ Coaching ผู้ใต้บังคับบัญชา',
    'การบริหารผลการปฏิบัติงาน (Performance Management)',
    'การสร้างทีมงานที่มีประสิทธิภาพสูง (High-Performance Team)',
    'Strategic Thinking & Alignment'
  ]
};
