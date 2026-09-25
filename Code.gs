/**
 * ============================================================================
 * Google Apps Script for CSI BME PTP & Happy Life Activity System
 * Spreadsheet ID: 1eswu63LgsBcdAZZeRvfnJ5v3SlkM7n1y3K5Hwbc-Ryw
 * ============================================================================
 * วิธีใช้งาน:
 * 1. เปิดไฟล์ Google Sheet ของคุณ
 * 2. ไปที่เมนู ส่วนขยาย (Extensions) -> Apps Script
 * 3. ลบโค้ดเดิมทั้งหมดใน Code.gs แล้วคัดลอกโค้ดนี้ไปวางทั้งหมด
 * 4. กดปุ่มบันทึก (รูปแผ่นดิสก์)
 * 5. กดปุ่ม การทำให้ใช้งานได้ (Deploy) -> การทำให้ใช้งานได้รายการใหม่ (New deployment)
 * 6. เลือกประเภท: เว็บแอป (Web app)
 *    - Execute as: ตัวฉัน (Me)
 *    - Who has access: ทุกคน (Anyone)
 * 7. กด ทำให้ใช้งานได้ (Deploy) และอนุญาตสิทธิ์ (Authorize access)
 * ============================================================================
 */

var SPREADSHEET_ID = "1eswu63LgsBcdAZZeRvfnJ5v3SlkM7n1y3K5Hwbc-Ryw";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch(e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

// ----------------------------------------------------------------------------
// GET: ตรวจสอบสถานะการเชื่อมต่อ และดูจำนวนแถวในแต่ละแท็บ
// ----------------------------------------------------------------------------
function doGet(e) {
  return handleRequest(e);
}

// ----------------------------------------------------------------------------
// POST: บันทึกข้อมูลและซิงค์ข้อมูลจากเว็บแอปลงชีท
// ----------------------------------------------------------------------------
function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var ss = getSpreadsheet();
    var contents = e && e.postData ? e.postData.contents : null;
    var data = null;

    if (contents) {
      try { data = JSON.parse(contents); } catch(err) {}
    } else if (e && e.parameter && e.parameter.data) {
      try { data = JSON.parse(e.parameter.data); } catch(err) {}
    }

    // หากเปิดดูผ่าน Browser ตรงๆ หรือไม่มีข้อมูลส่งมา ให้แสดงสถานะของทุกชีท
    if (!data) {
      var csiSheet = ss.getSheetByName("CSI Electronic (การตอบกลับ)") || ss.getSheets()[0];
      var staffSheet = ss.getSheetByName("ข้อมูลพนักงาน") || ss.getSheetByName("Staff") || ss.getSheetByName("พนักงาน");
      var coachSheet = ss.getSheetByName("Coaching") || ss.getSheetByName("Coaching Data");
      var actSheet = ss.getSheetByName("กิจกรรม") || ss.getSheetByName("Activities");
      var orgSheet = ss.getSheetByName("ผังองค์กร");
      var voteSheet = ss.getSheetByName("Votes");

      var statusData = {
        success: true,
        message: "ระบบเชื่อมต่อ Google Sheet ครบทุกแท็บเรียบร้อยแล้ว",
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        sheets: {
          csi: {
            sheetName: csiSheet ? csiSheet.getName() : "ไม่พบ",
            totalRows: csiSheet ? Math.max(0, csiSheet.getLastRow() - 1) : 0
          },
          employees: {
            sheetName: staffSheet ? staffSheet.getName() : "ไม่พบ",
            totalRows: staffSheet ? Math.max(0, staffSheet.getLastRow() - 1) : 0
          },
          coaching: {
            sheetName: coachSheet ? coachSheet.getName() : "ไม่พบ",
            totalRows: coachSheet ? Math.max(0, coachSheet.getLastRow() - 1) : 0
          },
          activities: {
            sheetName: actSheet ? actSheet.getName() : "ไม่พบ",
            totalRows: actSheet ? Math.max(0, actSheet.getLastRow() - 1) : 0
          },
          orgChart: {
            sheetName: orgSheet ? orgSheet.getName() : "ไม่พบ",
            exists: !!orgSheet
          },
          votes: {
            sheetName: voteSheet ? voteSheet.getName() : "ไม่พบ",
            totalRows: voteSheet ? Math.max(0, voteSheet.getLastRow() - 1) : 0
          }
        }
      };

      return ContentService.createTextOutput(JSON.stringify(statusData, null, 2))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var action = data.action;

    // 1. ซ่อม ID ซ้ำในแท็บกิจกรรม (fix_duplicate_ids)
    if (action === "fix_duplicate_ids") {
      var fixResult = RUN_ซ่อมIDซ้ำ();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: fixResult }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. บันทึกผลประเมิน CSI (add_csi)
    if (action === "add_csi" || data.csiRecord) {
      var csi = data.csiRecord || data;
      var sheet = ss.getSheetByName("CSI Electronic (การตอบกลับ)") || ss.getSheets()[0];
      sheet.appendRow([
        csi.timestamp || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        csi.site || "PTP",
        csi.division || "Biomedical Engineering",
        csi.dept || "",
        csi.staffName || "",
        csi.contactType || "",
        csi.use_service1 || "ใช้บริการ",
        csi.q1_1 || 5, csi.q1_2 || 5, csi.q1_3 || 5, csi.q1_4 || 5, csi.q1_5 || 5, csi.q1_6 || 5, csi.q1_7 || 5,
        csi.use_service2 || "ใช้บริการ",
        csi.q2_1 || 5, csi.q2_2 || 5, csi.q2_3 || 5, csi.q2_4 || 5, csi.q2_5 || 5,
        csi.goodStaff || "",
        csi.goodReason || "",
        csi.badStaff || "",
        csi.badReason || "",
        csi.extraNote || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกผลการประเมิน CSI สำเร็จเรียบร้อย!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. บันทึกกิจกรรม (add_activity)
    if (action === "add_activity" || data.activityRecord || (data.activities && data.activities.length > 0)) {
      var sheet = ss.getSheetByName("กิจกรรม") || ss.getSheetByName("Activities");
      if (!sheet) {
        sheet = ss.insertSheet("กิจกรรม");
        sheet.appendRow(["ID", "วันที่ทำกิจกรรม", "รหัสพนักงาน", "ชื่อผู้บันทึก", "ชื่อเล่น", "ชมรม", "หมวดหมู่", "ชื่อกิจกรรม", "ชั่วโมง", "นาที", "นาทีรวม", "รายละเอียด"]);
      }
      var acts = data.activities || [data.activityRecord || data];
      acts.forEach(function(act) {
        var actId = act.id || ("act-" + new Date().getTime());
        var actDate = act.dateFormatted || act.date || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
        sheet.appendRow([
          actId,
          actDate,
          act.username || "",
          act.fullName || "",
          act.nickname || "",
          act.club || "",
          act.category || act.activityCategory || "HR-PTP",
          act.activityName || "",
          act.hours || 0,
          act.minutes || 0,
          act.totalMinutes || ((act.hours || 0) * 60 + (act.minutes || 0)),
          act.description || ""
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกกิจกรรมเรียบร้อยแล้ว!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. บันทึก/อัปเดตข้อมูล Coaching (update_coaching / save_coaching)
    if (action === "update_coaching" || action === "save_coaching" || data.coachingRecord) {
      var coach = data.coachingRecord || data;
      var sheet = ss.getSheetByName("Coaching Data") || ss.getSheetByName("Coaching");
      if (!sheet) {
        sheet = ss.insertSheet("Coaching Data");
        sheet.appendRow(["วันที่บันทึก", "รหัสพนักงาน", "ชื่อ-นามสกุล", "ชื่อเล่น", "ตำแหน่ง", "ประเภทสัญญา", "ลักษณะสัตว์ (DISC)", "โค้ชผู้ดูแล", "W1 (ชม.)", "W2 (ชม.)", "W3 (ชม.)", "W4 (ชม.)", "W5 (ชม.)", "W6 (ชม.)", "ชั่วโมงรวม", "ความก้าวหน้า (%)"]);
      }
      sheet.appendRow([
        Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        coach.empId || "",
        coach.fullName || "",
        coach.nickname || "",
        coach.position || "",
        coach.contractType || "",
        coach.animalType || "",
        coach.coachName || "",
        coach.hoursW1 || 0,
        coach.hoursW2 || 0,
        coach.hoursW3 || 0,
        coach.hoursW4 || 0,
        coach.hoursW5 || 0,
        coach.hoursW6 || 0,
        coach.totalHours || 0,
        (coach.progressPercent || 0) + "%"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกข้อมูล Coaching เรียบร้อยแล้ว!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. บันทึกผลโหวต (add_vote)
    if (action === "add_vote" || data.voteRecord) {
      var v = data.voteRecord || data;
      var sheet = ss.getSheetByName("Votes") || ss.insertSheet("Votes");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Voter", "Category", "Nominee", "VoteMonth"]);
      }
      sheet.appendRow([
        v.timestamp || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
        v.voter || "",
        v.category || "",
        v.nominee || "",
        v.voteMonth || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกผลโหวตเรียบร้อยแล้ว!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. บันทึกผังองค์กร (save_org_chart)
    if (action === "save_org_chart" || data.orgChart) {
      var orgData = data.orgChart || data;
      var sheet = ss.getSheetByName("ผังองค์กร") || ss.insertSheet("ผังองค์กร");
      sheet.clearContents();
      sheet.appendRow(["key", "value", "updatedAt"]);
      sheet.appendRow(["config", JSON.stringify(orgData), Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกผังองค์กรลงชีทเรียบร้อยแล้ว!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "รับคำสั่งเรียบร้อยแล้ว" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ERROR: " + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------------------------------------------------------------------
// ฟังก์ชัน RUN_ซ่อมIDซ้ำ: สำหรับเลือกกดรันใน Apps Script Editor เพื่อแก้ปัญหา ID ซ้ำ
// ----------------------------------------------------------------------------
function RUN_ซ่อมIDซ้ำ() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("กิจกรรม") || ss.getSheetByName("Activities");
  if (!sheet) return "ไม่พบแท็บกิจกรรม";

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return "ไม่มีข้อมูลกิจกรรมในชีท";

  var seen = {};
  var fixedCount = 0;

  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0] || "").trim();
    if (!id || seen[id]) {
      var newId = "act-" + (new Date().getTime() + i);
      sheet.getRange(i + 1, 1).setValue(newId);
      seen[newId] = true;
      fixedCount++;
    } else {
      seen[id] = true;
    }
  }

  Logger.log("ซ่อม ID ซ้ำเรียบร้อยแล้ว จำนวน: " + fixedCount + " รายการ");
  return "ซ่อม ID ซ้ำเรียบร้อยแล้ว จำนวน " + fixedCount + " รายการ";
}
