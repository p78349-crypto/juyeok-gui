const STORAGE_KEY = "zhouyi_gui_state_v1";
const RECENT_KEY = "zhouyi_gui_recent_v1";
const LOCALE_KEY = "zhouyi_gui_locale_v1";
const lines = []; // bottom -> top, values 6/7/8/9
let selectedRuleCount = null;
const ruleChecks = {};
let recentRecords = [];
let recentFilter = "전체";
let pendingTemplate = "";
let transitionHintExpanded = false;
const TAG_I18N_KEY = {
  일반: "tag.general",
  직장: "tag.work",
  사업: "tag.business",
  인간관계: "tag.relationship"
};
const HEX_PRACTICE_BY_TAG = (typeof window !== "undefined" && window.HEX_PRACTICE_BY_TAG)
  ? window.HEX_PRACTICE_BY_TAG
  : {};
const I18N = (typeof window !== "undefined" && window.GUI_I18N) ? window.GUI_I18N : { packs: {}, locales: ["ko"], defaultLocale: "ko", localeNames: { ko: "한국어" } };
let currentLocale = localStorage.getItem(LOCALE_KEY) || I18N.defaultLocale || "ko";

function t(key, fallback = "") {
  const packs = I18N.packs || {};
  const base = packs.en || {};
  const current = packs[currentLocale] || {};
  return current[key] || base[key] || fallback;
}

function tf(key, values = {}, fallback = "") {
  let text = t(key, fallback);
  Object.entries(values).forEach(([token, value]) => {
    text = text.replaceAll(`{${token}}`, String(value));
  });
  return text;
}

function isKoreanUI() {
  return currentLocale === "ko";
}

function displayTag(tagValue) {
  const key = TAG_I18N_KEY[tagValue] || "tag.general";
  return t(key, tagValue || "");
}

function applyStaticI18n() {
  document.documentElement.lang = currentLocale;
  const isRtl = ["ar"].includes(currentLocale);
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", isRtl);
  document.title = t("app.title", "주역 실사용 GUI");

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    node.textContent = t(key, node.textContent || "");
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (!key) return;
    node.setAttribute("placeholder", t(key, node.getAttribute("placeholder") || ""));
  });

  const localeSelect = document.getElementById("localeSelect");
  if (localeSelect) {
    localeSelect.innerHTML = "";
    (I18N.locales || ["ko"]).forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = I18N.localeNames && I18N.localeNames[code] ? I18N.localeNames[code] : code;
      localeSelect.appendChild(option);
    });
    if (![...localeSelect.options].some((opt) => opt.value === currentLocale)) {
      currentLocale = I18N.defaultLocale || "ko";
    }
    localeSelect.value = currentLocale;
  }
}

const HEX_DATA = [
  [1, "乾", "창조적 추진력으로 시작하되, 끝까지 바른 원칙을 지킨다."],
  [2, "坤", "받아들이고 길러내는 힘으로, 겸손한 순응이 큰 성과를 만든다."],
  [3, "屯", "시작의 혼란은 당연하니, 서두르지 말고 기반을 다진다."],
  [4, "蒙", "미숙함을 인정하고 좋은 스승·질문으로 배움을 연다."],
  [5, "需", "때가 무르익을 때까지 준비하며 기다림의 질을 높인다."],
  [6, "訟", "다툼은 이겨도 상처가 남으니, 원칙과 중재로 정리한다."],
  [7, "師", "조직은 규율과 책임이 있을 때만 힘을 제대로 쓴다."],
  [8, "比", "연대는 신뢰에서 시작되며, 함께할 사람을 바르게 고른다."],
  [9, "小畜", "작은 축적이 큰 변화를 만든다."],
  [10, "履", "예의와 절도로 위험한 상황을 조심스럽게 건넌다."],
  [11, "泰", "하늘과 땅이 통하듯, 소통이 열리면 만사가 순조롭다."],
  [12, "否", "막힌 때에는 무리한 확장보다 내실과 원칙을 지킨다."],
  [13, "同人", "뜻을 같이하는 사람과 공공의 목표를 세운다."],
  [14, "大有", "크게 가졌을수록 더 크게 나눌 책임이 따른다."],
  [15, "謙", "겸손은 자신을 낮추는 것이 아니라 성장을 여는 기술이다."],
  [16, "豫", "기쁨과 동원은 준비된 질서 속에서 지속된다."],
  [17, "隨", "따름은 맹종이 아니라, 도리에 맞는 유연한 적응이다."],
  [18, "蠱", "썩은 것을 고치려면 원인부터 바로잡아야 한다."],
  [19, "臨", "지도자는 가까이 다가가되, 때의 변화를 미리 읽는다."],
  [20, "觀", "멈춰 보고 성찰할 때 방향이 선명해진다."],
  [21, "噬嗑", "막힘은 단호한 기준과 집행으로 뚫어야 한다."],
  [22, "賁", "꾸밈은 본질을 돋보이게 할 때만 가치가 있다."],
  [23, "剝", "깎여 나가는 시기에는 불필요를 버티기보다 줄인다."],
  [24, "復", "돌아옴은 끝이 아니라 새 순환의 출발점이다."],
  [25, "无妄", "억지와 계산을 버리고 바른 마음으로 임한다."],
  [26, "大畜", "크게 쌓으려면 능력과 덕을 함께 축적해야 한다."],
  [27, "頤", "무엇을 먹고 말하느냐가 삶의 품격을 만든다."],
  [28, "大過", "과중한 짐은 구조를 바꾸지 않으면 무너진다."],
  [29, "坎", "거듭된 위험 속에서도 중심을 지키면 길이 열린다."],
  [30, "離", "밝음은 집착이 아니라, 바른 대상에 붙어 생긴다."],
  [31, "咸", "진정한 감응은 서로를 움직이는 존중에서 나온다."],
  [32, "恆", "큰 성취는 재능보다 꾸준함의 힘에서 나온다."],
  [33, "遯", "물러남은 패배가 아니라 때를 위한 전략이다."],
  [34, "大壯", "큰 힘은 절제될 때 정당성과 지속성을 얻는다."],
  [35, "晉", "전진의 때에는 공을 독점하지 말고 밝게 공유한다."],
  [36, "明夷", "빛이 다친 때에는 드러냄보다 내면의 불씨를 지킨다."],
  [37, "家人", "집안의 질서와 역할이 사회의 기본을 이룬다."],
  [38, "睽", "다름은 충돌의 원인인 동시에 새로운 균형의 출발점이다."],
  [39, "蹇", "막힐수록 정면돌파보다 우회와 협력이 유효하다."],
  [40, "解", "얽힘이 풀릴 때는 보복보다 정리와 회복을 우선한다."],
  [41, "損", "덜어냄은 손실이 아니라 본질 회복의 과정이다."],
  [42, "益", "더함은 공평하게 흐를 때 공동의 번영이 된다."],
  [43, "夬", "결단은 늦추면 화를 키우고, 성급하면 사람을 잃는다."],
  [44, "姤", "강한 유혹이나 돌발 만남은 경계와 기준이 필요하다."],
  [45, "萃", "모임은 숫자보다 중심 가치가 분명해야 오래간다."],
  [46, "升", "오름은 한 번의 도약보다 성실한 누적에서 생긴다."],
  [47, "困", "곤궁은 외적 제약보다 내적 태도를 시험한다."],
  [48, "井", "우물처럼 공동 기반을 돌보면 모두가 오래 산다."],
  [49, "革", "혁신은 명분, 시기, 실행이 맞아야 성공한다."],
  [50, "鼎", "그릇을 세우듯 제도와 문화가 성과를 담아낸다."],
  [51, "震", "큰 충격은 두려움을 깨움으로 바꿀 때 의미가 있다."],
  [52, "艮", "멈춤을 아는 사람이 다시 움직일 때 정확하다."],
  [53, "漸", "점진적 진전은 느려 보여도 가장 안정적이다."],
  [54, "歸妹", "관계의 자리와 순서를 어기면 불균형이 생긴다."],
  [55, "豐", "풍성함의 절정에서 오히려 절제와 분배를 생각한다."],
  [56, "旅", "떠도는 때에는 뿌리보다 태도와 규범이 신분증이 된다."],
  [57, "巽", "부드러운 침투가 강한 압박보다 멀리 간다."],
  [58, "兌", "기쁨의 소통은 진실성과 신뢰가 있을 때 힘이 난다."],
  [59, "渙", "흩어짐은 중심을 다시 세울 기회가 된다."],
  [60, "節", "절제는 억압이 아니라 지속가능성을 위한 경계선이다."],
  [61, "中孚", "중심의 믿음은 말보다 일관된 행동에서 드러난다."],
  [62, "小過", "작은 일의 과오를 가볍게 보면 큰 균열로 번진다."],
  [63, "既濟", "이미 이루었을 때가 가장 경계가 필요한 순간이다."],
  [64, "未濟", "미완은 실패가 아니라 다음 완성으로 가는 문턱이다."]
];

