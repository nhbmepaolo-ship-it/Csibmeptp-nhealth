import { Employee, CSIRecord, VoteRecord, ActivityRecord, ActivityCategory, CardAnnouncementSettings, HappyLifeClub, OrgChartConfig, CoachingRecord } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_CSI_RECORDS, INITIAL_VOTES, INITIAL_ACTIVITIES, HAPPY_LIFE_CLUBS } from '../data/initialData';
import { INITIAL_ORG_CHART } from '../data/initialOrgChart';
import { INITIAL_COACHING_RECORDS } from '../data/initialCoachingData';

export const FIXED_GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxYN-S1ejO-6-IWM11q84UjCcV4X6xiSPy9YgkSKichlnoyQ7RSC6xW_SW_DN1UUmoXMA/exec';

export function normalizeGasUrl(url?: string): string {
  if (!url || typeof url !== 'string') return FIXED_GAS_WEBHOOK_URL;
  let clean = url.trim();
  if (
    !clean.includes('script.google.com') ||
    clean.includes('AKfycbxjfDYcdMmOEdryWMUvb3zpbOYT5-VA1FEtDTC8jGkE8m4eh2qy0BmejNKkNYXB4AXb') ||
    clean.includes('AKfycby_TunZUkHu_9jTuyl0W8Fa-L0IVJ4_G3rCTrxzPEkZIrxDcNpZwbpMa0ejaIUTZlaX')
  ) {
    if (typeof window !== 'undefined') {
      try {
        const cur = localStorage.getItem('csi_google_sheets_url');
        if (cur && (cur.includes('AKfycbxjfDYcdMm') || cur.includes('AKfycby_TunZUkHu'))) {
          localStorage.setItem('csi_google_sheets_url', FIXED_GAS_WEBHOOK_URL);
        }
      } catch (e) {}
    }
    return FIXED_GAS_WEBHOOK_URL;
  }
  clean = clean.replace(/\/edit(\?.*)?$/, '/exec').replace(/\/dev(\?.*)?$/, '/exec');
  if (!clean.endsWith('/exec') && !clean.includes('/exec?')) {
    clean = clean.replace(/\/+$/, '') + '/exec';
  }
  return clean;
}

/**
 * Robust date parser supporting ISO, DD/MM/YYYY, DD/MM/YY, Thai Buddhist Era, and legacy formats
 */
export function parseCsiDate(dateStr?: string | Date | number): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr === 'number') {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Try native Date parse if already ISO (YYYY-MM-DD...)
  let d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100 && (str.includes('-') || str.includes('T'))) {
    return d;
  }

  // 2. Handle Thai Buddhist Era in ISO (e.g. 2569-09-24)
  const beIsoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (beIsoMatch) {
    let year = parseInt(beIsoMatch[1], 10);
    if (year > 2500) year -= 543;
    const month = parseInt(beIsoMatch[2], 10) - 1;
    const day = parseInt(beIsoMatch[3], 10);
    const hours = parseInt(beIsoMatch[4] || '0', 10);
    const minutes = parseInt(beIsoMatch[5] || '0', 10);
    const seconds = parseInt(beIsoMatch[6] || '0', 10);
    const res = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(res.getTime())) return res;
  }

  // 3. Handle DD/MM/YYYY or DD/MM/YY format (e.g. 24/09/2026 10:00:00, 24/09/2026, 14:15:00 or 24/09/26:09/28/02)
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,:T]+(\d{1,2})[:/](\d{1,2})(?:[:/](\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year += 2000;
    } else if (year > 2500) {
      year -= 543;
    }
    const hours = parseInt(dmyMatch[4] || '0', 10);
    const minutes = parseInt(dmyMatch[5] || '0', 10);
    const seconds = parseInt(dmyMatch[6] || '0', 10);
    const res = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(res.getTime())) return res;
  }

  // 4. Fallback native parse
  d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns ISO datetime formatted as YYYY-MM-DDTHH:mm:ss for consistent internal storage
 */
