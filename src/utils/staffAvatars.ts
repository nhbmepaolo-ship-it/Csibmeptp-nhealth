// Centralized Verified Staff Avatars and Fallbacks for BME PTP Staff

export interface StaffAvatarInfo {
  username: string;
  fullName: string;
  nickname: string;
  photoUrl: string;
  status: 'active' | 'inactive';
}

export const VERIFIED_STAFF_AVATARS: StaffAvatarInfo[] = [
  {
    username: '761080',
    fullName: 'Chalee Meksuwan',
    nickname: 'ปิ้ง',
    photoUrl: 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png',
    status: 'active'
  },
  {
    username: '569492',
    fullName: 'Raschanee Majanit',
    nickname: 'มิน',
    photoUrl: 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png',
    status: 'active'
  },
  {
    username: '563770',
    fullName: 'Supattra Kaewsuwan',
    nickname: 'เปี้ยว',
    photoUrl: 'https://img2.pic.in.th/BME_563770..045756.png',
    status: 'active'
  },
  {
    username: '603892',
    fullName: 'Aiyaret Kitjachanchaikun',
    nickname: 'เป๊ก',
    photoUrl: 'https://img2.pic.in.th/BME_603892..045611.png',
    status: 'active'
  },
  {
    username: '563779',
    fullName: 'Nattaporn Sawisith',
    nickname: 'ณฐ',
    photoUrl: 'https://img1.pic.in.th/images/BME_563779..045629.png',
    status: 'active'
  },
  {
    username: '606675',
    fullName: 'Suphawat Ketman',
    nickname: 'ลูกตาล',
    photoUrl: 'https://img2.pic.in.th/BME_606675..045820.png',
    status: 'active'
  },
  {
    username: '612366',
    fullName: 'Suwapa Phuakphan',
    nickname: 'อ้อ',
    photoUrl: 'https://img2.pic.in.th/BME_612366..045835.png',
    status: 'active'
  },
  {
    username: '614669',
    fullName: 'Thaweewat Thukruea',
    nickname: 'ซัน',
    photoUrl: 'https://img1.pic.in.th/images/BME_614669..045936.png',
    status: 'active'
  },
  {
    username: '616475',
    fullName: 'Titima Puchangthong',
    nickname: 'จิ๊บ',
    photoUrl: 'https://img1.pic.in.th/images/BME_616475..050052.png',
    status: 'active'
  },
  {
    username: '620331',
    fullName: 'Salisa Saelim',
    nickname: 'ษา',
    photoUrl: 'https://img1.pic.in.th/images/6596ac2053383a160.png',
    status: 'inactive' // ลาออกแล้ว
  },
  {
    username: '622659',
    fullName: 'Kanthida Hamontree',
    nickname: 'แฮม',
    photoUrl: 'https://img1.pic.in.th/images/5fb2f77d94121bd37.png',
    status: 'active'
  },
  {
    username: '622947',
    fullName: 'Pannapat Pitpan',
    nickname: 'อ้อน',
    photoUrl: 'https://img2.pic.in.th/4447b7344aeba4742.png',
    status: 'active'
  },
  {
    username: '625192',
    fullName: 'Jatasig Imtour',
    nickname: 'เอิ๊ก',
    photoUrl: 'https://img1.pic.in.th/images/625192.png',
    status: 'active'
  },
  {
    username: '625195',
    fullName: 'Pinmanee Thassakhang',
    nickname: 'ปิ่น',
    photoUrl: 'https://img2.pic.in.th/3dd5cdfa08338f7c4.png',
    status: 'active'
  },
  {
    username: '627537',
    fullName: 'Sutatip Aiemmee',
    nickname: 'ปุ้ย',
    photoUrl: 'https://img2.pic.in.th/ChatGPT-Image-Sep-4-2026-05_05_36-PM.png',
    status: 'active'
  },
  {
    username: '627826',
    fullName: 'Pichaya Narapong',
    nickname: 'ไอซ์',
    photoUrl: 'https://img1.pic.in.th/images/49d801c9-c50d-4ac0-b054-85b551c86d98.png',
    status: 'active'
  }
];