const TRIGRAM_INDEX = {
  "111": 0, // ☰
  "110": 1, // ☱
  "101": 2, // ☲
  "100": 3, // ☳
  "011": 4, // ☴
  "010": 5, // ☵
  "001": 6, // ☶
  "000": 7  // ☷
};

// Row: lower trigram, Col: upper trigram
const KING_WEN_MATRIX = [
  [1, 43, 14, 34, 9, 5, 26, 11],
  [10, 58, 38, 54, 61, 60, 41, 19],
  [13, 49, 30, 55, 37, 63, 22, 36],
  [25, 17, 21, 51, 42, 3, 27, 24],
  [44, 28, 50, 32, 57, 48, 18, 46],
  [6, 47, 64, 40, 59, 29, 4, 7],
  [33, 31, 56, 62, 53, 39, 52, 15],
  [12, 45, 35, 16, 20, 8, 23, 2]
];

const QUESTION_TEMPLATES = {
  일반: [
    "지금 계획을 그대로 유지하는 것이 맞을까?",
    "이번 결정에서 가장 먼저 점검할 위험은 무엇일까?",
    "지금은 전진보다 정비가 필요한 시기일까?"
  ],
  직장: [
    "이번 분기 역할 변경 제안을 수락해도 될까?",
    "현 팀에서 성과를 높이려면 무엇을 먼저 바꿔야 할까?",
    "이직 결정 전 마지막으로 확인할 기준은 무엇일까?"
  ],
  사업: [
    "신규 투자/확장을 지금 실행해도 될까?",
    "매출보다 먼저 고정해야 할 운영 지표는 무엇일까?",
    "현재 파트너십을 유지할지 재조정할지 판단 기준은 무엇일까?"
  ],
  인간관계: [
    "이 관계에서 지금 대화를 먼저 시도하는 것이 맞을까?",
    "거리 조정이 필요한 관계인지 어떻게 판단할까?",
    "오해를 풀기 위해 오늘 할 수 있는 가장 작은 행동은 무엇일까?"
  ]
};

const XICI_BY_HEX = {
  1: { title: "자강불식", body: "힘이 클수록 스스로를 단련하며 원칙을 먼저 세웁니다." },
  2: { title: "후덕재물", body: "앞서기보다 받쳐 주는 질서가 장기 성과를 만듭니다." },
  3: { title: "초창기 정돈", body: "혼란의 초기에 속도보다 기초 설계를 우선합니다." },
  4: { title: "질문과 학습", body: "모름을 숨기지 말고 묻고 고치며 방향을 잡습니다." },
  5: { title: "대기와 준비", body: "기다림의 시간에 체력과 기준을 비축합니다." },
  6: { title: "분쟁 절제", body: "감정 승부보다 규칙·증빙·중재를 우선합니다." },
  7: { title: "조직과 규율", body: "권한보다 역할·책임·지휘 체계를 먼저 세웁니다." },
  8: { title: "연대의 기준", body: "가까움보다 신뢰 이력으로 동맹을 선택합니다." },
  9: { title: "소축의 누적", body: "작은 완료를 반복해 큰 전환의 기반을 쌓습니다." },
  10: { title: "예와 절도", body: "민감한 국면일수록 표현과 절차를 지켜 건넙니다." },
  11: { title: "통달의 운영", body: "순조로울 때 표준을 문서화해 흐름을 고정합니다." },
  12: { title: "막힘의 보전", body: "불통기에는 확장보다 손실 방어와 내실을 택합니다." },
  13: { title: "공공의 결집", body: "개인 취향보다 공동 목표 문장을 선명히 합니다." },
  14: { title: "대유의 책임", body: "많이 가진 시기일수록 분배 원칙을 먼저 세웁니다." },
  15: { title: "겸손의 기술", body: "낮춤은 약함이 아니라 영향력을 지키는 방식입니다." },
  16: { title: "예열의 조직화", body: "사기가 오를 때 일정·역할·리듬을 함께 고정합니다." },
  17: { title: "수의 유연성", body: "원칙은 고정하고 방법은 상황에 맞게 조정합니다." },
  18: { title: "고폐의 수선", body: "반복 문제는 사람 탓보다 구조 수리로 접근합니다." },
  19: { title: "임의 접근", body: "리더는 보고보다 현장 관찰 빈도를 높입니다." },
  20: { title: "관의 성찰", body: "판단이 흐릴수록 반응 전에 관찰 기간을 둡니다." },
  21: { title: "기준의 집행", body: "초기 위반을 명확히 처리해 팀의 질서를 지킵니다." },
  22: { title: "문질의 균형", body: "포장보다 본질을 우선하고 꾸밈은 보조로 씁니다." },
  23: { title: "박의 감량", body: "쇠퇴기에는 핵심만 남기고 불필요를 덜어냅니다." },
  24: { title: "복의 재시동", body: "복귀는 작은 루틴의 재가동에서 시작됩니다." },
  25: { title: "무망의 정직", body: "억지 계산보다 투명한 기준이 평판을 만듭니다." },
  26: { title: "대축의 비축", body: "도약 전 실력·자본·집중력을 충분히 모읍니다." },
  27: { title: "이의 양생", body: "무엇을 받아들이고 말하느냐가 결과를 결정합니다." },
  28: { title: "대과의 구조", body: "과부하는 의지로 버티지 말고 구조를 바꿉니다." },
  29: { title: "감의 반복위기", body: "연속 위험에서는 표준 대응과 일관성을 지킵니다." },
  30: { title: "리의 명료성", body: "밝힘은 과시가 아니라 정확한 설명에서 생깁니다." },
  31: { title: "함의 감응", body: "압박보다 공감이 설득의 출발점이 됩니다." },
  32: { title: "항의 지속", body: "예측 가능한 반복이 신뢰를 장기 축적합니다." },
  33: { title: "둔의 이탈", body: "불리한 싸움에서는 전략적 후퇴가 최선입니다." },
  34: { title: "대장의 절제", body: "큰 힘은 자기 통제를 지킬 때만 정당합니다." },
  35: { title: "진의 공유", body: "성장기에는 공을 나누고 지식을 확산합니다." },
  36: { title: "명이의 보존", body: "거친 환경에서는 빛을 낮춰 실력을 보존합니다." },
  37: { title: "가인의 규범", body: "가까운 조직일수록 역할·경계·책임을 명확히 합니다." },
  38: { title: "규의 공존", body: "다름을 틀림으로 몰지 말고 공존 설계를 찾습니다." },
  39: { title: "건의 우회", body: "막히면 정면돌파보다 경로 변경과 협업을 택합니다." },
  40: { title: "해의 회복", body: "문제 해소 뒤 재발 방지 규칙까지 완성합니다." },
  41: { title: "손의 정리", body: "덜어내기는 손실이 아니라 핵심 복원의 방법입니다." },
  42: { title: "익의 환류", body: "이익은 구성원 전체로 흐를 때 지속됩니다." },
  43: { title: "쾌의 결단", body: "미뤄온 결정은 기준 공개 후 단호히 집행합니다." },
  44: { title: "구의 경계", body: "돌발 제안일수록 검증 절차를 먼저 통과시킵니다." },
  45: { title: "췌의 결집", body: "모임은 숫자보다 목적·규칙·기간이 핵심입니다." },
  46: { title: "승의 누진", body: "급점프보다 계단형 목표가 장기적으로 안전합니다." },
  47: { title: "곤의 압축", body: "자원 부족기에는 핵심 업무에 집중을 압축합니다." },
  48: { title: "정의 기반", body: "공동 인프라를 돌보는 투자가 가장 오래 갑니다." },
  49: { title: "혁의 전환", body: "변화는 명분·교육·전환 일정이 함께 있어야 성공합니다." },
  50: { title: "정의 거버넌스", body: "성과를 담는 그릇은 사람보다 시스템이 만듭니다." },
  51: { title: "진의 각성", body: "충격 이후 즉시 재발 방지 체계를 세웁니다." },
  52: { title: "간의 멈춤", body: "멈춤은 포기가 아니라 오판을 줄이는 기술입니다." },
  53: { title: "점의 단계성", body: "느린 누적이라도 방향이 맞으면 결국 도달합니다." },
  54: { title: "귀매의 자리", body: "역할·권한·순서가 어긋나면 균열이 커집니다." },
  55: { title: "풍의 절정관리", body: "풍성할수록 과열을 막는 분배와 우선순위가 필요합니다." },
  56: { title: "려의 적응", body: "낯선 환경에서는 예의·규범·태도가 신뢰를 만듭니다." },
  57: { title: "손의 침투", body: "강요보다 반복 설득이 변화를 정착시킵니다." },
  58: { title: "태의 소통", body: "즐거운 대화도 핵심 약속 준수와 함께 가야 합니다." },
  59: { title: "환의 재집중", body: "흩어짐의 시기에는 중심 가치부터 재선언합니다." },
  60: { title: "절의 한계", body: "경계 설정은 억압이 아니라 지속가능성 확보입니다." },
  61: { title: "중부의 신의", body: "진심은 말보다 약속 이행률로 증명됩니다." },
  62: { title: "소과의 세부", body: "큰 전략보다 디테일 관리가 성패를 가릅니다." },
  63: { title: "기제의 경계", body: "완료 직후가 가장 위험하니 사후관리를 강화합니다." },
  64: { title: "미제의 마무리", body: "마지막 10% 품질이 전체 결론을 결정합니다." }
};