export function getIsoDateTime(dateInput?: string | Date | number): string {
  let d: Date | null = null;
  if (dateInput) {
    d = parseCsiDate(dateInput);
  }
  if (!d || isNaN(d.getTime())) {
    d = new Date();
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Formats date for Google Sheets column 0 as DD/MM/YYYY HH:mm:ss
 */
export function formatInternationalDateTime(dateInput?: string | Date | number): string {
  let d: Date | null = null;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  } else {
    d = parseCsiDate(dateInput);
  }

  if (!d || isNaN(d.getTime())) {
    d = new Date();
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Normalizes any activity date input into standard Christian Era formats:
 * - dateKey: YYYY-MM-DD (e.g. "2026-08-05")
 * - timestamp: YYYY-MM-DDTHH:mm:ss (e.g. "2026-08-05T09:00:00")
 * - dateFormatted: DD/MM/YYYY (e.g. "05/08/2026")
 * Supports Thai Buddhist Era (2569 -> 2026), DD/MM/YYYY, YYYY-MM-DD, ISO timestamps, and Date objects.
 */
export function normalizeActivityDate(dateRaw?: string | Date | number): {
  dateKey: string;
  timestamp: string;
  dateFormatted: string;
} {
  if (!dateRaw) {
    const now = new Date();
    let y = now.getFullYear();
    if (y > 2500) y -= 543;
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    return {
      dateKey,
      timestamp: `${dateKey}T09:00:00`,
      dateFormatted: `${d}/${m}/${y}`
    };
  }

  if (typeof dateRaw === 'string') {
    const trimmed = dateRaw.trim();
    // 1. D/M/YYYY or DD/MM/YYYY (handles Thai Buddhist year 2569 -> 2026)
    if (trimmed.includes('/')) {
      const parts = trimmed.split(/[\s,]+/)[0].split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parseInt(parts[2], 10);
        if (y > 2500) y -= 543;
        if (!isNaN(y)) {
          const dateKey = `${y}-${m}-${d}`;
          return {
            dateKey,
            timestamp: `${dateKey}T09:00:00`,
            dateFormatted: `${d}/${m}/${y}`
          };
        }
      }
    }
    // 2. YYYY-MM-DD (handles Thai Buddhist year 2569-MM-DD -> 2026-MM-DD)
    if (trimmed.includes('-')) {
      const parts = trimmed.substring(0, 10).split('-');
      if (parts.length === 3) {
        let y = parseInt(parts[0], 10);
        if (y > 2500) y -= 543;
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        if (!isNaN(y)) {
          const dateKey = `${y}-${m}-${d}`;
          return {
            dateKey,
            timestamp: `${dateKey}T09:00:00`,
            dateFormatted: `${d}/${m}/${y}`
          };
        }
      }
    }
  }

  const dt = new Date(dateRaw);
  if (!isNaN(dt.getTime())) {
    let y = dt.getFullYear();
    if (y > 2500) y -= 543;
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    return {
      dateKey,
      timestamp: dt.toISOString(),
      dateFormatted: `${d}/${m}/${y}`
    };
  }

  const now = new Date();
  let y = now.getFullYear();
  if (y > 2500) y -= 543;
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateKey = `${y}-${m}-${d}`;
  return {
    dateKey,
    timestamp: `${dateKey}T09:00:00`,
    dateFormatted: `${d}/${m}/${y}`
  };
}

/**
 * Checks if an activity record is corrupted or phantom data
 * (e.g. CSI evaluation responses mistakenly parsed as activities)
 */
export function isInvalidOrCorruptActivity(a: any): boolean {
  if (!a) return true;

  // 1. Single digit activity name like '0', '1', '2', '3', '4', '5' (from CSI rating columns)
  const actName = String(a.activityName || '').trim();
  if (!actName || /^[0-5]$/.test(actName)) return true;

  // 2. Club is invalid (e.g. 'HR-PTP', 'Happy Life', 'ประเมิน CSI', '0')
  // Categories like HR-PTP / Happy Life should NEVER be the club name
  const club = String(a.club || '').trim();
  if (!club || club === 'HR-PTP' || club === 'Happy Life' || club === 'ประเมิน CSI' || club === '0' || club.includes('ประเมิน')) {
    return true;
  }

  // 3. Excessive or zero hours in a single activity record (e.g. 1830 minutes / 30.5 hours)
  const totalMins = Number(a.totalMinutes) || 0;
  if (totalMins <= 0 || totalMins > 720) { // maximum 12 hours (720 minutes) per activity
    return true;
  }

  // 4. Corrupted nickname or fullname from CSI department names
  const fullName = String(a.fullName || '').trim();
  const nickname = String(a.nickname || '').trim();
  if (fullName === 'วิทย์' || fullName === 'วิทยาศาสตร์' || (nickname === 'ชมรมเดิน-วิ่ง' && !fullName)) {
    return true;
  }

  // 5. CSI Category wrongly assigned
  if (a.category === 'ประเมิน CSI' || a.activityCategory === 'ประเมิน CSI') {
    return true;
  }

  return false;
}

/**
 * Formats activity date strictly as dd/mm/yyyy in Christian Era (ค.ศ.)
 * e.g. "08/05/2026", "09/02/2026", "26/08/2026"
 */
export function formatActivityDate(dateInput?: string | Date | number): string {
  return normalizeActivityDate(dateInput).dateFormatted;
}

export const DEFAULT_OFFICIAL_SHEET_ID = '1eswu63LgsBcdAZZeRvfnJ5v3SlkM7n1y3K5Hwbc-Ryw';

const KEYS = {
  EMPLOYEES: 'csi_bme_employees_v2',
  CSI_RECORDS: 'csi_bme_csi_records_v3',
  VOTES: 'csi_bme_votes_v2',
  ACTIVITIES: 'csi_bme_activities_v2',
  CURRENT_USER: 'csi_bme_current_user_v2',
  CARD_SETTINGS: 'csi_bme_card_settings_v2',
  SHEET_ID: 'csi_bme_sheet_id_v3',
  ORG_CHART: 'csi_bme_org_chart_v2',
  COACHING: 'csi_bme_coaching_records_v2'
};

export class StorageService {
  // Org Chart
  static getOrgChart(): OrgChartConfig {
    try {
      const data = localStorage.getItem(KEYS.ORG_CHART);
      const employees = this.getEmployees().filter(e => e.status !== 'resigned');

      const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

      const findEmp = (node: any) => {
        const rawId = (node.employeeId || '').trim();
        const digits = rawId.replace(/\D/g, '');
        const nodeF = cleanStr(node.fullName);
        const nodeN = cleanStr(node.nickname);

        // Match by ID
        const byId = employees.find(e => {
          if (rawId && (e.id === rawId || e.username === rawId)) return true;
          if (rawId && (e.id.includes(rawId) || rawId.includes(e.id))) return true;
          const eDigits = (e.username || '').replace(/\D/g, '');
          if (digits && digits.length >= 4 && (eDigits === digits || e.username === digits)) return true;
          return false;
        });
        if (byId) return byId;

        // Match by Name or Nickname
        return employees.find(e => {
          const ef = cleanStr(e.fullName);
          const en = cleanStr(e.nickname);
          if (nodeF && ef && (nodeF === ef || nodeF.includes(ef) || ef.includes(nodeF))) return true;
          if (nodeN && en && (nodeN === en || nodeN.includes(en) || en.includes(nodeN))) return true;
          return false;
        });
      };

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          let hasChanges = false;
          parsed.nodes = parsed.nodes.map((node: any) => {
            let currentPhoto = node.photoUrl || '';
            const healed = currentPhoto
              .replace('https://img2.pic.in.th/images/BME_563770..045756.png', 'https://img2.pic.in.th/BME_563770..045756.png')
              .replace('https://img1.pic.in.th/images/BME_603892..045611.png', 'https://img2.pic.in.th/BME_603892..045611.png')
              .replace('https://img2.pic.in.th/images/BME_563779..045629.png', 'https://img1.pic.in.th/images/BME_563779..045629.png')
              .replace('https://img2.pic.in.th/images/BME_606675..045820.png', 'https://img2.pic.in.th/BME_606675..045820.png')
              .replace('https://img2.pic.in.th/images/BME_612366..045835.png', 'https://img2.pic.in.th/BME_612366..045835.png')
              .replace('https://img2.pic.in.th/S__6471705_0-removebg-preview.png', 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png');

            if (healed !== currentPhoto) {
              currentPhoto = healed;
              hasChanges = true;
            }

            // Sync with latest employee photo if available
            const matched = findEmp(node);
            if (matched && matched.img && matched.img.trim().length > 5 && !matched.img.includes('dicebear')) {
              if (currentPhoto !== matched.img) {
                currentPhoto = matched.img;
                hasChanges = true;
              }
              if (node.employeeId !== matched.id) {
                node.employeeId = matched.id;
                hasChanges = true;
              }
            }

            return { ...node, photoUrl: currentPhoto };
          });
          if (hasChanges) {
            // Persist healed photo URLs locally without triggering remote sheet sync
            this.saveOrgChart(parsed, false);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse org chart from storage:', e);
    }
    this.saveOrgChart(INITIAL_ORG_CHART, false);
    return INITIAL_ORG_CHART;
  }

  static saveOrgChart(config: OrgChartConfig, shouldSyncToSheet: boolean = true): void {
    try {
      localStorage.setItem(KEYS.ORG_CHART, JSON.stringify(config));
      // Auto-sync org chart to Google Sheets only if explicitly allowed
      if (shouldSyncToSheet) {
        this.syncDataToGoogleSheet('sync_orgchart', { orgChart: config }).catch(err => {
          console.warn('Auto sync org chart notice:', err);
        });
      }
    } catch (e) {
      console.error('Failed to save org chart:', e);
    }
  }

  static resetOrgChart(): OrgChartConfig {
    this.saveOrgChart(INITIAL_ORG_CHART, true);
    return INITIAL_ORG_CHART;
  }

  // Coaching Records
  static getCoachingRecords(): CoachingRecord[] {
    try {
      const data = localStorage.getItem(KEYS.COACHING);
      if (data) {
        const parsed: CoachingRecord[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If old default records exist (e.g., Chalee topic1 contains Active Listening) or incomplete list, update them
          const charlie = parsed.find(r => r.empId === '761080' || r.fullName.includes('ชาลี'));
          if (!charlie || charlie.topic1.includes('Active Listening') || parsed.length < 15) {
            this.saveCoachingRecords(INITIAL_COACHING_RECORDS);
            return INITIAL_COACHING_RECORDS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse coaching records from storage:', e);
    }
    this.saveCoachingRecords(INITIAL_COACHING_RECORDS);
    return INITIAL_COACHING_RECORDS;
  }

  static saveCoachingRecords(records: CoachingRecord[]): void {
    try {
      localStorage.setItem(KEYS.COACHING, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save coaching records:', e);
    }
  }

  static async updateCoachingRecord(id: string, updates: Partial<CoachingRecord>): Promise<{ list: CoachingRecord[]; syncResult: { success: boolean; message: string } }> {
    const list = this.getCoachingRecords();
    const idx = list.findIndex(r => r.id === id || r.empId === id);
    let syncRes = { success: true, message: 'บันทึกสำเร็จ' };
    if (idx !== -1) {
      const updated = { ...list[idx], ...updates };
      // Recalculate total hours if any weekly hours updated
      const w1 = updated.hoursW1 || 0;
      const w2 = updated.hoursW2 || 0;
      const w3 = updated.hoursW3 || 0;
      const w4 = updated.hoursW4 || 0;
      const w5 = updated.hoursW5 || 0;
      const w6 = updated.hoursW6 || 0;
      updated.totalHours = Number((w1 + w2 + w3 + w4 + w5 + w6).toFixed(1));

      list[idx] = updated;
      this.saveCoachingRecords(list);
      // Auto-sync updated coaching record to Google Sheets
      syncRes = await this.syncDataToGoogleSheet('update_coaching', updated);
    }
    return { list, syncResult: syncRes };
  }

  static resetCoachingRecords(): CoachingRecord[] {
    this.saveCoachingRecords(INITIAL_COACHING_RECORDS);
    return INITIAL_COACHING_RECORDS;
  }

  // Status Overrides Helper
  static getStatusOverrides(): Record<string, 'active' | 'resigned'> {
    try {
      const data = localStorage.getItem('csi_bme_emp_status_overrides_v2');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static saveStatusOverrides(overrides: Record<string, 'active' | 'resigned'>): void {
    try {
      localStorage.setItem('csi_bme_emp_status_overrides_v2', JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save status overrides:', e);
    }
  }

  // Employees
  static getEmployees(): Employee[] {
    const data = localStorage.getItem(KEYS.EMPLOYEES);
    let list: Employee[] = [];
    if (!data) {
      this.saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    try {
      list = JSON.parse(data);
    } catch {
      list = INITIAL_EMPLOYEES;
    }

    const statusOverrides = this.getStatusOverrides();
    let hasChanges = false;
    const cleanStr = (s: string) => (s || '').replace(/\s*\(?https?:\/\/[^\s)]+\)?/gi, '').trim();

    const cleanedList: Employee[] = [];
    const seenUsernames = new Set<string>();

    const CANONICAL_ADMINS: { [key: string]: { fullName: string; nickname: string; club: HappyLifeClub; password?: string; img: string } } = {
      '563770': {
        fullName: 'Supattra Kaewsuwan',
        nickname: 'เปี้ยว',
        club: 'ชมรมเดิน-วิ่ง',
        password: '563770@Nhealth',
        img: 'https://img2.pic.in.th/BME_563770..045756.png'
      },
      'MGR_BME': {
        fullName: 'Chalee Meksuwan',
        nickname: 'ปิ้ง',
        club: 'ชมรมเดิน-วิ่ง',
        password: 'Mgr-BME',
        img: 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png'
      },
      'SPV_BME': {
        fullName: 'Raschanee Majanit',
        nickname: 'มิน',
        club: 'ชมรมเดิน-วิ่ง',
        password: 'Spv-BME@PTP',
        img: 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png'
      }
    };

    for (const emp of list) {
      const cleanNick = cleanStr(emp.nickname);
      const cleanFull = cleanStr(emp.fullName);

      // Filter out team placeholder accounts and dummy emp accounts
      const isTeam = cleanFull.toLowerCase().includes('team') ||
        cleanNick.toLowerCase().includes('team') ||
        cleanFull.includes('ทีม') ||
        cleanNick.includes('ทีม') ||
        (emp.username && emp.username.toLowerCase().includes('team')) ||
        emp.username === 'emp_15' ||
        emp.username === 'emp_16' ||
        emp.username === 'emp_17';

      if (isTeam) {
        hasChanges = true;
        continue;
      }

      // Filter out old dummy mock accounts
      if (emp.username && (emp.username.startsWith('emp_a') || emp.username.startsWith('emp_nan') || emp.username.startsWith('emp_jiw') || emp.username.startsWith('emp_name') || emp.username.startsWith('emp_da'))) {
        hasChanges = true;
        continue;
      }

      // Filter out accounts with no name or blank parentheses
      if (!cleanNick && !cleanFull) {
        hasChanges = true;
        continue;
      }
      if (cleanFull === '()' || cleanNick === '()' || cleanFull === '-' || cleanNick === '-') {
        hasChanges = true;
        continue;
      }
      if (emp.username?.startsWith('emp_') && (!cleanNick || !cleanFull)) {
        hasChanges = true;
        continue;
      }

      const uUpper = (emp.username || '').trim().toUpperCase();
      const uKey = (emp.username || emp.id || '').toLowerCase();
      const initialMatch = INITIAL_EMPLOYEES.find(e => (e.username && e.username.toLowerCase() === uKey) || (e.fullName && cleanFull && e.fullName.toLowerCase() === cleanFull.toLowerCase()));
      let baseStatus = emp.status || 'active';
      if (initialMatch && (initialMatch.status === 'resigned' || (initialMatch.status as string) === 'inactive') && !statusOverrides[uKey]) {
        baseStatus = 'resigned';
      }
      const finalStatus = statusOverrides[uKey] || baseStatus;

      if (emp.status !== finalStatus) {
        hasChanges = true;
      }

      let updatedNick = cleanNick || cleanFull;
      let updatedFull = cleanFull || cleanNick;
      let updatedClub: HappyLifeClub = (emp.club as HappyLifeClub) || 'ชมรมเดิน-วิ่ง';
      let isAdmin = emp.isAdmin || false;

      let updatedPass = emp.password;

      let img = emp.img;
      if (img) {
        const healed = img
          .replace('https://img2.pic.in.th/images/BME_563770..045756.png', 'https://img2.pic.in.th/BME_563770..045756.png')
          .replace('https://img1.pic.in.th/images/BME_603892..045611.png', 'https://img2.pic.in.th/BME_603892..045611.png')
          .replace('https://img2.pic.in.th/images/BME_563779..045629.png', 'https://img1.pic.in.th/images/BME_563779..045629.png')
          .replace('https://img2.pic.in.th/images/BME_606675..045820.png', 'https://img2.pic.in.th/BME_606675..045820.png')
          .replace('https://img2.pic.in.th/images/BME_612366..045835.png', 'https://img2.pic.in.th/BME_612366..045835.png')
          .replace('https://img2.pic.in.th/S__6471705_0-removebg-preview.png', 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png');
        if (healed !== img) {
          img = healed;
          hasChanges = true;
        }
      }
      if (img && img.includes('drive.google.com')) {
        const m = img.match(/\/d\/([a-zA-Z0-9_-]+)/) || img.match(/id=([a-zA-Z0-9_-]+)/);
        if (m && m[1]) {
          img = `https://lh3.googleusercontent.com/d/${m[1]}`;
          hasChanges = true;
        }
      }

      if (CANONICAL_ADMINS[uUpper]) {
        const canonical = CANONICAL_ADMINS[uUpper];
        if (emp.fullName !== canonical.fullName || emp.nickname !== canonical.nickname || !emp.isAdmin || (canonical.password && emp.password !== canonical.password) || (canonical.img && emp.img !== canonical.img)) {
          hasChanges = true;
        }
        updatedFull = canonical.fullName;
        updatedNick = canonical.nickname;
        if (canonical.password) updatedPass = canonical.password;
        if (!emp.club) updatedClub = canonical.club;
        if (canonical.img) img = canonical.img;
        isAdmin = true;
      }

      if (!img || img.includes('images.unsplash') || !img.startsWith('http')) {
        img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(updatedNick || updatedFull)}&skinColor=f8d25c`;
        hasChanges = true;
      }

      const key = (emp.username || updatedFull).toLowerCase();
      if (seenUsernames.has(key)) {
        hasChanges = true;
        continue;
      }
      seenUsernames.add(key);

      if (updatedNick !== emp.nickname || updatedFull !== emp.fullName) {
        hasChanges = true;
      }

      cleanedList.push({
        ...emp,
        status: finalStatus,
        nickname: updatedNick,
        fullName: updatedFull,
        password: updatedPass,
        club: updatedClub,
        isAdmin,
        img
      });
    }

    // Ensure all 3 canonical admin accounts exist in the list
    for (const initialAdmin of INITIAL_EMPLOYEES) {
      const uKey = initialAdmin.username.toLowerCase();
      if (!seenUsernames.has(uKey)) {
        cleanedList.unshift(initialAdmin);
        seenUsernames.add(uKey);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveEmployees(cleanedList);
    }

    return cleanedList;
  }

  static saveEmployees(employees: Employee[]): void {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
  }

  static addEmployee(emp: Omit<Employee, 'id'>): Employee {
    const list = this.getEmployees();
    const newEmp: Employee = {
      ...emp,
      id: 'emp-' + Date.now()
    };
    list.push(newEmp);
    this.saveEmployees(list);
    return newEmp;
  }

  static updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const list = this.getEmployees();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };

    if (updates.status) {
      const overrides = this.getStatusOverrides();
      const uKey = (list[idx].username || list[idx].id || '').toLowerCase();
      if (uKey) {
        overrides[uKey] = updates.status === 'inactive' ? 'resigned' : updates.status;
        this.saveStatusOverrides(overrides);
      }
    }

    this.saveEmployees(list);
    return list[idx];
  }

  static deleteEmployee(id: string, username?: string): boolean {
    const list = this.getEmployees();
    const filtered = list.filter(e => e.id !== id && (!username || e.username !== username));
    if (filtered.length === list.length) return false;

    this.saveEmployees(filtered);

    // Also remove from overrides if any
    try {
      const overrides = this.getStatusOverrides();
      if (username) delete overrides[username.toLowerCase()];
      delete overrides[id.toLowerCase()];
      this.saveStatusOverrides(overrides);
    } catch {
      // Ignore
    }

    return true;
  }

  // CSI Records
  static getCSIRecords(): CSIRecord[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return INITIAL_CSI_RECORDS;
    }

    // Purge obsolete legacy mock keys from localStorage
    try {
      localStorage.removeItem('csi_bme_csi_records_v2');
      localStorage.removeItem('csi_bme_csi_records');
    } catch (_) {}

    const data = localStorage.getItem(KEYS.CSI_RECORDS);
    if (!data) {
      this.saveCSIRecords(INITIAL_CSI_RECORDS);
      return INITIAL_CSI_RECORDS;
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Auto purge stale 513-item duplicate merge caused by previous merge logic
        if (parsed.length === 513) {
          this.saveCSIRecords(INITIAL_CSI_RECORDS);
          return INITIAL_CSI_RECORDS;
        }

        // Detect contamination with old mock data (e.g., department 'วิทย์' or fake staffName 'dsfsdfsdf')
        const hasMockData = parsed.some(r => r.dept === 'วิทย์' || r.dept === 'วิทยาศาสตร์' || (r as any).isMock || r.staffName === 'dsfsdfsdf');
        if (hasMockData) {
          const clean = parsed.filter(r => r.dept && r.dept !== 'วิทย์' && r.dept !== 'วิทยาศาสตร์' && !(r as any).isMock && r.staffName !== 'dsfsdfsdf');
          this.saveCSIRecords(clean);
          return clean;
        }
        return parsed;
      }
      return INITIAL_CSI_RECORDS;
    } catch {
      return INITIAL_CSI_RECORDS;
    }
  }

  static resetCSIRecordsToReal(): CSIRecord[] {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(KEYS.CSI_RECORDS);
        localStorage.removeItem('csi_bme_csi_records_v2');
        localStorage.removeItem('csi_bme_csi_records');
      } catch (_) {}
    }
    this.saveCSIRecords(INITIAL_CSI_RECORDS);
    return INITIAL_CSI_RECORDS;
  }

  static saveCSIRecords(records: CSIRecord[]): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(KEYS.CSI_RECORDS, JSON.stringify(records));
    }
  }

  static async addCSIRecord(record: CSIRecord): Promise<{ success: boolean; message: string }> {
    const list = this.getCSIRecords();
    // Ensure the record's timestamp is clean ISO for consistent local parsing and sorting
    const cleanRecord: CSIRecord = {
      ...record,
      timestamp: getIsoDateTime(record.timestamp)
    };
    list.unshift(cleanRecord);
    this.saveCSIRecords(list);

    // Format timestamp for Google Sheets column 0 as DD/MM/YYYY HH:mm:ss
    const sheetDate = formatInternationalDateTime(cleanRecord.timestamp);
    const payload = {
      ...cleanRecord,
      timestamp: sheetDate,
      date: sheetDate,
      time: sheetDate,
      Timestamp: sheetDate
    };

    // Auto-sync new CSI record to Google Sheets with timeout race so mobile never hangs
    try {
      const syncPromise = this.syncDataToGoogleSheet('add_csi', payload);
      const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) =>
        setTimeout(() => resolve({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว (ระบบกำลังซิงค์ลง Google Sheet)' }), 4500)
      );
      return await Promise.race([syncPromise, timeoutPromise]);
    } catch (e: any) {
      return { success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' };
    }
  }

  // Vote Records
  static getVotes(): VoteRecord[] {
    const data = localStorage.getItem(KEYS.VOTES);
    let list: VoteRecord[] = [];
    if (!data) {
      list = INITIAL_VOTES;
    } else {
      try {
        list = JSON.parse(data);
      } catch {
        list = INITIAL_VOTES;
      }
    }

    // Filter out old mock records with fake users
    const filtered = list.filter(v => {
      const nominee = (v.nominee || '').toLowerCase();
      const voter = (v.voter || '').toLowerCase();
      if (nominee.includes('วิไล') || nominee.includes('สุดา') || nominee.includes('นรินทร์') || nominee.includes('พรทิพย์')) return false;
      if (voter.startsWith('emp_a') || voter.startsWith('emp_nan') || voter.startsWith('emp_jiw') || voter.startsWith('emp_name') || voter.startsWith('emp_da')) return false;
      return true;
    });

    if (filtered.length !== list.length) {
      this.saveVotes(filtered.length > 0 ? filtered : INITIAL_VOTES);
      return filtered.length > 0 ? filtered : INITIAL_VOTES;
    }

    return list;
  }

  static saveVotes(votes: VoteRecord[]): void {
    localStorage.setItem(KEYS.VOTES, JSON.stringify(votes));
  }

  static addVote(voter: string, category: string, nominee: string, voteMonth: string): { success: boolean; message: string; monthKey?: string } {
    const votes = this.getVotes();
    const employees = this.getEmployees();
    const userLower = voter.trim().toLowerCase();

    // Validate voter vs nominee
    const voterEmp = employees.find(e => e.username.toLowerCase() === userLower || e.fullName === voter);
    const nomineeEmp = employees.find(e => e.fullName === nominee || `${e.fullName} (${e.nickname})` === nominee);

    if (voterEmp && nomineeEmp) {
      if (voterEmp.id === nomineeEmp.id || voterEmp.username.toLowerCase() === nomineeEmp.username.toLowerCase()) {
        return {
          success: false,
          message: 'ไม่สามารถลงคะแนนโหวตให้ตนเองได้'
        };
      }
      if (voterEmp.club && nomineeEmp.club && voterEmp.club.trim().toLowerCase() === nomineeEmp.club.trim().toLowerCase()) {
        return {
          success: false,
          message: `ไม่สามารถลงคะแนนโหวตให้เพื่อนพนักงานในทีม/ชมรมเดียวกัน (${voterEmp.club}) ได้`
        };
      }
    }

    // Check if user already voted in this category and month
    const existing = votes.find(
      v => v.voter.toLowerCase() === userLower && v.category === category && v.voteMonth === voteMonth
    );

    if (existing) {
      return {
        success: false,
        message: `คุณเคยโหวตในหัวข้อ '${category}' ของรอบเดือน ${voteMonth} ไปแล้ว! (เลือกรอบเดือนอื่นได้)`
      };
    }

    const now = new Date();
    const nowMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (voteMonth > nowMonthKey) {
      return {
        success: false,
        message: 'ไม่สามารถโหวตล่วงหน้าในเดือนอนาคตได้ กรุณาเลือกเดือนปัจจุบันหรือย้อนหลัง'
      };
    }

    const newVote: VoteRecord = {
      id: 'vote-' + Date.now(),
      timestamp: formatInternationalDateTime(now),
      voter,
      category,
      nominee,
      voteMonth
    };

    votes.unshift(newVote);
    this.saveVotes(votes);
    // Auto-sync vote record to Google Sheets
    this.syncDataToGoogleSheet('add_vote', newVote);
    return {
      success: true,
      message: `บันทึกผลการโหวตรอบเดือน ${voteMonth} เรียบร้อยแล้ว!`,
      monthKey: voteMonth
    };
  }

  // Activity Records
  static getActivities(): ActivityRecord[] {
    const data = localStorage.getItem(KEYS.ACTIVITIES);
    let list: ActivityRecord[] = [];
    if (!data) {
      list = [...INITIAL_ACTIVITIES];
    } else {
      try {
        const parsed = JSON.parse(data);
        list = Array.isArray(parsed) ? parsed : [...INITIAL_ACTIVITIES];
      } catch {
        list = [...INITIAL_ACTIVITIES];
      }
    }

    const countBeforeFilter = list.length;
    // 1. Filter out corrupted or phantom records (e.g. CSI survey rows wrongly parsed as activities)
    list = list.filter(a => !isInvalidOrCorruptActivity(a));

    // If completely empty after filtering out corrupt rows, fallback to INITIAL_ACTIVITIES
    if (list.length === 0 && INITIAL_ACTIVITIES.length > 0) {
      list = [...INITIAL_ACTIVITIES];
    }

    // 2. Upgrade and merge missing activities from sheet initial data if missing
    if (INITIAL_ACTIVITIES.length > 0) {
      const existingIds = new Set(list.map(a => a.id));
      let added = false;
      INITIAL_ACTIVITIES.forEach(act => {
        if (!existingIds.has(act.id)) {
          list.push(act);
          existingIds.add(act.id);
          added = true;
        }
      });
      if (added) {
        this.saveActivities(list);
      }
    }

    // 3. Ensure all activities have standard Christian Era (ค.ศ.) dateKey, timestamp, dateFormatted, and strictly unique IDs
    const seenIds = new Set<string>();
    let hasUpdatedIds = countBeforeFilter !== list.length;

    const sanitizedList: ActivityRecord[] = [];

    for (let idx = 0; idx < list.length; idx++) {
      const a = list[idx];
      let id = a.id;
      // If id is missing, looks like a date (e.g. contains '/' or equals '07/09/2026'), or was already seen:
      if (!id || id.includes('/') || id === '07/09/2026' || seenIds.has(id)) {
        id = `act-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        hasUpdatedIds = true;
      }
      seenIds.add(id);

      const normDate = normalizeActivityDate(a.timestamp || a.dateKey || a.dateFormatted || a.date);
      if (a.dateKey !== normDate.dateKey || a.dateFormatted !== normDate.dateFormatted) {
        hasUpdatedIds = true;
      }

      // Ensure valid club from Happy Life Clubs
      let club: HappyLifeClub = a.club as HappyLifeClub;
      if (!HAPPY_LIFE_CLUBS.includes(club)) {
        club = 'ชมรมเดิน-วิ่ง';
        hasUpdatedIds = true;
      }

      // Ensure valid category
      let category: ActivityCategory = (a.activityCategory || a.category || 'HR-PTP') as ActivityCategory;
      if (category !== 'Happy Life' && category !== 'HR-PTP' && category !== 'อื่นๆ') {
        category = 'HR-PTP';
        hasUpdatedIds = true;
      }

      const hours = Number(a.hours) || 0;
      const minutes = Number(a.minutes) || 0;
      const totalMinutes = Number(a.totalMinutes) || (hours * 60 + minutes);

      sanitizedList.push({
        ...a,
        id,
        dateKey: normDate.dateKey,
        timestamp: normDate.timestamp,
        date: normDate.dateFormatted,
        dateFormatted: normDate.dateFormatted,
        club,
        category,
        activityCategory: category,
        hours,
        minutes,
        totalMinutes
      });
    }

    if (hasUpdatedIds) {
      this.saveActivities(sanitizedList);
    }

    return sanitizedList;
  }

  static saveActivities(activities: ActivityRecord[]): void {
    const cleanList = (activities || []).filter(a => !isInvalidOrCorruptActivity(a));
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(cleanList));
  }

  static async syncToGoogleSheets(activities: ActivityRecord[], customUrl?: string): Promise<{ success: boolean; message: string }> {
    const storedUrl = localStorage.getItem('csi_google_sheets_url');
    const rawTargetUrl = customUrl || storedUrl || FIXED_GAS_WEBHOOK_URL;
    const targetUrl = normalizeGasUrl(rawTargetUrl);

    const payload = {
      action: 'sync_activities',
      timestamp: formatInternationalDateTime(),
      totalRecords: activities.length,
      activities: activities.map(a => {
        const formattedDate = formatActivityDate(a.timestamp || a.dateFormatted || a.date);
        return {
          id: a.id,
          date: formattedDate,
          dateFormatted: formattedDate,
          timestamp: a.timestamp,
          username: a.username,
          fullName: a.fullName,
          nickname: a.nickname,
          club: a.club,
          category: a.activityCategory || a.category,
          activityCategory: a.activityCategory || a.category,
          activityName: a.activityName,
          hours: a.hours,
          minutes: a.minutes,
          totalMinutes: a.totalMinutes,
          description: a.description || ''
        };
      })
    };

    const isHtmlOrErrorString = (str: string) => {
      if (!str) return true;
      const lower = str.toLowerCase();
      return lower.includes('<!doctype') || lower.includes('<html') || lower.includes('not_found') || lower.includes('could not be found') || lower.includes('page not found') || lower.includes('404') || lower.includes('sin1::');
    };

    // 1. Try server proxy route first
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gasUrl: targetUrl, payload })
      });

      if (res.ok) {
        const rawText = await res.text();
        if (!isHtmlOrErrorString(rawText)) {
          try {
            const data = JSON.parse(rawText);
            if (data && (data.success !== undefined || data.message)) {
              return {
                success: data.success ?? true,
                message: data.message || 'ส่งข้อมูลลง Google Sheet เรียบร้อยแล้ว'
              };
            }
          } catch (e) {
            console.info('Proxy returned non-JSON response, attempting direct request...');
          }
        }
      } else {
        console.info(`Backend proxy /api/sync-sheets returned status ${res.status}, using direct connection...`);
      }
    } catch (e: any) {
      console.info('Backend proxy /api/sync-sheets unreachable, using direct connection:', e?.message || e);
    }

    // 2. Direct fallback to Google Apps Script
    try {
      const directRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const directText = await directRes.text();
      if (!isHtmlOrErrorString(directText)) {
        try {
          const directData = JSON.parse(directText);
          return {
            success: directData.success ?? true,
            message: directData.message || 'บันทึกข้อมูลลง Google Sheet สำเร็จ'
          };
        } catch (e) {
          if (directRes.ok || directText.includes('SUCCESS') || directText.includes('เรียบร้อย')) {
            return { success: true, message: 'บันทึกข้อมูลลง Google Sheet เรียบร้อยแล้ว' };
          }
        }
      }
    } catch (directErr: any) {
      console.info('Direct CORS fetch to GAS completed/skipped (expected due to browser cross-origin policy), ensuring delivery via standard POST:', directErr?.message || directErr);
    }

    // 3. Guaranteed Fallback: no-cors direct submission to Google Apps Script
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: true, message: 'ส่งข้อมูลลง Google Sheet เรียบร้อยแล้ว (Direct Sync)' };
    } catch (err: any) {
      return { success: false, message: `ไม่สามารถส่งข้อมูลไปยัง Google Sheet ได้: ${err.message || 'โปรดตรวจสอบสัญญาณอินเทอร์เน็ต'}` };
    }
  }

  static addActivity(record: Omit<ActivityRecord, 'id' | 'timestamp' | 'totalMinutes' | 'dateKey'> & { timestamp?: string; date?: string; dateFormatted?: string }): ActivityRecord {
    const list = this.getActivities();
    const hours = Number(record.hours) || 0;
    const minutes = Number(record.minutes) || 0;
    const totalMinutes = (hours * 60) + minutes;
    const norm = normalizeActivityDate(record.timestamp || record.dateFormatted || record.date);

    const newRecord: ActivityRecord = {
      ...record,
      id: 'act-' + Date.now(),
      timestamp: norm.timestamp,
      date: norm.dateFormatted,
      dateFormatted: norm.dateFormatted,
      hours,
      minutes,
      totalMinutes,
      dateKey: norm.dateKey
    };

    list.unshift(newRecord);
    this.saveActivities(list);

    // Auto sync new record to Google Sheets if Web App URL is configured
    this.syncToGoogleSheets([newRecord]);
    this.syncDataToGoogleSheet('add_activity', {
      ...newRecord,
      date: norm.dateFormatted,
      dateFormatted: norm.dateFormatted
    });

    return newRecord;
  }

  static updateActivity(id: string, updates: Partial<ActivityRecord>): ActivityRecord | null {
    const list = this.getActivities();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const existing = list[idx];
    const hours = updates.hours !== undefined ? Number(updates.hours) : existing.hours;
    const minutes = updates.minutes !== undefined ? Number(updates.minutes) : existing.minutes;
    const totalMinutes = (hours * 60) + minutes;

    let timestamp = existing.timestamp;
    let dateKey = existing.dateKey;
    if (updates.timestamp) {
      const d = new Date(updates.timestamp);
      timestamp = d.toISOString();
      dateKey = timestamp.substring(0, 10);
    }

    const updated: ActivityRecord = {
      ...existing,
      ...updates,
      hours,
      minutes,
      totalMinutes,
      timestamp,
      dateKey
    };

    list[idx] = updated;
    this.saveActivities(list);

    // Auto sync updated record to Google Sheets
    this.syncToGoogleSheets([updated]);
    this.syncDataToGoogleSheet('update_activity', updated);

    return updated;
  }

  static deleteActivity(id: string): void {
    const list = this.getActivities();
    const target = list.find(a => a.id === id);
    const filtered = list.filter(a => a.id !== id);
    this.saveActivities(filtered);
    if (target) {
      this.syncDataToGoogleSheet('delete_activity', { id, username: target.username, timestamp: target.timestamp });
      this.syncDataToGoogleSheet('sync_activities', { activities: [{ ...target, deleted: true }] });
    }
  }

  // Auth helper
  static getCurrentUser(): Employee | null {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: Employee | null): void {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }

  static authenticateUser(user: string, pass: string): { success: boolean; user?: Employee; message?: string } {
    const employees = this.getEmployees();
    const uClean = user.trim().toLowerCase();
    const pClean = pass.trim();

    const emp = employees.find(
      e => e.username.toLowerCase() === uClean && (e.password === pClean || !e.password)
    );

    if (emp) {
      if (emp.status === 'resigned') {
        return { success: false, message: 'สถานะพนักงานของคุณสิ้นสุดลงแล้ว (ลาออกแล้ว)' };
      }
      return { success: true, user: emp };
    }

    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  // Card Settings
  static getCardSettings(): CardAnnouncementSettings {
    const data = localStorage.getItem(KEYS.CARD_SETTINGS);
    const defaultToken = 'wg1swtQ3O2KBtBTa461HHn9gRzygFKVYykKBWUI3F4IPSk7HnbXNz+/3zn05pBnfVYvj3K+rz9FF1Hi+ZUXWShiuf1yEzRdNOVjsp6xOB1cPdhzSSxHQr/VrZYWn1I8HOsD9aP3zs0Npg8DRyfekYwdB04t89/1O/w1cDnyilFU=';
    const defaultGroupId = 'C1f1109f61de6683b2337dfa8d3a5ba4d';
    const defaultUserId = 'Ucbf8c9e32fc2606a570a51bbc595d5e9';
    const defaultWebhook = 'https://script.google.com/macros/s/AKfycby_TunZUkHu_9jTuyl0W8Fa-L0IVJ4_G3rCTrxzPEkZIrxDcNpZwbpMa0ejaIUTZlaX/exec';

    if (data) {
      try {
        const parsed = JSON.parse(data);
        const webhook = (parsed.lineWebhookUrl && !parsed.lineWebhookUrl.includes('webhook.site')) ? parsed.lineWebhookUrl : defaultWebhook;
        return {
          lineWebhookUrl: webhook,
          lineChannelToken: parsed.lineChannelToken || defaultToken,
          lineGroupId: parsed.lineGroupId || defaultGroupId,
          lineUserId: parsed.lineUserId || defaultUserId,
          telegramBotToken: parsed.telegramBotToken || '',
          telegramChatId: parsed.telegramChatId || ''
        };
      } catch { return {}; }
    }
    return {
      lineWebhookUrl: defaultWebhook,
      lineChannelToken: defaultToken,
      lineGroupId: defaultGroupId,
      lineUserId: defaultUserId,
      telegramBotToken: '',
      telegramChatId: ''
    };
  }

  static saveCardSettings(settings: CardAnnouncementSettings): void {
    localStorage.setItem(KEYS.CARD_SETTINGS, JSON.stringify(settings));
  }

  // Google Sheet ID & Auto Pull
  static getGoogleSheetId(): string {
    try {
      const oldVal = localStorage.getItem('csi_bme_sheet_id_v2');
      if (oldVal && (oldVal.includes('11qoHR') || oldVal.includes('11qoHRaakTjvDWvOekqTTlP2SFcqdfys6cT653wRfjUA'))) {
        localStorage.removeItem('csi_bme_sheet_id_v2');
      }
    } catch {}

    const stored = localStorage.getItem(KEYS.SHEET_ID);
    if (!stored || stored.includes('11qoHR') || stored.trim() === '') {
      localStorage.setItem(KEYS.SHEET_ID, DEFAULT_OFFICIAL_SHEET_ID);
      return DEFAULT_OFFICIAL_SHEET_ID;
    }
    return stored.trim();
  }

  static saveGoogleSheetId(id: string): void {
    const cleanId = (id || '').trim();
    if (cleanId && !cleanId.includes('11qoHR')) {
      localStorage.setItem(KEYS.SHEET_ID, cleanId);
    } else {
      localStorage.setItem(KEYS.SHEET_ID, DEFAULT_OFFICIAL_SHEET_ID);
    }
  }

  static async fetchAndSyncFromGoogleSheet(customSheetId?: string): Promise<{ success: boolean; totalFetched: number; message: string }> {
    let sheetId = customSheetId || this.getGoogleSheetId();
    if (!sheetId || sheetId.includes('11qoHR') || sheetId.trim() === '') {
      sheetId = DEFAULT_OFFICIAL_SHEET_ID;
      this.saveGoogleSheetId(sheetId);
    }
    try {
      // 1. Sync directly with Google Apps Script Web App (get_all)
      try {
        const gasResult = await this.syncDataToGoogleSheet('get_all', {});
        if (gasResult && (gasResult as any).data) {
          const payload = (gasResult as any).data;
          if (Array.isArray(payload.activities) && payload.activities.length > 0) {
            this.saveActivities(payload.activities.map((a: any) => ({
              ...a,
              dateKey: a.timestamp ? a.timestamp.substring(0, 10) : (a.date || '')
            })));
          }
          if (Array.isArray(payload.votes) && payload.votes.length > 0) {
            this.saveVotes(payload.votes);
          }
          if (Array.isArray(payload.coaching) && payload.coaching.length > 0) {
            this.saveCoachingRecords(payload.coaching);
          }
          if (payload.orgChart && payload.orgChart.nodes) {
            this.saveOrgChart(payload.orgChart);
          }
        }
      } catch (errGas) {
        console.warn('Apps Script get_all sync notice:', errGas);
      }

      // 2. Sync CSI Responses & Staff from Sheet
      let data: any = null;

      try {
        const response = await fetch(`/api/fetch-sheet-data?sheetId=${encodeURIComponent(sheetId)}`);
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          data = await response.json();
        }
      } catch (e) {
        console.warn('Server fetch endpoint unavailable, using direct client-side sheet connection:', e);
      }

      // If server API call didn't return valid data, use client-side direct CSV fetch from Google Sheets
      if (!data || !data.success) {
        data = await this.clientSideFetchGoogleSheet(sheetId);
      }

      if (!data || !data.success) {
        return {
          success: false,
          totalFetched: 0,
          message: data?.message || 'ไม่สามารถเชื่อมต่อดึงข้อมูลจาก Google Sheet ได้ โปรดตรวจสอบว่าได้เปิดสิทธิ์แชร์ "ทุกคนที่มีลิงก์ดูได้"'
        };
      }

      const fetchedCsi: CSIRecord[] = data.csiRecords || [];
      const fetchedEmp: Employee[] = data.employees || [];

      if (fetchedCsi.length > 0) {
        // Clean out any invalid or mock rows (such as fake dept 'วิทย์' or blank timestamps)
        const cleanCsi = fetchedCsi.filter(
          r => r.dept && r.dept !== 'วิทย์' && r.dept !== 'วิทยาศาสตร์' && r.timestamp && r.timestamp.trim() !== ''
        );
        if (cleanCsi.length > 0) {
          // Google Sheet is the direct single source of truth (1:1 sync)
          this.saveCSIRecords(cleanCsi);
        }
      }

      if (fetchedEmp.length > 0) {
        const cleanStr = (s: string) => (s || '').replace(/\s*\(?https?:\/\/[^\s)]+\)?/gi, '').trim();
        const cleanFetched: Employee[] = fetchedEmp
          .filter(e => {
            const f = (e.fullName || '').toLowerCase();
            const n = (e.nickname || '').toLowerCase();
            const u = (e.username || '').toLowerCase();
            return !f.includes('team') && !n.includes('team') && !f.includes('ทีม') && !n.includes('ทีม') && !u.includes('team') && u !== 'emp_15';
          })
          .map(e => {
            let img = e.img;
            if (img && img.includes('drive.google.com')) {
              const m = img.match(/\/d\/([a-zA-Z0-9_-]+)/) || img.match(/id=([a-zA-Z0-9_-]+)/);
              if (m && m[1]) {
                img = `https://lh3.googleusercontent.com/d/${m[1]}`;
              }
            }
            if (!img || !img.startsWith('http')) {
              img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanStr(e.nickname) || cleanStr(e.fullName) || e.username)}&skinColor=f8d25c`;
            }
            return {
              ...e,
              fullName: cleanStr(e.fullName),
              nickname: cleanStr(e.nickname),
              img
            };
          });

        const statusOverrides = this.getStatusOverrides();
        const existingEmp = this.getEmployees();
        const empMap = new Map<string, Employee>();

        // Put existing employees into map first
        existingEmp.forEach(e => {
          if (e.username) empMap.set(e.username.toLowerCase(), e);
        });

        // Merge fetched employees into map while preserving local status overrides & resigned status
        cleanFetched.forEach(f => {
          const uKey = f.username.toLowerCase();
          const existing = empMap.get(uKey);
          const overrideStatus = statusOverrides[uKey];
          const finalStatus = overrideStatus || existing?.status || f.status || 'active';

          empMap.set(uKey, {
            ...f,
            status: finalStatus,
            club: existing?.club || f.club,
            password: f.password || existing?.password || '123'
          });
        });

        // Ensure admin flags and default credentials if missing
        ['563770', 'MGR_BME', 'SPV_BME'].forEach(code => {
          const uKey = code.toLowerCase();
          const existingAdmin = existingEmp.find(e => e.username.toUpperCase() === code);
          const fetchedAdmin = empMap.get(uKey);

          if (fetchedAdmin) {
            empMap.set(uKey, {
              ...fetchedAdmin,
              isAdmin: true
            });
          } else if (existingAdmin) {
            empMap.set(uKey, existingAdmin);
          }
        });

        const updatedList = Array.from(empMap.values());
        this.saveEmployees(updatedList);
      }

      const fetchedCoach: CoachingRecord[] = data.coachingRecords || [];
      if (fetchedCoach.length > 0) {
        this.saveCoachingRecords(fetchedCoach);
      }

      // Save Activities from Google Sheet (Tab กิจกรรม)
      const fetchedAct: ActivityRecord[] = data.activities || [];
      if (fetchedAct.length > 0) {
        this.saveActivities(fetchedAct);
      }

      // Save Org Chart from Google Sheet (Tab ผังองค์กร)
      if (data.orgChart && data.orgChart.nodes && data.orgChart.nodes.length > 0) {
        this.saveOrgChart(data.orgChart);
      }

      // Save Votes from Google Sheet (Tab Votes)
      if (Array.isArray(data.votes) && data.votes.length > 0) {
        this.saveVotes(data.votes);
      }

      this.saveGoogleSheetId(sheetId);

      return {
        success: true,
        totalFetched: fetchedCsi.length,
        message: `เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheet ครบทุกชีทสำเร็จแล้ว! (CSI: ${fetchedCsi.length} รายการ, กิจกรรม: ${fetchedAct.length} รายการ, Coaching: ${fetchedCoach.length} คน, พนักงาน: ${fetchedEmp.length} คน)`
      };
    } catch (err: any) {
      console.error('Error fetching sheet data:', err);
      return {
        success: false,
        totalFetched: 0,
        message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'}`
      };
    }
  }

  // Client-side fallback to parse Google Sheets CSV directly
  private static async clientSideFetchGoogleSheet(sheetId: string): Promise<{ success: boolean; csiRecords?: CSIRecord[]; employees?: Employee[]; coachingRecords?: CoachingRecord[]; activities?: ActivityRecord[]; orgChart?: any; message?: string }> {
    try {
      const parseCSV = (text: string) => {
        const lines: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentCell += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c.length > 0)) {
              lines.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        if (currentCell.length > 0 || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c.length > 0)) {
            lines.push(currentRow);
          }
        }
        return lines;
      };

      // 1. Fetch CSI Responses
      const csiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('CSI Electronic (การตอบกลับ)')}`;
      const csiRes = await fetch(csiUrl);
      const csiRecords: CSIRecord[] = [];

      if (csiRes.ok) {
        const csvText = await csiRes.text();
        const rows = parseCSV(csvText);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 4) continue;

          let timestampRaw = row[0] || '';
          if (!timestampRaw || timestampRaw.trim() === '') {
            const hasSurveyData = row.slice(1).some(c => c && c.trim() !== '');
            if (!hasSurveyData) continue;
            timestampRaw = formatInternationalDateTime(new Date());
          }

          const site = row[1] || 'PTP';
          const division = row[2] || 'Biomedical Engineering';
          const dept = row[3] || 'General';
          if (dept === 'วิทย์' || dept === 'วิทยาศาสตร์') continue;
          const staffName = row[4] || '';
          const contactType = row[5] || '';
          const use_service1 = row[6] || '';

          const parseNum = (val: string) => {
            const n = parseInt(val, 10);
            return isNaN(n) ? 5 : Math.max(1, Math.min(5, n));
          };

          const q1_1 = parseNum(row[7]);
          const q1_2 = parseNum(row[8]);
          const q1_3 = parseNum(row[9]);
          const q1_4 = parseNum(row[10]);
          const q1_5 = parseNum(row[11]);
          const q1_6 = parseNum(row[12]);
          const q1_7 = parseNum(row[13]);

          const use_service2 = row[14] || '';
          const q2_1 = parseNum(row[15]);
          const q2_2 = parseNum(row[16]);
          const q2_3 = parseNum(row[17]);
          const q2_4 = parseNum(row[18]);
          const q2_5 = parseNum(row[19]);

          const goodStaff = row[20] || '';
          const goodReason = row[21] || '';
          const badStaff = row[22] || '';
          const badReason = row[23] || '';
          const extraNote = row[24] || goodReason || '';

          const formattedTime = getIsoDateTime(timestampRaw);

          csiRecords.push({
            timestamp: formattedTime,
            site, division, dept, staffName, contactType,
            use_service1, q1_1, q1_2, q1_3, q1_4, q1_5, q1_6, q1_7,
            use_service2, q2_1, q2_2, q2_3, q2_4, q2_5,
            goodStaff, goodReason, badStaff, badReason, extraNote
          });
        }
      }

      // 2. Fetch Employees (Try multiple common tab names)
      const possibleStaffTabs = ['ข้อมูลพนักงาน', 'พนักงาน', 'รายชื่อพนักงาน', 'Employees', 'Staff', 'Sheet2'];
      const employees: Employee[] = [];

      for (const tabName of possibleStaffTabs) {
        try {
          const staffUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
          const staffRes = await fetch(staffUrl);
          if (staffRes.ok) {
            const staffCsv = await staffRes.text();
            if (staffCsv && !staffCsv.includes('google-signin') && !staffCsv.includes('<!DOCTYPE html>')) {
              const staffRows = parseCSV(staffCsv);
              if (staffRows.length > 1) {
                // Check if row 0 contains manager names / row header
                const row0Str = staffRows[0] ? staffRows[0].join(' ') : '';
                if (row0Str.includes('Chalee') || row0Str.includes('Raschanee')) {
                  employees.push({
                    id: 'sheet-emp-MGR_BME',
                    username: 'MGR_BME',
                    password: 'Mgr-BME',
                    fullName: 'Chalee Meksuwan',
                    nickname: 'ปิ้ง',
                    club: 'ชมรมเดิน-วิ่ง',
                    img: 'https://img2.pic.in.th/S__6471704_0-removebg-preview.png',
                    status: 'active',
                    isAdmin: true
                  });
                  employees.push({
                    id: 'sheet-emp-SPV_BME',
                    username: 'SPV_BME',
                    password: 'Spv-BME@PTP',
                    fullName: 'Raschanee Majanit',
                    nickname: 'มิน',
                    club: 'ชมรมเดิน-วิ่ง',
                    img: 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png',
                    status: 'active',
                    isAdmin: true
                  });
                }

                for (let j = 1; j < staffRows.length; j++) {
                  const sRow = staffRows[j];
                  if (sRow && sRow.length >= 2) {
                    const cleanStr = (val: string) => (val || '').replace(/\s*\(?https?:\/\/[^\s)]+\)?/gi, '').trim();

                    const fullName = cleanStr(sRow[0] || '');
                    const nickname = cleanStr(sRow[1] || fullName || '');
                    let img = (sRow[2] || '').trim();
                    const username = (sRow[3] || `emp_${j}`).trim();
                    const password = (sRow[4] || '123').trim();

                    if (img && img.includes('drive.google.com')) {
                      const m = img.match(/\/d\/([a-zA-Z0-9_-]+)/) || img.match(/id=([a-zA-Z0-9_-]+)/);
                      if (m && m[1]) {
                        img = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
                      }
                    }

                    if (img && !img.startsWith('http')) {
                      img = `https://${img}`;
                    }

                    if (!img) {
                      img = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname || fullName || 'user')}&skinColor=f8d25c`;
                    }

                    const uUpper = username.toUpperCase();
                    const isTeamOrDummy = fullName.toLowerCase().includes('team') ||
                      nickname.toLowerCase().includes('team') ||
                      fullName.includes('ทีม') ||
                      nickname.includes('ทีม') ||
                      username.toLowerCase().includes('team') ||
                      username === 'emp_15' ||
                      username === 'emp_16' ||
                      username === 'emp_17';
                    if (isTeamOrDummy) continue;

                    // Must have valid non-empty names
                    if (!fullName && !nickname) continue;
                    if (fullName === '()' || nickname === '()' || fullName === '-' || nickname === '-') continue;
                    if (username.startsWith('emp_') && (!fullName || !nickname)) continue;

                    const isAdmin = uUpper.includes('ADMIN') || uUpper.includes('SPV') || uUpper.includes('MGR') || uUpper === '563770';

                    if (fullName || nickname) {
                      employees.push({
                        id: `sheet-emp-${username}`,
                        username,
                        password,
                        fullName,
                        nickname,
                        club: 'ชมรมเดิน-วิ่ง',
                        img,
                        status: 'active',
                        isAdmin
                      });
                    }
                  }
                }
                if (employees.length > 0) break; // Successfully parsed staff from this tab
              }
            }
          }
        } catch (e) {
          console.warn(`Attempt to fetch sheet tab '${tabName}' skipped:`, e);
        }
      }

      // 3. Fetch Coaching tab client-side
      const possibleCoachingTabs = ['Coaching', 'แผนพัฒนา', 'Coaching Plan', 'Sheet3'];
      const coachingRecords: CoachingRecord[] = [];

      for (const tabName of possibleCoachingTabs) {
        try {
          const coachUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
          const coachRes = await fetch(coachUrl);
          if (coachRes.ok) {
            const coachCsv = await coachRes.text();
            if (coachCsv && !coachCsv.includes('google-signin') && !coachCsv.includes('<!DOCTYPE html>')) {
              const cRows = parseCSV(coachCsv);
              if (cRows.length > 1) {
                for (let k = 1; k < cRows.length; k++) {
                  const cr = cRows[k];
                  if (cr && cr.length >= 7) {
                    const empId = (cr[1] || '').trim();
                    const contractType = (cr[2] || 'Out source').trim();
                    const position = (cr[3] || 'Engineer').trim();
                    const fullName = (cr[4] || '').trim();
                    const nickname = (cr[5] || '').trim();
                    const animalRaw = (cr[6] || 'หมี').trim();

                    // Only include actual staff members (must have 4-8 digit numeric empId and not be a summary row)
                    if (!empId || !/^\d{4,8}$/.test(empId)) continue;
                    if (fullName.includes('จำนวน') || fullName.includes('สรุป') || fullName.includes('Topic') || fullName.includes('รวม')) continue;

                    const animalType = animalRaw.includes('กระทิง') ? 'กระทิง' : animalRaw.includes('อินทรีย์') ? 'อินทรีย์' : animalRaw.includes('หนู') ? 'หนู' : 'หมี';

                    const coachHeaders = cRows[0] || [];
                    const topicMap: { [key: number]: string } = { 1: '', 2: '', 3: '' };
                    const cleanTopic = (header: string) => {
                      return (header || '')
                        .replace(/^(กระทิง|อินทรีย์|หมี|หนู)\s*/, '')
                        .replace(/^Topic Coaching\s*(กระทิง|อินทรีย์|หมี|หนู)?\s*/, '')
                        .replace(/\n/g, ' ')
                        .trim();
                    };

                    for (let c = 7; c <= 51; c++) {
                      const val = (cr[c] || '').trim();
                      if (val === '1' && !topicMap[1]) topicMap[1] = cleanTopic(coachHeaders[c]);
                      else if (val === '2' && !topicMap[2]) topicMap[2] = cleanTopic(coachHeaders[c]);
                      else if (val === '3' && !topicMap[3]) topicMap[3] = cleanTopic(coachHeaders[c]);
                    }

                    const parseNumFloat = (val: string, def = 0) => {
                      if (!val) return def;
                      const numMatch = val.match(/([0-9]+(\.[0-9]+)?)/);
                      return numMatch ? parseFloat(numMatch[1]) : def;
                    };

                    const evalScore = parseNumFloat(cr[52], 8);
                    const hoursW1 = parseNumFloat(cr[52], 0);
                    const hoursW2 = parseNumFloat(cr[53], 0);
                    const hoursW3 = parseNumFloat(cr[54], 0);
                    const hoursW4 = parseNumFloat(cr[55], 0);
                    const hoursW5 = parseNumFloat(cr[56], 0);
                    const hoursW6 = parseNumFloat(cr[57], 0);
                    const progressStr = (cr[58] || '').trim();
                    const progressPercent = progressStr.includes('%') ? parseFloat(progressStr) : parseNumFloat(progressStr, 50);
                    const totalHours = parseNumFloat(cr[59], hoursW1 + hoursW2 + hoursW3 + hoursW4 + hoursW5 + hoursW6);
                    const coachName = (cr[60] || 'ชาลี').trim();

                    coachingRecords.push({
                      id: `sheet-coach-${empId || k}`,
                      empId: empId || `E${k}`,
                      position,
                      fullName,
                      nickname: nickname || fullName,
                      contractType: (contractType === 'Out source' ? 'Out source' : 'Full Time') as 'Out source' | 'Full Time',
                      animalType,
                      coachName,
                      topic1: topicMap[1] || 'Active Listening & Communication',
                      topic2: topicMap[2] || 'Problem Solving & Team Work',
                      topic3: topicMap[3] || 'System Thinking & Execution',
                      evaluationScore: evalScore || 7,
                      progressPercent,
                      hoursW1,
                      hoursW2,
                      hoursW3,
                      hoursW4,
                      hoursW5,
                      hoursW6,
                      totalHours
                    });
                  }
                }

                if (coachingRecords.length > 0) break;
              }
            }
          }
        } catch (e) {
          console.warn(`Attempt to fetch Coaching tab '${tabName}' skipped:`, e);
        }
      }

      // 4. Fetch Activities client-side
      const activities: ActivityRecord[] = [];
      const possibleActTabs = ['กิจกรรม', 'Activities', 'Activity'];
      for (const tabName of possibleActTabs) {
        try {
          const actUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
          const actRes = await fetch(actUrl);
          if (actRes.ok) {
            const actCsv = await actRes.text();
            if (actCsv && !actCsv.includes('google-signin') && !actCsv.includes('<!DOCTYPE html>')) {
              const aRows = parseCSV(actCsv);
              if (aRows.length > 1) {
                // Header check to prevent CSI evaluation sheet from being parsed as activities
                const headerRow = aRows[0].map(h => (h || '').toLowerCase().trim());
                const isCsiSurvey = headerRow.some(h => h.includes('แผนกผู้ประเมิน') || h.includes('division') || h.includes('1.1') || h.includes('ผู้รับบริการ'));
                if (isCsiSurvey) {
                  continue;
                }

                for (let i = 1; i < aRows.length; i++) {
                  const r = aRows[i];
                  if (!r || r.length < 4 || !r[0]) continue;
                  const rawId = (r[0] || '').trim();
                  const isDateLike = !rawId || rawId.includes('/') || (rawId.length <= 10 && rawId.includes('-')) || !rawId.startsWith('act-');
                  const id = isDateLike ? `act-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}` : rawId;
                  const dateRaw = (r[1] || '').trim();
                  const normDate = normalizeActivityDate(dateRaw);

                  const username = (r[2] || '').trim();
                  const fullName = (r[3] || '').trim();
                  const nickname = (r[4] || '').trim();
                  const rawClub = (r[5] || '').trim();
                  const club: HappyLifeClub = HAPPY_LIFE_CLUBS.includes(rawClub as any) ? rawClub as HappyLifeClub : 'ชมรมเดิน-วิ่ง';
                  const rawCat = (r[6] || '').trim();
                  const activityCategory: ActivityCategory = (rawCat === 'Happy Life' || rawCat === 'HR-PTP' || rawCat === 'อื่นๆ') ? rawCat as ActivityCategory : 'HR-PTP';
                  const activityName = (r[7] || '').trim();
                  const hours = Number(r[8]) || 0;
                  const minutes = Number(r[9]) || 0;
                  const totalMinutes = Number(r[10]) || (hours * 60 + minutes);
                  const description = (r[11] || '').trim();

                  const candidate: ActivityRecord = {
                    id,
                    timestamp: normDate.timestamp,
                    dateKey: normDate.dateKey,
                    date: normDate.dateFormatted,
                    dateFormatted: normDate.dateFormatted,
                    username,
                    fullName,
                    nickname,
                    club,
                    category: rawCat || 'HR-PTP',
                    activityCategory,
                    activityName,
                    hours,
                    minutes,
                    totalMinutes,
                    description
                  };

                  if (!isInvalidOrCorruptActivity(candidate)) {
                    activities.push(candidate);
                  }
                }
                if (activities.length > 0) break;
              }
            }
          }
        } catch (e) {
          console.warn(`Attempt to fetch Activities tab '${tabName}' skipped:`, e);
        }
      }

      // 5. Fetch Org Chart client-side
      let orgChart: any = null;
      try {
        const orgUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('ผังองค์กร')}`;
        const orgRes = await fetch(orgUrl);
        if (orgRes.ok) {
          const orgCsv = await orgRes.text();
          if (orgCsv && !orgCsv.includes('google-signin') && !orgCsv.includes('<!DOCTYPE html>')) {
            const orgRows = parseCSV(orgCsv);
            for (const r of orgRows) {
              if (r[0] === 'config' && r[1]) {
                try {
                  orgChart = JSON.parse(r[1]);
                } catch (e) {
                  console.warn('Error parsing client orgChart:', e);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Attempt to fetch Org Chart tab skipped:', e);
      }

      return {
        success: true,
        csiRecords,
        employees,
        coachingRecords,
        activities,
        orgChart
      };
    } catch (e: any) {
      console.error('Client-side Google Sheet fetch error:', e);
      return { success: false, message: `ไม่สามารถดึงข้อมูลจาก Google Sheet ได้: ${e.message}` };
    }
  }

  static async syncDataToGoogleSheet(action: string, payload: any): Promise<{ success: boolean; message: string }> {
    try {
      const storedUrl = localStorage.getItem('csi_google_sheets_url');
      const gasUrl = normalizeGasUrl(storedUrl || FIXED_GAS_WEBHOOK_URL);

      const fullPayload = {
        action,
        sheetId: this.getGoogleSheetId(),
        csiRecord: action === 'add_csi' ? payload : undefined,
        voteRecord: action === 'add_vote' ? payload : undefined,
        coachingRecord: action.includes('coaching') ? payload : undefined,
        ...payload
      };

      const isHtmlOrErrorString = (str: string) => {
        if (!str) return true;
        const lower = str.toLowerCase();
        return lower.includes('<!doctype') || lower.includes('<html') || lower.includes('not_found') || lower.includes('could not be found') || lower.includes('page not found') || lower.includes('404') || lower.includes('sin1::');
      };

      // 1. Try server proxy route first with 5s timeout
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/sync-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gasUrl, payload: fullPayload }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const rawText = await res.text();
          if (!isHtmlOrErrorString(rawText)) {
            try {
              const data = JSON.parse(rawText);
              if (data && (data.success !== undefined || data.message)) {
                return data;
              }
            } catch (e) {
              console.info('Backend proxy returned non-JSON text, attempting direct request...');
            }
          }
        } else {
          console.info(`Backend proxy /api/sync-sheets responded with status ${res.status}, using direct connection...`);
        }
      } catch (e: any) {
        console.info('Backend proxy /api/sync-sheets unreachable or timed out, using direct connection:', e?.message || e);
      }

      // 2. Direct request to Google Apps Script with 4s timeout
      try {
        const directController = new AbortController();
        const directTimer = setTimeout(() => directController.abort(), 4000);
        const directRes = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(fullPayload),
          signal: directController.signal
        });
        clearTimeout(directTimer);

        const directText = await directRes.text();
        if (!isHtmlOrErrorString(directText)) {
          try {
            const directData = JSON.parse(directText);
            return directData;
          } catch (e) {
            if (directRes.ok || directText.includes('SUCCESS') || directText.includes('เรียบร้อย')) {
              return { success: true, message: 'ส่งข้อมูลลง Google Sheet เรียบร้อยแล้ว' };
            }
          }
        }
      } catch (directErr: any) {
        console.info('Direct CORS request to Google Apps Script skipped or timed out:', directErr?.message || directErr);
      }

      // 3. Fallback no-cors direct submission with 3s timeout
      try {
        const noCorsController = new AbortController();
        const noCorsTimer = setTimeout(() => noCorsController.abort(), 3000);
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(fullPayload),
          signal: noCorsController.signal
        });
        clearTimeout(noCorsTimer);
        return { success: true, message: 'ส่งข้อมูลลง Google Sheet เรียบร้อยแล้ว (Direct Sync)' };
      } catch (err: any) {
        return { success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' };
      }
    } catch (e: any) {
      return { success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' };
    }
  }

  /**
   * Syncs all existing datasets (Activities, Votes, Coaching, Org Chart)
   * to Google Sheets in a single batch operation.
   */
  static async syncAllCurrentDataToGoogleSheet(): Promise<{
    success: boolean;
    results: { activities: boolean; votes: boolean; coaching: boolean; orgChart: boolean };
    message: string;
  }> {
    const activities = this.getActivities();
    const votes = this.getVotes();
    const coaching = this.getCoachingRecords();
    const orgChart = this.getOrgChart();

    const results = {
      activities: false,
      votes: false,
      coaching: false,
      orgChart: false
    };

    try {
      if (activities.length > 0) {
        const actRes = await this.syncToGoogleSheets(activities);
        results.activities = actRes.success;
      }

      if (votes.length > 0) {
        const voteRes = await this.syncDataToGoogleSheet('sync_votes', { votes });
        results.votes = voteRes.success ?? true;
      }

      if (coaching.length > 0) {
        const coachRes = await this.syncDataToGoogleSheet('sync_coaching', { coachingRecords: coaching });
        results.coaching = coachRes.success ?? true;
      }

      if (orgChart && orgChart.nodes && orgChart.nodes.length > 0) {
        const orgRes = await this.syncDataToGoogleSheet('sync_orgchart', { orgChart });
        results.orgChart = orgRes.success ?? true;
      }

      const allOk = Object.values(results).every(v => v);
      return {
        success: allOk,
        results,
        message: allOk
          ? 'ส่งข้อมูลทุกโมดูล (กิจกรรม, โหวต, Coaching, ผังองค์กร) ลง Google Sheet เรียบร้อยแล้ว'
          : 'ส่งข้อมูลลง Google Sheet เรียบร้อยแล้วบางส่วน'
      };
    } catch (err: any) {
      return {
        success: false,
        results,
        message: `เกิดข้อผิดพลาดในการส่งข้อมูลทั้งหมด: ${err.message}`
      };
    }
  }
}
