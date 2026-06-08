const titles = {
  dashboard: "대시보드",
  people: "조직·복무자",
  leave: "근무상황",
  approval: "결재함",
  schedule: "출근점검",
  tasks: "업무보드",
  handover: "인수인계",
  care: "고충·면담",
  reports: "보고서",
  policies: "운영설정",
};

const requests = [
  {
    name: "요원 A",
    type: "연가",
    date: "2026.06.18",
    reason: "개인용무",
    status: "팀장 결재 대기",
  },
  {
    name: "요원 C",
    type: "병가",
    date: "2026.06.04",
    reason: "병원 진료",
    status: "증빙 보완 필요",
  },
  {
    name: "요원 D",
    type: "공가",
    date: "2026.06.11",
    reason: "소집 관련 교육",
    status: "결재 완료",
  },
];

const leaveRules = {
  연가: {
    title: "연가",
    standard: "잔여일수와 업무 공백 확인",
    evidence: "기본 증빙 없음",
    attendance: "반차 시작 시각과 퇴실 기록 확인",
    record: "결재 후 월말 반영 대기",
  },
  병가: {
    title: "병가",
    standard: "사용 일수와 기존 병가 이력 확인",
    evidence: "진료확인서 등 민감 증빙 암호화 저장",
    attendance: "신청 시각과 출입 기록 확인",
    record: "보완 완료 건만 승인 처리",
  },
  공가: {
    title: "공가",
    standard: "교육, 소집, 공문 일정과 신청 기간 대조",
    evidence: "공문, 교육 수료내역, 참석 확인자료 필요",
    attendance: "기관 외부 일정으로 분류",
    record: "공가 유형으로 분류해 월말 기록에 반영",
  },
  특별휴가: {
    title: "특별휴가",
    standard: "기관장 승인 필요 여부와 부여 사유 확인",
    evidence: "부여 근거 자료와 담당자 확인 의견 필요",
    attendance: "해당 기간 출결 예외 등록",
    record: "승인 사유와 부여 일수 보관",
  },
  허가조퇴: {
    title: "허가조퇴",
    standard: "기관 근무시간표 기준으로 누적 환산",
    evidence: "사유 입력 및 담당자 확인",
    attendance: "퇴실 시각과 신청 시각 확인",
    record: "누적 8시간당 1일 환산 대상에 자동 반영",
  },
  병가지각: {
    title: "병가지각",
    standard: "지각 시간과 병가 사유 분리 관리",
    evidence: "진료 예약·확인자료 등 최소 증빙 저장",
    attendance: "입실 지연 기록과 신청 시각 확인",
    record: "병가성 지각으로 분류하고 월말 대조표에 표시",
  },
};

const viewTitle = document.querySelector("#view-title");
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const requestList = document.querySelector("#request-list");
const leaveForm = document.querySelector("#leave-form");
const leaveType = document.querySelector("#leave-type");
const pendingCount = document.querySelector("#pending-count");
const toast = document.querySelector("#toast");
const basePendingApprovals = 5;
const ruleTitle = document.querySelector("#rule-title");
const ruleStandard = document.querySelector("#rule-standard");
const ruleEvidence = document.querySelector("#rule-evidence");
const ruleAttendance = document.querySelector("#rule-attendance");
const ruleRecord = document.querySelector("#rule-record");

function renderRequests() {
  requestList.innerHTML = requests
    .map(
      (request) => `
        <article class="request-card">
          <div>
            <strong>${request.name} · ${request.type}</strong>
            <p>${request.date} · ${request.reason}</p>
          </div>
          <mark class="mark ${getStatusClass(request.status)}">${request.status}</mark>
        </article>
      `
    )
    .join("");

  pendingCount.textContent = `${requests.filter((request) => !request.status.includes("완료")).length + basePendingApprovals}건`;
}

function getStatusClass(status) {
  if (status.includes("완료")) return "ok";
  if (status.includes("보완")) return "risk";
  if (status.includes("대기")) return "wait";
  return "info";
}

function switchView(nextView) {
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === nextView));
  views.forEach((view) => view.classList.toggle("active", view.id === `${nextView}-view`));
  viewTitle.textContent = titles[nextView] || titles.dashboard;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function renderLeaveRule(type) {
  const rule = leaveRules[type] || leaveRules.연가;
  ruleTitle.textContent = rule.title;
  ruleStandard.textContent = rule.standard;
  ruleEvidence.textContent = rule.evidence;
  ruleAttendance.textContent = rule.attendance;
  ruleRecord.textContent = rule.record;
}

navItems.forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.view));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.jump));
});

leaveType.addEventListener("change", () => renderLeaveRule(leaveType.value));

leaveForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.querySelector("#member-name").value;
  const type = document.querySelector("#leave-type").value;
  const startDate = document.querySelector("#start-date").value.replaceAll("-", ".");
  const endDate = document.querySelector("#end-date").value.replaceAll("-", ".");
  const reason = document.querySelector("#leave-reason").value.trim() || "사유 입력 대기";
  const date = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

  requests.unshift({
    name,
    type,
    date,
    reason,
    status: "담당자 검토 대기",
  });

  renderRequests();
  leaveForm.reset();
  document.querySelector("#start-date").value = "2026-06-18";
  document.querySelector("#end-date").value = "2026-06-18";
  renderLeaveRule(leaveType.value);
  showToast(`${name} ${type} 신청이 결재함에 추가되었습니다.`);
});

renderLeaveRule(leaveType.value);
renderRequests();

window.addEventListener("load", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