const XICI_FALLBACK_INSIGHT = {
  title: "변화 인식",
  body: "괘는 단정 예언이 아니라 현재 선택의 균형점을 찾기 위한 도구입니다."
};

function tossOneLine() {
  // 동전 3개: 앞면=3, 뒷면=2
  let total = 0;
  for (let i = 0; i < 3; i += 1) {
    total += Math.random() < 0.5 ? 2 : 3;
  }
  return total; // 6,7,8,9
}

function saveState() {
  const questionEl = document.getElementById("question");
  const hexNoEl = document.getElementById("hexNo");
  const tagEl = document.getElementById("questionTag");
  const templateEl = document.getElementById("questionTemplate");

  const payload = {
    lines,
    selectedRuleCount,
    locale: currentLocale,
    question: questionEl ? questionEl.value : "",
    questionTag: tagEl ? tagEl.value : "일반",
    questionTemplate: templateEl ? templateEl.value : "",
    hexNo: hexNoEl ? hexNoEl.value : "",
    ruleChecks,
    recentFilter
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);

    if (Array.isArray(saved.lines)) {
      const valid = saved.lines.filter((value) => [6, 7, 8, 9].includes(value)).slice(0, 6);
      lines.splice(0, lines.length, ...valid);
    }

    if (Number.isInteger(saved.selectedRuleCount) && saved.selectedRuleCount >= 0 && saved.selectedRuleCount <= 6) {
      selectedRuleCount = saved.selectedRuleCount;
    }

    if (saved.ruleChecks && typeof saved.ruleChecks === "object") {
      Object.keys(saved.ruleChecks).forEach((key) => {
        const values = saved.ruleChecks[key];
        if (Array.isArray(values)) {
          ruleChecks[key] = values.map(Boolean).slice(0, 3);
        }
      });
    }

    const questionEl = document.getElementById("question");
    const hexNoEl = document.getElementById("hexNo");
    const tagEl = document.getElementById("questionTag");
    const templateEl = document.getElementById("questionTemplate");
    if (questionEl && typeof saved.question === "string") questionEl.value = saved.question;
    if (hexNoEl && typeof saved.hexNo === "string") hexNoEl.value = saved.hexNo;
    if (tagEl && typeof saved.questionTag === "string") tagEl.value = saved.questionTag;
    if (typeof saved.questionTemplate === "string") {
      pendingTemplate = saved.questionTemplate;
      if (templateEl) templateEl.value = saved.questionTemplate;
    }
    if (typeof saved.recentFilter === "string") recentFilter = saved.recentFilter;
    if (typeof saved.locale === "string") currentLocale = saved.locale;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function populateQuestionTemplates() {
  const tag = document.getElementById("questionTag").value || "일반";
  const templateEl = document.getElementById("questionTemplate");
  const templates = QUESTION_TEMPLATES[tag] || QUESTION_TEMPLATES["일반"];

  const previous = pendingTemplate || templateEl.value;
  templateEl.innerHTML = `<option value="">${t("option.none", "선택 안함")}</option>`;
  templates.forEach((text) => {
    const option = document.createElement("option");
    option.value = text;
    option.textContent = text;
    templateEl.appendChild(option);
  });

  if (templates.includes(previous)) {
    templateEl.value = previous;
  } else {
    templateEl.value = "";
  }
  pendingTemplate = "";
}

function applyQuestionTemplate() {
  const templateEl = document.getElementById("questionTemplate");
  const questionEl = document.getElementById("question");
  if (!templateEl.value) return;
  questionEl.value = templateEl.value;
  saveState();
}

function getXiciInsight(primaryNo, relatedNo, changingCount) {
  const primaryInsight = XICI_BY_HEX[primaryNo] || XICI_FALLBACK_INSIGHT;

  if (!relatedNo || relatedNo === primaryNo) {
    return primaryInsight;
  }

  const relatedInsight = XICI_BY_HEX[relatedNo];
  if (!relatedInsight) {
    return primaryInsight;
  }

  if (changingCount >= 5) {
    return {
      title: `${primaryInsight.title} → ${relatedInsight.title}`,
      body: `${primaryInsight.body} 전효에 가까운 변화이므로 다음 사이클 기준은 '${relatedInsight.title}' 관점으로 다시 세웁니다.`
    };
  }

  return {
    title: `${primaryInsight.title} → ${relatedInsight.title}`,
    body: `${primaryInsight.body} 변화 국면에서는 ${relatedInsight.body}`
  };
}

function getHexTagPractice(hexNo, tag) {
  const key = String(hexNo || "");
  const bucket = HEX_PRACTICE_BY_TAG[key];
  if (!bucket || typeof bucket !== "object") return "";
  const text = bucket[tag];
  return typeof text === "string" ? text.trim() : "";
}

function transitionWeightText(changingCount) {
  if (!isKoreanUI()) {
    if (changingCount <= 1) return t("dyn.weightText.primary", "Keep related hexagram as a signal only and prioritize primary action.");
    if (changingCount <= 3) return t("dyn.weightText.parallel", "Review both primary execution and related transition in parallel.");
    if (changingCount <= 5) return t("dyn.weightText.related", "Transition pressure is high; increase weight on related strategy.");
    return t("dyn.weightText.full", "Near full-line change; redesign next cycle around the related hexagram.");
  }
  if (changingCount <= 1) return "지괘는 참고 신호로만 두고 본괘 실행을 우선합니다.";
  if (changingCount <= 3) return "본괘 실행과 지괘 전환을 병행 검토합니다.";
  if (changingCount <= 5) return "전환 압력이 크므로 지괘 전략 비중을 높입니다.";
  return "전효 변화에 가까워 다음 사이클 전략을 지괘 중심으로 재설계합니다.";
}

function transitionWeightBadge(changingCount) {
  if (!isKoreanUI()) {
    if (changingCount <= 1) {
      return { label: t("dyn.badge.primary", "Weight Stage: Primary"), className: "badge-primary" };
    }
    if (changingCount <= 3) {
      return { label: t("dyn.badge.parallel", "Weight Stage: Parallel"), className: "badge-mixed" };
    }
    return { label: t("dyn.badge.related", "Weight Stage: Related"), className: "badge-related" };
  }
  if (changingCount <= 1) {
    return { label: "가중 단계: 본괘 우선", className: "badge-primary" };
  }
  if (changingCount <= 3) {
    return { label: "가중 단계: 병행", className: "badge-mixed" };
  }
  return { label: "가중 단계: 지괘 중심", className: "badge-related" };
}

function transitionHintText(changingCount) {
  if (!isKoreanUI()) {
    if (changingCount <= 1) {
      return t("dyn.hint.primary", "Primary first: with few changing lines, fine-tune current strategy and use related hexagram as reference.");
    }
    if (changingCount <= 3) {
      return t("dyn.hint.parallel", "Parallel: run current execution and transition direction together, then validate conflicts with small experiments.");
    }
    return t("dyn.hint.related", "Related first: transition pressure is high. Reduce inertia and design around transition plan first.");
  }
  if (changingCount <= 1) {
    return "본괘 우선: 변효가 적어 현재 전략의 미세조정이 핵심입니다. 지괘는 방향 점검용 참고로만 사용하세요.";
  }
  if (changingCount <= 3) {
    return "병행: 현재 실행(본괘)과 변화 방향(지괘)을 함께 보되, 충돌 시 작은 실험으로 검증하세요.";
  }
  return "지괘 중심: 변화 압력이 큰 구간입니다. 기존 관성을 줄이고 전환 계획(지괘)을 우선 설계하세요.";
}

function transitionGuideItems(changingCount, tag) {
  const mode = tag || "일반";

  if (!isKoreanUI()) {
    if (changingCount <= 1) {
      return [
        t("dyn.guide.primary.do", "Do today: pick exactly one primary action and execute it."),
        t("dyn.guide.primary.watch", "Watch out: avoid overreacting to weak transition signals."),
        t("dyn.guide.primary.hold", "Hold: postpone structural decisions until next review.")
      ];
    }
    if (changingCount <= 3) {
      return [
        t("dyn.guide.parallel.do", "Do today: test one primary action and one transition action in parallel."),
        t("dyn.guide.parallel.watch", "Watch out: when signals conflict, validate with a small pilot first."),
        t("dyn.guide.parallel.hold", "Hold: avoid full rollout before next checkpoint.")
      ];
    }
    return [
      t("dyn.guide.related.do", "Do today: build a transition roadmap with steps and deadlines."),
      t("dyn.guide.related.watch", "Watch out: quantify inertia cost (time/relations/cash)."),
      t("dyn.guide.related.hold", "Hold: stop reactive decisions and short-term noise chasing.")
    ];
  }

  if (changingCount <= 1) {
    if (mode === "직장") {
      return [
        "오늘 할 일: 오늘 우선순위 1건과 이해관계자 공유 문장을 확정한다.",
        "주의: 부서 정치 신호에 과반응해 계획을 급변하지 않는다.",
        "보류: 조직도·평가체계 등 큰 구조 변경은 미룬다."
      ];
    }
    if (mode === "사업") {
      return [
        "오늘 할 일: 핵심 지표 1개와 고객가치 1개를 고정해 실행한다.",
        "주의: 단기 매출 신호만 보고 전략을 급변하지 않는다.",
        "보류: 대규모 마케팅/채용/확장은 다음 점검까지 미룬다."
      ];
    }
    if (mode === "인간관계") {
      return [
        "오늘 할 일: 짧고 명확한 한 번의 대화 시도를 실행한다.",
        "주의: 상대 반응 한 번으로 관계 전체를 단정하지 않는다.",
        "보류: 절연 선언·감정 폭발형 결론은 미룬다."
      ];
    }
    return [
      "오늘 할 일: 본괘 권고 중 실행 1개를 즉시 확정한다.",
      "주의: 지괘 신호를 과대해석해 방향을 급변하지 않는다.",
      "보류: 구조 변경·인력 재편 같은 큰 결정을 미룬다."
    ];
  }

  if (changingCount <= 3) {
    if (mode === "직장") {
      return [
        "오늘 할 일: 현재 업무 유지안 1개와 전환 실험안 1개를 병행한다.",
        "주의: 보고 라인/권한 충돌은 작은 파일럿으로 먼저 검증한다.",
        "보류: 전 부서 일괄 변경 공지는 다음 리뷰 후 진행한다."
      ];
    }
    if (mode === "사업") {
      return [
        "오늘 할 일: 본괘 운영안과 지괘 전환안의 A/B 실험을 설계한다.",
        "주의: 가격·제품·채널을 한 번에 동시에 바꾸지 않는다.",
        "보류: 자금 집행이 큰 의사결정은 지표 확인 후 진행한다."
      ];
    }
    if (mode === "인간관계") {
      return [
        "오늘 할 일: 현재 관계 리듬 유지 행동 1개와 개선 행동 1개를 병행한다.",
        "주의: 오해 지점은 해석보다 확인 질문으로 검증한다.",
        "보류: 관계 규정/결별 같은 최종 결론은 유예한다."
      ];
    }
    return [
      "오늘 할 일: 본괘 1개 + 지괘 1개 행동을 병행 실험한다.",
      "주의: 두 신호가 충돌하면 작은 범위에서 먼저 검증한다.",
      "보류: 전면 롤아웃과 일괄 전환은 다음 점검까지 보류한다."
    ];
  }

  if (mode === "직장") {
    return [
      "오늘 할 일: 지괘 기준으로 역할·일정·협업 체계를 재설계한다.",
      "주의: 기존 방식 고수 비용(지연/갈등/품질)을 수치화한다.",
      "보류: 감정 반발로 인한 인사/조직 단행은 멈춘다."
    ];
  }
  if (mode === "사업") {
    return [
      "오늘 할 일: 지괘 중심 전환 로드맵(제품·채널·재무)을 확정한다.",
      "주의: 관성 유지 비용과 전환 비용을 함께 비교한다.",
      "보류: 근거 없는 낙관 시나리오 기반 집행을 중단한다."
    ];
  }
  if (mode === "인간관계") {
    return [
      "오늘 할 일: 지괘 기준으로 관계 경계선과 기대치를 재합의한다.",
      "주의: 미해결 감정을 덮고 형식적 화해로 넘기지 않는다.",
      "보류: 확인 없는 단정·최종 결별 선언은 유예한다."
    ];
  }

  return [
    "오늘 할 일: 지괘 기준으로 전환 로드맵(단계/기한)을 만든다.",
    "주의: 기존 관성 유지 비용(시간·관계·자금)을 수치화한다.",
    "보류: 감정 반응형 결정과 단기 성과 집착을 멈춘다."
  ];
}

function renderTransitionHint(changingCount, tag) {
  const hintEl = document.getElementById("transitionHint");
  const listEl = document.getElementById("transitionGuideList");
  if (!hintEl) return;
  if (!listEl) return;

  if (!transitionHintExpanded) {
    hintEl.textContent = t("hint.click", "배지를 클릭하면 단계 해설이 표시됩니다.");
    listEl.innerHTML = "";
    return;
  }

  hintEl.textContent = transitionHintText(changingCount);
  listEl.innerHTML = "";
  transitionGuideItems(changingCount, tag).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listEl.appendChild(li);
  });
}