export function getStaffPhoto(identifier?: string, fallbackNickname?: string, fallbackFullName?: string): string {
  const clean = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, '').trim();
  const idClean = clean(identifier);
  const nickClean = clean(fallbackNickname);
  const fullClean = clean(fallbackFullName);

  // 1. Match by username / ID aliases
  if (idClean) {
    if (idClean === '761080' || idClean.includes('mgr_bme') || idClean.includes('chalee')) {
      return 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png';
    }
    if (idClean === '569492' || idClean.includes('spv_bme') || idClean.includes('raschanee')) {
      return 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png';
    }
    const found = VERIFIED_STAFF_AVATARS.find(s => clean(s.username) === idClean);
    if (found) return found.photoUrl;
  }

  // 2. Match by nickname
  if (nickClean) {
    if (nickClean === 'ปิ้ง') return 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png';
    if (nickClean === 'มิน') return 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png';
    if (nickClean === 'เปี้ยว') return 'https://img2.pic.in.th/BME_563770..045756.png';
    if (nickClean === 'เป๊ก' || nickClean === 'เป็ก') return 'https://img2.pic.in.th/BME_603892..045611.png';
    if (nickClean === 'ณฐ' || nickClean === 'นท' || nickClean.includes('ณัฐ')) return 'https://img1.pic.in.th/images/BME_563779..045629.png';
    if (nickClean === 'ลูกตาล' || nickClean === 'ตาล') return 'https://img2.pic.in.th/BME_606675..045820.png';
    if (nickClean === 'อ้อ') return 'https://img2.pic.in.th/BME_612366..045835.png';
    if (nickClean === 'ซัน') return 'https://img1.pic.in.th/images/BME_614669..045936.png';
    if (nickClean === 'จิ๊บ') return 'https://img1.pic.in.th/images/BME_616475..050052.png';
    if (nickClean === 'ษา') return 'https://img1.pic.in.th/images/6596ac2053383a160.png';
    if (nickClean === 'แฮม') return 'https://img1.pic.in.th/images/5fb2f77d94121bd37.png';
    if (nickClean === 'อ้อน' || nickClean === 'อ้น') return 'https://img2.pic.in.th/4447b7344aeba4742.png';
    if (nickClean === 'เอิ๊ก') return 'https://img1.pic.in.th/images/625192.png';
    if (nickClean === 'ปิ่น') return 'https://img2.pic.in.th/3dd5cdfa08338f7c4.png';
    if (nickClean === 'ปุ้ย') return 'https://img2.pic.in.th/ChatGPT-Image-Sep-4-2026-05_05_36-PM.png';
    if (nickClean === 'ไอซ์') return 'https://img1.pic.in.th/images/49d801c9-c50d-4ac0-b054-85b551c86d98.png';
  }

  // 3. Match by full name
  if (fullClean) {
    if (fullClean.includes('ชาลี') || fullClean.includes('chalee')) return 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png';
    if (fullClean.includes('รัชณี') || fullClean.includes('raschanee')) return 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png';
    if (fullClean.includes('สุพัตรา') || fullClean.includes('supattra')) return 'https://img2.pic.in.th/BME_563770..045756.png';
    if (fullClean.includes('ไอยเรศ') || fullClean.includes('aiyaret')) return 'https://img2.pic.in.th/BME_603892..045611.png';
    if (fullClean.includes('ณัฐพร') || fullClean.includes('nattaporn')) return 'https://img1.pic.in.th/images/BME_563779..045629.png';
    if (fullClean.includes('ศุภวัฒน์') || fullClean.includes('suphawat')) return 'https://img2.pic.in.th/BME_606675..045820.png';
    if (fullClean.includes('สุวภา') || fullClean.includes('suwapa')) return 'https://img2.pic.in.th/BME_612366..045835.png';
    if (fullClean.includes('ทวีวัฒน์') || fullClean.includes('thaweewat')) return 'https://img1.pic.in.th/images/BME_614669..045936.png';
    if (fullClean.includes('ธิติมา') || fullClean.includes('titima')) return 'https://img1.pic.in.th/images/BME_616475..050052.png';
    if (fullClean.includes('ษา') || fullClean.includes('salisa')) return 'https://img1.pic.in.th/images/6596ac2053383a160.png';
    if (fullClean.includes('กานต์ธิดา') || fullClean.includes('kanthida')) return 'https://img1.pic.in.th/images/5fb2f77d94121bd37.png';
    if (fullClean.includes('พรรณพัชร') || fullClean.includes('pannapat')) return 'https://img2.pic.in.th/4447b7344aeba4742.png';
    if (fullClean.includes('เจตสิก') || fullClean.includes('jatasig')) return 'https://img1.pic.in.th/images/625192.png';
    if (fullClean.includes('ปิ่นมณี') || fullClean.includes('pinmanee')) return 'https://img2.pic.in.th/3dd5cdfa08338f7c4.png';
    if (fullClean.includes('สุธาทิพย์') || fullClean.includes('sutatip')) return 'https://img2.pic.in.th/ChatGPT-Image-Sep-4-2026-05_05_36-PM.png';
    if (fullClean.includes('พิชญา') || fullClean.includes('pichaya')) return 'https://img1.pic.in.th/images/49d801c9-c50d-4ac0-b054-85b551c86d98.png';
  }

  const seed = fallbackNickname || identifier || fallbackFullName || 'bme-staff';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&skinColor=f8d25c`;
}