function buildPracticeAdvice(tag, changingCount, primary, relatedHexData, primaryNo, relatedNo) {
  if (!isKoreanUI()) {
    const modeLead = {
      일반: t("dyn.advice.mode.general", "Narrow choices to two clear options and"),
      직장: t("dyn.advice.mode.work", "Align stakeholder and schedule risk first and"),
      사업: t("dyn.advice.mode.business", "Quantify cashflow and customer impact first and"),
      인간관계: t("dyn.advice.mode.relationship", "Clarify boundaries and intent before emotion and")
    };
    const transition = relatedHexData && primary && relatedHexData[0] !== primary[0]
      ? tf("dyn.advice.transition.change", { from: primary[1], to: relatedHexData[1] }, `reflect transition from ${primary[1]} to ${relatedHexData[1]}`)
      : tf("dyn.advice.transition.keep", { name: primary ? primary[1] : "current" }, `maintain baseline flow of ${primary ? primary[1] : "current"}`);

    const speedText = changingCount >= 4
      ? t("dyn.advice.speed.slow", "Slow decision speed by one step and set risk buffers first.")
      : t("dyn.advice.speed.fast", "Lock one small action today and run a short validation loop.");
    const weightText = transitionWeightText(changingCount);
    return `${modeLead[tag] || modeLead.일반} ${transition}. ${weightText} ${speedText}`;
  }

  const modeLead = {
    일반: "핵심 선택지를 2개로 줄이고",
    직장: "이해관계자와 일정 리스크를 먼저 정리하고",
    사업: "현금흐름/고객영향을 수치로 점검하고",
    인간관계: "감정 표현보다 경계와 의도를 먼저 명확히 하고"
  };

  const primaryTagAdvice = getHexTagPractice(primaryNo, tag);

  const relatedTagAdvice = getHexTagPractice(relatedNo, tag);

  const transition = relatedHexData && primary && relatedHexData[0] !== primary[0]
    ? `${primary[1]}에서 ${relatedHexData[1]}로의 전환 흐름을 반영해`
    : `${primary ? primary[1] : "현재"}의 기본 흐름을 유지하며`;

  const speedText = changingCount >= 4
    ? "결정 속도를 1단계 늦춰 리스크 완충 장치를 먼저 두는 것이 좋습니다."
    : "오늘 실행 1가지를 작게 확정해 검증 루프를 돌리는 것이 좋습니다.";
  const weightText = transitionWeightText(changingCount);

  if (relatedNo && primaryNo && relatedNo !== primaryNo && relatedTagAdvice) {
    return `${modeLead[tag] || modeLead.일반} ${transition} 본괘 기준: ${primaryTagAdvice || (primary ? primary[2] : "현재 괘 기준을 점검하세요.")}
→ 지괘 전환: ${relatedTagAdvice} ${weightText} ${speedText}`;
  }

  return `${modeLead[tag] || modeLead.일반} ${transition} ${primaryTagAdvice || (primary ? primary[2] : "현재 괘 기준을 점검하세요.")} ${weightText} ${speedText}`;
}

function loadRecentRecords() {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) {
    recentRecords = [];
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    recentRecords = Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    recentRecords = [];
  }
}

function saveRecentRecords() {
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentRecords.slice(0, 5)));
}

function recentGuidePreview(record) {
  if (record && Array.isArray(record.transitionGuideItems) && record.transitionGuideItems.length > 0) {
    return String(record.transitionGuideItems[0]);
  }

  if (record && Array.isArray(record.changingLines)) {
    const changingCount = record.changingLines.length;
    const tag = record.questionTag || "일반";
    const generated = transitionGuideItems(changingCount, tag);
    return generated.length ? generated[0] : "";
  }

  return "";
}

function recentWeightBadge(record) {
  if (record && typeof record.transitionWeightBadge === "string") {
    const label = record.transitionWeightBadge;
    if (label.includes("본괘 우선") || label.includes("Primary")) return { label, className: "badge-primary" };
    if (label.includes("병행") || label.includes("Parallel")) return { label, className: "badge-mixed" };
    if (label.includes("지괘 중심") || label.includes("Related")) return { label, className: "badge-related" };
    return { label, className: "badge-neutral" };
  }

  if (record && Array.isArray(record.changingLines)) {
    const computed = transitionWeightBadge(record.changingLines.length);
    return { label: computed.label, className: computed.className };
  }

  return { label: t("msg.weight.none", "가중 단계: (없음)"), className: "badge-neutral" };
}

function normalizeRecentExportPayload(record) {
  return {
    exportedAt: record.exportedAt || new Date().toISOString(),
    question: record.question || "",
    questionTag: record.questionTag || "일반",
    lines: Array.isArray(record.lines) ? record.lines : [],
    changingLines: Array.isArray(record.changingLines) ? record.changingLines : [],
    primaryHex: record.primaryHex || null,
    relatedHex: record.relatedHex || null,
    selectedRuleCount: Number.isInteger(record.selectedRuleCount) ? record.selectedRuleCount : null,
    selectedRuleText: typeof record.selectedRuleText === "string" ? record.selectedRuleText : null,
    transitionWeightBadge: typeof record.transitionWeightBadge === "string" ? record.transitionWeightBadge : null,
    transitionWeightHint: typeof record.transitionWeightHint === "string" ? record.transitionWeightHint : null,
    transitionGuideItems: Array.isArray(record.transitionGuideItems) ? record.transitionGuideItems : [],
    lookupNo: typeof record.lookupNo === "string" || typeof record.lookupNo === "number"
      ? String(record.lookupNo)
      : ""
  };
}

function renderRecentRecords() {
  const box = document.getElementById("recentRecords");
  const filterEl = document.getElementById("recentFilter");
  if (filterEl) filterEl.value = recentFilter;

  box.innerHTML = "";

  const filtered = recentFilter === "전체"
    ? recentRecords
    : recentRecords.filter((record) => (record.questionTag || "일반") === recentFilter);

  if (!filtered.length) {
    box.textContent = t("msg.noRecent", "저장된 최근 기록이 없습니다.");
    return;
  }

  filtered.forEach((record, index) => {
    const item = document.createElement("div");
    item.className = "recent-item";

    const when = record.exportedAt
      ? String(record.exportedAt).replace("T", " ").slice(0, 19)
      : t("msg.recent.noTime", "No time");
    const q = record.question
      ? String(record.question).slice(0, 40)
      : t("msg.recent.noQuestion", "(No question)");
    const hex = record.primaryHex
      ? `${record.primaryHex.no}${isKoreanUI() ? "괘" : ""} ${record.primaryHex.name}`
      : t("msg.recent.incomplete", "Incomplete");
    const tag = record.questionTag || "일반";
    const guidePreview = recentGuidePreview(record);
    const weightBadge = recentWeightBadge(record);

    item.innerHTML = `<div><strong>${index + 1}. ${hex}</strong></div><div>${when} · ${t("label.tag", "Tag")}: ${displayTag(tag)}</div><div class="recent-weight-badge transition-badge ${weightBadge.className}">${weightBadge.label}</div><div>${q}</div><div class="recent-preview">${guidePreview ? tf("msg.preview", { text: guidePreview }, `가이드 미리보기: ${guidePreview}`) : t("msg.preview.none", "가이드 미리보기: (없음)")}</div>`;

    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = t("btn.recent.restore", "↺ Restore");
    restoreBtn.addEventListener("click", () => {
      try {
        applyImportedState(record);
        saveState();
        alert(t("msg.restore.ok", "최근 기록을 복원했습니다."));
      } catch (error) {
        alert(tf("msg.restore.fail", { reason: error.message || "데이터를 확인하세요." }, `복원 실패: ${error.message || "데이터를 확인하세요."}`));
      }
    });

    const exportBtn = document.createElement("button");
    exportBtn.textContent = t("btn.recent.txt", "≡ TXT");
    exportBtn.addEventListener("click", () => {
      const payload = normalizeRecentExportPayload(record);
      const date = record.exportedAt
        ? String(record.exportedAt).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const text = buildExportTxtText(payload);
      downloadTextFile(`주역기록_${date}_recent_${index + 1}.txt`, text, "text/plain;charset=utf-8");
    });

    const exportJsonBtn = document.createElement("button");
    exportJsonBtn.textContent = t("btn.recent.json", "⌘ JSON");
    exportJsonBtn.addEventListener("click", () => {
      const payload = normalizeRecentExportPayload(record);
      const date = record.exportedAt
        ? String(record.exportedAt).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const content = JSON.stringify(payload, null, 2);
      downloadTextFile(`주역기록_${date}_recent_${index + 1}.json`, content, "application/json;charset=utf-8");
    });

    const actionRow = document.createElement("div");
    actionRow.className = "recent-actions";
    actionRow.appendChild(restoreBtn);
    actionRow.appendChild(exportBtn);
    actionRow.appendChild(exportJsonBtn);

    item.appendChild(actionRow);
    box.appendChild(item);
  });
}

function addRecentRecord(record) {
  recentRecords.unshift(record);
  recentRecords = recentRecords.slice(0, 5);
  saveRecentRecords();
  renderRecentRecords();
}

function isYang(value) {
  return value === 7 || value === 9;
}

function isChanging(value) {
  return value === 6 || value === 9;
}

function addLine(value) {
  if (lines.length >= 6) return;
  lines.push(value);
  render();
}

function buildRelatedLines() {
  return lines.map((value) => {
    if (value === 6) return 7;
    if (value === 9) return 8;
    return value;
  });
}

function toBit(value) {
  return isYang(value) ? "1" : "0";
}

function resolveKingWenNumber(values) {
  const lowerBits = values.slice(0, 3).map(toBit).join("");
  const upperBits = values.slice(3, 6).map(toBit).join("");
  const lowerIndex = TRIGRAM_INDEX[lowerBits];
  const upperIndex = TRIGRAM_INDEX[upperBits];

  if (lowerIndex === undefined || upperIndex === undefined) return null;
  return KING_WEN_MATRIX[lowerIndex][upperIndex];
}

function getHexDataByNo(no) {
  return HEX_DATA.find((item) => item[0] === no) || null;
}

function renderHex(containerId, values) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // 화면은 위에서 아래로 보여주기 위해 역순
  const topToBottom = [...values].reverse();
  topToBottom.forEach((value) => {
    const line = document.createElement("div");
    line.className = "line " + (isYang(value) ? "yang" : "yin");
    if (isChanging(value)) {
      const mark = document.createElement("span");
      mark.className = "changing-mark";
      mark.textContent = "변";
      line.appendChild(mark);
    }
    container.appendChild(line);
  });
}

function guideText(changingCount) {
  if (!isKoreanUI()) {
    if (changingCount === 0) return "No changing lines: judge by the main flow of the primary hexagram.";
    if (changingCount === 1) return "1 changing line: read that line's warning/advice first.";
    if (changingCount === 2) return "2 changing lines: prioritize the common message of both lines.";
    if (changingCount <= 4) return "Multiple changing lines: read both primary(current) and related(after-change).";
    return "Large transition phase: prioritize risk control and pace over quick decisions.";
  }
  if (changingCount === 0) return "변효가 없으므로 본괘의 큰 흐름을 중심으로 판단하세요.";
  if (changingCount === 1) return "변효 1개: 해당 효의 경고/조언을 가장 우선으로 읽으세요.";
  if (changingCount === 2) return "변효 2개: 두 효의 공통 메시지를 우선 반영하세요.";
  if (changingCount <= 4) return "변효 다수: 본괘(현재)와 지괘(변화 후)를 함께 읽으세요.";
  return "변화가 매우 큰 국면입니다. 단기 결정보다 리스크 관리와 속도 조절이 우선입니다.";
}

function ruleTextByCount(ruleCount, currentChangingLines) {
  if (!isKoreanUI()) {
    const lineText = currentChangingLines.length > 0
      ? `Changing line positions: ${currentChangingLines.join(", ")}.`
      : "No changing lines.";
    const map = {
      0: `${lineText} Rule 0: read primary hexagram core text first, and fine-tune current strategy.`,
      1: `${lineText} Rule 1: prioritize that single changing-line text as action instruction.`,
      2: `${lineText} Rule 2: read both changing lines and adopt the shared message.`,
      3: `${lineText} Rule 3: read primary and related together; convert differences into actions.`,
      4: `${lineText} Rule 4: increase related-hexagram weight and manage transition actively.`,
      5: `${lineText} Rule 5: use the single stable line as axis and treat others as support signals.`,
      6: `${lineText} Rule 6: full-line transition; design next cycle around related hexagram.`
    };
    return map[ruleCount] || "Rule data could not be loaded.";
  }
  const lineText = currentChangingLines.length > 0
    ? `현재 변효 위치: ${currentChangingLines.join(", ")}효.`
    : "현재 변효 없음.";

  const map = {
    0: `${lineText} 변효 0개 규칙: 본괘 괘사 중심으로 읽고, 당장 큰 변경보다 현재 전략의 정밀 조정을 우선합니다.`,
    1: `${lineText} 변효 1개 규칙: 해당 변효 효사를 최우선으로 읽습니다. 본괘는 배경, 그 효사는 행동 지시입니다.`,
    2: `${lineText} 변효 2개 규칙: 두 효사를 함께 읽고 공통 메시지를 채택합니다. 충돌 시 보수적 해석을 우선합니다.`,
    3: `${lineText} 변효 3개 규칙: 본괘와 지괘를 병독합니다. 현재(본괘)와 전환 방향(지괘)의 차이를 행동 계획으로 바꿉니다.`,
    4: `${lineText} 변효 4개 규칙: 지괘 비중을 높여 읽습니다. 변화가 이미 진행 중이므로 고집보다 전환 관리가 핵심입니다.`,
    5: `${lineText} 변효 5개 규칙: 유일한 정효(변하지 않는 효)를 기준축으로 잡고, 나머지 변화는 보조 신호로 해석합니다.`,
    6: `${lineText} 변효 6개 규칙: 전효 변화 국면입니다. 지괘 중심으로 다음 사이클 전략을 세우고 속도 조절을 강화합니다.`
  };

  return map[ruleCount] || "규칙 정보를 불러오지 못했습니다.";
}

function actionItemsByRule(ruleCount) {
  if (!isKoreanUI()) {
    const itemsEn = {
      0: [
        "Did you limit changes in current plan to one item?",
        "Did you write the primary message in one sentence?",
        "Did you postpone aggressive expansion today?"
      ],
      1: [
        "Did you check risk at the changing-line stage?",
        "Did you convert changing-line advice into one action?",
        "Did you verify consistency with primary background?"
      ],
      2: [
        "Did you find the shared message of both lines?",
        "Did you prepare a conservative option for conflict?",
        "Did you reduce scope for stability today?"
      ],
      3: [
        "Did you write differences between primary and related?",
        "Did you estimate transition cost (time/energy/relations)?",
        "Did you separate short-term and mid-term actions?"
      ],
      4: [
        "Did you avoid forcing an ongoing change backward?",
        "Did you set one related-centered response strategy?",
        "Did you reduce rigidity and secure collaboration?"
      ],
      5: [
        "Did you identify the single stable line?",
        "Did you treat other changing lines as support signals?",
        "Did you control speed and avoid over-conclusion?"
      ],
      6: [
        "Did you set next-cycle goals based on related hexagram?",
        "Did you split big decisions into stages?",
        "Did you define safety lines for risk management?"
      ]
    };
    return itemsEn[ruleCount] || [];
  }
  const items = {
    0: [
      "현재 계획에서 바꿀 항목을 1개로 제한했는가?",
      "본괘 핵심 메시지를 한 줄로 적었는가?",
      "오늘 무리한 확장 결정을 보류했는가?"
    ],
    1: [
      "해당 변효 위치(해당 단계)의 리스크를 확인했는가?",
      "변효 조언을 오늘 행동 1개로 번역했는가?",
      "본괘 배경과 충돌하지 않는지 점검했는가?"
    ],
    2: [
      "두 변효의 공통 메시지를 찾았는가?",
      "충돌 시 보수적 선택안을 준비했는가?",
      "오늘 실행 범위를 줄여 안정성을 높였는가?"
    ],
    3: [
      "본괘(현재)와 지괘(전환)의 차이를 적었는가?",
      "전환 비용(시간/에너지/관계)을 계산했는가?",
      "단기 행동과 중기 행동을 분리했는가?"
    ],
    4: [
      "이미 진행 중인 변화를 억지로 되돌리려 하지 않았는가?",
      "지괘 중심의 대응 전략을 1개 정했는가?",
      "고집을 줄이고 협력 자원을 확보했는가?"
    ],
    5: [
      "유일한 정효(고정 축)를 파악했는가?",
      "나머지 변화선은 보조 신호로만 사용했는가?",
      "과도한 결론을 피하고 속도를 조절했는가?"
    ],
    6: [
      "지괘 기준으로 다음 사이클 목표를 정했는가?",
      "큰 결정을 단계형으로 쪼갰는가?",
      "리스크 관리(시간/자금/관계) 안전선을 설정했는가?"
    ]
  };
  return items[ruleCount] || [];
}

function renderActionChecklist(ruleCount) {
  const box = document.getElementById("actionChecklist");
  const summary = document.getElementById("checkSummary");
  box.innerHTML = "";

  const items = actionItemsByRule(ruleCount);
  if (!items.length) {
    summary.textContent = t("check.pending", "체크 항목이 아직 없습니다.");
    saveState();
    return;
  }

  const key = String(ruleCount);
  if (!Array.isArray(ruleChecks[key]) || ruleChecks[key].length !== items.length) {
    ruleChecks[key] = new Array(items.length).fill(false);
  }

  items.forEach((text, idx) => {
    const id = `check-${ruleCount}-${idx}`;
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = Boolean(ruleChecks[key][idx]);

    checkbox.addEventListener("change", () => {
      ruleChecks[key][idx] = checkbox.checked;
      const checked = box.querySelectorAll('input[type="checkbox"]:checked').length;
      summary.textContent = isKoreanUI()
        ? `체크 완료 ${checked}/${items.length} — ${checked >= 2 ? "실행 준비 양호" : "추가 점검 필요"}`
        : `Checklist ${checked}/${items.length} — ${checked >= 2 ? "Ready" : "Need more checks"}`;
      saveState();
    });

    const span = document.createElement("span");
    span.textContent = text;

    label.appendChild(checkbox);
    label.appendChild(span);
    box.appendChild(label);
  });

  const initiallyChecked = ruleChecks[key].filter(Boolean).length;
  summary.textContent = isKoreanUI()
    ? `체크 완료 ${initiallyChecked}/${items.length} — ${initiallyChecked >= 2 ? "실행 준비 양호" : "추가 점검 필요"}`
    : `Checklist ${initiallyChecked}/${items.length} — ${initiallyChecked >= 2 ? "Ready" : "Need more checks"}`;
  saveState();
}

function renderRuleButtons(currentChangingCount, currentChangingLines) {
  const box = document.getElementById("ruleButtons");
  const output = document.getElementById("ruleOutput");
  box.innerHTML = "";

  for (let count = 0; count <= 6; count += 1) {
    const button = document.createElement("button");
    button.textContent = isKoreanUI() ? `${count}변효` : `${count} line`;
    if (selectedRuleCount === null) selectedRuleCount = currentChangingCount;
    if (count === selectedRuleCount) button.classList.add("active");

    button.addEventListener("click", () => {
      selectedRuleCount = count;
      renderRuleButtons(currentChangingCount, currentChangingLines);
    });
    box.appendChild(button);
  }

  output.textContent = ruleTextByCount(selectedRuleCount, currentChangingLines);
  renderActionChecklist(selectedRuleCount);
}

function render() {
  document.getElementById("progress").textContent = tf("msg.progress", { count: lines.length }, `현재 ${lines.length} / 6 효`);
  const lineList = document.getElementById("lineList");
  lineList.innerHTML = "";

  lines.forEach((value, index) => {
    const li = document.createElement("li");
    const layer = index + 1;
    const type = isYang(value) ? "양" : "음";
    const ch = isChanging(value) ? " (변효)" : "";
    li.textContent = `${layer}효: ${value} → ${type}${ch}`;
    lineList.appendChild(li);
  });

  if (lines.length === 6) {
    renderHex("primaryHex", lines);
    const related = buildRelatedLines();
    renderHex("relatedHex", related);

    const primaryNo = resolveKingWenNumber(lines);
    const relatedNo = resolveKingWenNumber(related);
    const primary = getHexDataByNo(primaryNo);
    const relatedHexData = getHexDataByNo(relatedNo);

    const primaryInfo = document.getElementById("primaryInfo");
    const relatedInfo = document.getElementById("relatedInfo");

    primaryInfo.textContent = primary
      ? `${primary[0]}괘 ${primary[1]} — ${primary[2]}`
      : "본괘 번호 계산 실패";

    relatedInfo.textContent = relatedHexData
      ? `${relatedHexData[0]}괘 ${relatedHexData[1]} — ${relatedHexData[2]}`
      : "지괘 번호 계산 실패";

    const changing = lines
      .map((value, idx) => (isChanging(value) ? idx + 1 : null))
      .filter(Boolean);

    if (selectedRuleCount === null || selectedRuleCount > 6) {
      selectedRuleCount = changing.length;
    }

    document.getElementById("changing").textContent =
      changing.length > 0
        ? `변효 위치(아래→위): ${changing.join(", ")}`
        : "변효 없음";

    document.getElementById("readingGuide").textContent = guideText(changing.length);

    const xici = getXiciInsight(primaryNo, relatedNo, changing.length);
    document.getElementById("xiciTitle").textContent = `${xici.title} — ${primary ? `${primary[0]}괘 ${primary[1]}` : ""}`;
    document.getElementById("xiciBody").textContent = xici.body;

    const tag = document.getElementById("questionTag").value || "일반";
    document.getElementById("practiceAdvice").textContent = buildPracticeAdvice(
      tag,
      changing.length,
      primary,
      relatedHexData,
      primaryNo,
      relatedNo
    );

    const badge = transitionWeightBadge(changing.length);
    const badgeEl = document.getElementById("transitionBadge");
    badgeEl.textContent = badge.label;
    badgeEl.className = `transition-badge ${badge.className}`;
    renderTransitionHint(changing.length, tag);

    renderRuleButtons(changing.length, changing);
  } else {
    document.getElementById("primaryHex").innerHTML = "";
    document.getElementById("relatedHex").innerHTML = "";
    document.getElementById("primaryInfo").textContent = "";
    document.getElementById("relatedInfo").textContent = "";
    document.getElementById("changing").textContent = "";
    document.getElementById("readingGuide").textContent = t("msg.readingPending", "6효가 완성되면 결과가 표시됩니다.");
    document.getElementById("ruleButtons").innerHTML = "";
    document.getElementById("ruleOutput").textContent = t("rule.pending", "6효 완성 후 규칙이 자동 추천됩니다.");
    document.getElementById("xiciTitle").textContent = t("xici.pendingTitle", "6효 완성 후 원칙이 표시됩니다.");
    document.getElementById("xiciBody").textContent = t("xici.pendingBody", "괘의 흐름을 과장하지 않고, 현재 상황을 바르게 분별하는 데 사용하세요.");
    document.getElementById("transitionBadge").textContent = t("weight.pending", "가중 단계: 대기");
    document.getElementById("transitionBadge").className = "transition-badge badge-neutral";
    transitionHintExpanded = false;
    document.getElementById("transitionHint").textContent = t("hint.click", "배지를 클릭하면 단계 해설이 표시됩니다.");
    document.getElementById("transitionGuideList").innerHTML = "";
    document.getElementById("practiceAdvice").textContent = t("advice.pending", "질문 태그와 변효 흐름을 결합한 권고가 여기에 표시됩니다.");
    document.getElementById("actionChecklist").innerHTML = "";
    document.getElementById("checkSummary").textContent = t("check.pending", "체크 항목이 아직 없습니다.");
    selectedRuleCount = null;
  }

  saveState();
}

function lookupHex() {
  const value = Number(document.getElementById("hexNo").value);
  const target = HEX_DATA.find((item) => item[0] === value);
  const box = document.getElementById("lookupResult");

  if (!target) {
    box.textContent = t("msg.range", "1~64 번호를 입력하세요.");
    saveState();
    return;
  }

  box.innerHTML = `<strong>${target[0]}${isKoreanUI() ? "괘" : ""} ${target[1]}</strong><p>${target[2]}</p>`;
  saveState();
}

function currentHexSummary(values) {
  if (values.length !== 6) return null;
  const no = resolveKingWenNumber(values);
  const data = getHexDataByNo(no);
  return data ? { no: data[0], name: data[1], summary: data[2] } : null;
}

function buildExportPayload() {
  const question = document.getElementById("question").value.trim();
  const questionTag = document.getElementById("questionTag").value;
  const lookupNo = document.getElementById("hexNo").value;
  const relatedLines = lines.length === 6 ? buildRelatedLines() : [];
  const changingLines = lines
    .map((value, idx) => (isChanging(value) ? idx + 1 : null))
    .filter(Boolean);
  const changingCount = changingLines.length;
  const weightBadge = lines.length === 6 ? transitionWeightBadge(changingCount) : null;
  const weightHint = lines.length === 6 ? transitionHintText(changingCount) : null;
  const weightGuide = lines.length === 6 ? transitionGuideItems(changingCount, questionTag) : [];

  const payload = {
    exportedAt: new Date().toISOString(),
    question,
    questionTag,
    lines: [...lines],
    changingLines,
    selectedRuleCount,
    selectedRuleText:
      lines.length === 6 && selectedRuleCount !== null
        ? ruleTextByCount(selectedRuleCount, changingLines)
        : null,
    xiciPrinciple: lines.length === 6
      ? document.getElementById("xiciTitle").textContent
      : null,
    practiceAdvice: lines.length === 6
      ? document.getElementById("practiceAdvice").textContent
      : null,
    transitionWeightBadge: weightBadge ? weightBadge.label : null,
    transitionWeightHint: weightHint,
    transitionGuideItems: weightGuide,
    primaryHex: currentHexSummary(lines),
    relatedHex: currentHexSummary(relatedLines),
    lookupNo,
    checklist: ruleChecks
  };

  return payload;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = buildExportPayload();
  const date = new Date().toISOString().slice(0, 10);
  const content = JSON.stringify(payload, null, 2);
  addRecentRecord(payload);
  const prefix = isKoreanUI() ? "주역기록" : "IChing_Record";
  downloadTextFile(`${prefix}_${date}.json`, content, "application/json;charset=utf-8");
}

function buildExportTxtText(payload) {
  const primary = payload.primaryHex
    ? `${payload.primaryHex.no}${isKoreanUI() ? "괘" : ""} ${payload.primaryHex.name} - ${payload.primaryHex.summary}`
    : (isKoreanUI() ? "미완성" : "Incomplete");
  const related = payload.relatedHex
    ? `${payload.relatedHex.no}${isKoreanUI() ? "괘" : ""} ${payload.relatedHex.name} - ${payload.relatedHex.summary}`
    : (isKoreanUI() ? "미완성" : "Incomplete");

  if (!isKoreanUI()) {
    return [
      "[I Ching Daily Record]",
      `Exported at: ${payload.exportedAt}`,
      `Question: ${payload.question || "(none)"}`,
      `Tag: ${displayTag(payload.questionTag || "일반")}`,
      `Lines (bottom→top): ${payload.lines.length ? payload.lines.join(", ") : "(none)"}`,
      `Changing lines: ${payload.changingLines.length ? payload.changingLines.join(", ") : "none"}`,
      `Primary: ${primary}`,
      `Related: ${related}`,
      `Selected rule: ${payload.selectedRuleCount !== null ? payload.selectedRuleCount + " line" : "(none)"}`,
      `Rule text: ${payload.selectedRuleText || "(none)"}`,
      `Weight stage: ${payload.transitionWeightBadge || "(none)"}`,
      `Stage hint: ${payload.transitionWeightHint || "(none)"}`,
      "3-line guide:",
      ...(Array.isArray(payload.transitionGuideItems) && payload.transitionGuideItems.length
        ? payload.transitionGuideItems.map((item, idx) => `  ${idx + 1}) ${item}`)
        : ["  (none)"]),
      `Lookup no: ${payload.lookupNo || "(none)"}`
    ].join("\n");
  }

  return [
    "[주역 오늘 기록]",
    `내보낸 시각: ${payload.exportedAt}`,
    `질문: ${payload.question || "(없음)"}`,
    `질문 태그: ${payload.questionTag || "(없음)"}`,
    `효 입력(아래→위): ${payload.lines.length ? payload.lines.join(", ") : "(없음)"}`,
    `변효 위치: ${payload.changingLines.length ? payload.changingLines.join(", ") : "없음"}`,
    `본괘: ${primary}`,
    `지괘: ${related}`,
    `선택 규칙: ${payload.selectedRuleCount !== null ? payload.selectedRuleCount + "변효" : "(없음)"}`,
    `규칙 해설: ${payload.selectedRuleText || "(없음)"}`,
    `가중 단계: ${payload.transitionWeightBadge || "(없음)"}`,
    `단계 해설: ${payload.transitionWeightHint || "(없음)"}`,
    "3줄 가이드:",
    ...(Array.isArray(payload.transitionGuideItems) && payload.transitionGuideItems.length
      ? payload.transitionGuideItems.map((item, idx) => `  ${idx + 1}) ${item}`)
      : ["  (없음)"]),
    `조회 번호: ${payload.lookupNo || "(없음)"}`
  ].join("\n");
}

function exportTxt() {
  const payload = buildExportPayload();
  const date = new Date().toISOString().slice(0, 10);
  const text = buildExportTxtText(payload);

  addRecentRecord(payload);
  const prefix = isKoreanUI() ? "주역기록" : "IChing_Record";
  downloadTextFile(`${prefix}_${date}.txt`, text, "text/plain;charset=utf-8");
}

function applyImportedState(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("유효하지 않은 JSON 형식입니다.");
  }

  lines.length = 0;
  const importedLines = Array.isArray(payload.lines)
    ? payload.lines.filter((value) => [6, 7, 8, 9].includes(value)).slice(0, 6)
    : [];
  lines.push(...importedLines);

  selectedRuleCount =
    Number.isInteger(payload.selectedRuleCount) && payload.selectedRuleCount >= 0 && payload.selectedRuleCount <= 6
      ? payload.selectedRuleCount
      : null;

  Object.keys(ruleChecks).forEach((key) => delete ruleChecks[key]);
  if (payload.checklist && typeof payload.checklist === "object") {
    Object.keys(payload.checklist).forEach((key) => {
      const value = payload.checklist[key];
      if (Array.isArray(value)) {
        ruleChecks[key] = value.map(Boolean).slice(0, 3);
      }
    });
  }

  const questionEl = document.getElementById("question");
  const hexNoEl = document.getElementById("hexNo");
  const tagEl = document.getElementById("questionTag");
  questionEl.value = typeof payload.question === "string" ? payload.question : "";
  tagEl.value = typeof payload.questionTag === "string" ? payload.questionTag : "일반";
  hexNoEl.value = typeof payload.lookupNo === "string" || typeof payload.lookupNo === "number"
    ? String(payload.lookupNo)
    : "";

  render();
  populateQuestionTemplates();
  if (hexNoEl.value) {
    lookupHex();
  }
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      applyImportedState(payload);
      addRecentRecord(payload);
      saveState();
      alert(t("msg.import.ok", "기록 불러오기가 완료되었습니다."));
    } catch (error) {
      alert(tf("msg.import.fail", { reason: error.message || "JSON을 확인하세요." }, `불러오기 실패: ${error.message || "JSON을 확인하세요."}`));
    }
  };
  reader.onerror = () => {
    alert(t("msg.fileRead.fail", "파일을 읽는 중 오류가 발생했습니다."));
  };
  reader.readAsText(file, "utf-8");
}

document.getElementById("btnAuto").addEventListener("click", () => addLine(tossOneLine()));
document.getElementById("btnUndo").addEventListener("click", () => {
  lines.pop();
  render();
});
document.getElementById("btnReset").addEventListener("click", () => {
  lines.length = 0;
  Object.keys(ruleChecks).forEach((key) => delete ruleChecks[key]);
  render();
});

document.querySelectorAll("button[data-val]").forEach((button) => {
  button.addEventListener("click", () => addLine(Number(button.dataset.val)));
});

document.getElementById("btnLookup").addEventListener("click", lookupHex);
document.getElementById("btnExportJson").addEventListener("click", exportJson);
document.getElementById("btnExportTxt").addEventListener("click", exportTxt);
document.getElementById("btnSaveRecent").addEventListener("click", () => {
  const payload = buildExportPayload();
  addRecentRecord(payload);
  alert(t("msg.saveRecent.ok", "현재 상태를 최근 기록에 저장했습니다."));
});
document.getElementById("btnClearRecent").addEventListener("click", () => {
  recentRecords = [];
  saveRecentRecords();
  renderRecentRecords();
  alert(t("msg.clearRecent.ok", "최근 기록을 모두 삭제했습니다."));
});
document.getElementById("btnClearAllData").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECENT_KEY);

  lines.length = 0;
  selectedRuleCount = null;
  recentFilter = "전체";
  recentRecords = [];
  Object.keys(ruleChecks).forEach((key) => delete ruleChecks[key]);

  document.getElementById("question").value = "";
  document.getElementById("questionTag").value = "일반";
  document.getElementById("hexNo").value = "";
  document.getElementById("lookupResult").textContent = "";
  render();
  renderRecentRecords();
  alert(t("msg.clearAll.ok", "앱 데이터를 모두 초기화했습니다."));
});
document.getElementById("btnImportJson").addEventListener("click", () => {
  document.getElementById("importJsonFile").click();
});
document.getElementById("btnApplyTemplate").addEventListener("click", applyQuestionTemplate);
document.getElementById("importJsonFile").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  importJsonFile(file);
  event.target.value = "";
});

document.getElementById("question").addEventListener("input", saveState);
document.getElementById("hexNo").addEventListener("input", saveState);
document.getElementById("questionTemplate").addEventListener("change", saveState);
document.getElementById("localeSelect").addEventListener("change", (event) => {
  currentLocale = event.target.value;
  localStorage.setItem(LOCALE_KEY, currentLocale);
  applyStaticI18n();
  populateQuestionTemplates();
  render();
  renderRecentRecords();
  if (document.getElementById("hexNo").value) {
    lookupHex();
  }
  saveState();
});
document.getElementById("transitionBadge").addEventListener("click", () => {
  transitionHintExpanded = !transitionHintExpanded;
  renderTransitionHint(
    lines.length === 6 ? lines.filter((value) => isChanging(value)).length : 0,
    document.getElementById("questionTag").value || "일반"
  );
});
document.getElementById("questionTag").addEventListener("change", () => {
  populateQuestionTemplates();
  render();
});
document.getElementById("recentFilter").addEventListener("change", (event) => {
  recentFilter = event.target.value;
  saveState();
  renderRecentRecords();
});

loadState();
loadRecentRecords();
applyStaticI18n();
populateQuestionTemplates();
render();
renderRecentRecords();
if (document.getElementById("hexNo").value) {
  lookupHex();
}
