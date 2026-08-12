const params = new URLSearchParams(location.search);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.requestAnimationFrame(() => window.scrollTo(0, 0));
const screens = ['home', 'new', 'design', 'manual', 'run', 'results'];
const current = screens.includes(params.get('screen')) ? params.get('screen') : 'home';
document.querySelectorAll('[data-screen]').forEach((section) => {
  section.classList.toggle('active', section.dataset.screen === current);
});

const sourceTabs = document.querySelectorAll('[data-source]');
sourceTabs.forEach((tab) => tab.addEventListener('click', () => {
  sourceTabs.forEach((item) => item.classList.toggle('active', item === tab));
  const repository = document.querySelector('.source-fields input');
  if (!repository) return;
  if (tab.dataset.source === 'git') repository.value = 'https://git.example.com/production-agent';
  if (tab.dataset.source === 'local') repository.value = 'production-agent-v1.4.2.zip';
  if (tab.dataset.source === 'endpoint') repository.value = 'https://staging.example.com/agent/run';
}));

const modeButtons = document.querySelectorAll('.segmented [data-mode]');
const modeCopy = document.querySelector('[data-mode-copy]');
const detailLink = document.querySelector('#manual-detail');
const metricModeSummary = document.querySelector('#metric-mode-summary');

function setMode(mode) {
  modeButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  if (modeCopy) {
    modeCopy.innerHTML = mode === 'auto'
      ? '<b>필수 정보만으로 실행합니다.</b><p>질문과 Node 특성을 분석해 Metric, 반복 횟수와 판정 기준을 Agent가 구성합니다.</p>'
      : '<b>Node별 기준을 직접 확정합니다.</b><p>추천 Metric을 검토하고 통과 기준, 반복 횟수와 실행 제한을 설정합니다.</p>';
  }
  detailLink?.classList.toggle('hidden', mode !== 'manual');
  if (metricModeSummary) metricModeSummary.textContent = mode === 'auto' ? 'Agent 자동' : 'HITL 확정';
}

modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
setMode(params.get('mode') === 'manual' ? 'manual' : 'auto');

const guidanceType = document.querySelector('#guidance-type');
const guidanceValue = document.querySelector('#guidance-value');
const guidanceSummary = document.querySelector('#guidance-summary');
guidanceType?.addEventListener('change', () => {
  const skill = guidanceType.value === 'skill';
  if (guidanceValue) guidanceValue.value = skill
    ? 'evaluation-skill://production-reliability/v3'
    : '사업장 조건 누락은 중대한 실패로 분류';
  if (guidanceSummary) guidanceSummary.textContent = skill ? 'Evaluation Skill' : '평가용 시스템 메시지';
  setPlanReady(false);
});

const planPanel = document.querySelector('#plan-panel');
const planTitle = document.querySelector('#plan-title');
const instanceId = document.querySelector('#instance-id');
const generatePlan = document.querySelector('#generate-plan');
const startEvaluation = document.querySelector('#start-evaluation');

function setPlanReady(ready) {
  planPanel?.classList.toggle('generated', ready);
  if (planTitle) planTitle.textContent = ready ? '평가 계획 준비 완료' : '평가 계획 미생성';
  if (instanceId) instanceId.textContent = ready ? 'EXP-20260812-04 · 실험 Instance' : '실험 Instance 생성 전';
  if (generatePlan) generatePlan.textContent = ready ? '평가 계획 다시 생성' : '평가 계획 생성';
  startEvaluation?.classList.toggle('disabled', !ready);
}

generatePlan?.addEventListener('click', () => {
  planPanel?.classList.add('generating');
  generatePlan.disabled = true;
  generatePlan.textContent = 'Agent가 계획 생성 중…';
  window.setTimeout(() => {
    planPanel?.classList.remove('generating');
    generatePlan.disabled = false;
    setPlanReady(true);
  }, 850);
});
setPlanReady(params.get('plan') === 'ready');
modeButtons.forEach((button) => button.addEventListener('click', () => setPlanReady(false)));

const questionPairs = document.querySelector('#question-pairs');
const questionCount = document.querySelector('#question-count');
const readyCount = document.querySelector('#ready-question-count');
const readyRecommendedCount = document.querySelector('#ready-recommended-count');
const readyAnswerCount = document.querySelector('#ready-answer-count');
const readyAnswerTotal = document.querySelector('#ready-answer-total');
const questionInput = document.querySelector('#question-input');

function updateQuestionCount() {
  const rows = questionPairs?.querySelectorAll('.question-pair') || [];
  const count = rows.length;
  const recommended = [...rows].filter((row) => row.dataset.origin === 'recommended').length;
  const answers = [...rows].filter((row) => row.querySelector('textarea')?.value.trim()).length;
  if (questionCount) questionCount.textContent = `${count} Questions · 정답 ${answers}`;
  if (readyCount) readyCount.textContent = String(count);
  if (readyRecommendedCount) readyRecommendedCount.textContent = String(recommended);
  if (readyAnswerCount) readyAnswerCount.textContent = String(answers);
  if (readyAnswerTotal) readyAnswerTotal.textContent = String(count);
}

function appendQuestion(text, origin = 'input') {
  if (!questionPairs || !text.trim()) return;
  const item = document.createElement('article');
  item.className = 'question-pair';
  item.dataset.origin = origin;
  item.innerHTML = `<div class="question-row"><span class="origin ${origin === 'recommended' ? 'recommended' : 'input'}">${origin === 'recommended' ? '추천' : '입력'}</span><p></p><button class="answer-toggle">＋ 정답지</button><button class="remove-question">×</button></div><div class="answer-editor hidden"><label><span>정답지 <em>선택</em></span><textarea placeholder="이 질문에 대응하는 이상적인 전체 답변을 입력하세요."></textarea></label></div>`;
  item.querySelector('p').textContent = text.trim();
  questionPairs.append(item);
  updateQuestionCount();
  setPlanReady(false);
}

document.querySelector('#add-question')?.addEventListener('click', () => {
  appendQuestion(questionInput?.value || '');
  if (questionInput) questionInput.value = '';
});
questionInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.querySelector('#add-question')?.click();
  }
});
questionPairs?.addEventListener('click', (event) => {
  const pair = event.target.closest('.question-pair');
  if (!pair) return;
  if (event.target.classList.contains('remove-question')) {
    pair.remove();
    updateQuestionCount();
    setPlanReady(false);
  }
  if (event.target.classList.contains('answer-toggle')) {
    const editor = pair.querySelector('.answer-editor');
    editor?.classList.toggle('hidden');
    if (!editor?.classList.contains('hidden')) editor.querySelector('textarea')?.focus();
  }
});
questionPairs?.addEventListener('input', (event) => {
  if (event.target.tagName !== 'TEXTAREA') return;
  const pair = event.target.closest('.question-pair');
  const toggle = pair?.querySelector('.answer-toggle');
  const complete = Boolean(event.target.value.trim());
  toggle?.classList.toggle('complete', complete);
  if (toggle) toggle.textContent = complete ? '정답 입력됨' : '＋ 정답지';
  updateQuestionCount();
  setPlanReady(false);
});

const recommendations = document.querySelector('#recommendations');
document.querySelector('#generate-questions')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.textContent = '추천 생성 중…';
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = '✦ 추천질문';
    button.disabled = false;
    openModal(document.querySelector('#recommend-modal'));
  }, 500);
});

recommendations?.addEventListener('change', () => {
  const selected = recommendations.querySelectorAll('input:checked').length;
  const apply = document.querySelector('#apply-recommendations');
  if (apply) apply.textContent = `선택한 ${selected}개 추가`;
});
document.querySelector('#apply-recommendations')?.addEventListener('click', (event) => {
  const selected = recommendations?.querySelectorAll('label input:checked') || [];
  selected.forEach((input) => {
    const text = input.closest('label')?.querySelector('p')?.textContent || '';
    appendQuestion(text, 'recommended');
    input.checked = false;
  });
  closeModal(document.querySelector('#recommend-modal'));
  event.currentTarget.textContent = '선택한 0개 추가';
});

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => {
  closeModal(button.closest('.modal-layer'));
}));
document.querySelectorAll('.modal-layer').forEach((layer) => layer.addEventListener('click', (event) => {
  if (event.target === layer) closeModal(layer);
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.modal-layer.open').forEach(closeModal);
});

const nodeGuideModal = document.querySelector('#node-guide-modal');
const nodeGuideName = document.querySelector('#node-guide-name');
const nodeGuideType = document.querySelector('#node-guide-type');
const nodeGuideValue = document.querySelector('#node-guide-value');
const nodeGuideValueLabel = document.querySelector('#node-guide-value-label');
const nodeGuideIcon = document.querySelector('#node-guide-icon');
let currentNodeGuideButton = null;

const nodeGuideDefaults = {
  intent_router: '질문의 사업장·자재·기준일 조건이 다음 Node 출력에 모두 보존되었는지 평가한다.',
  policy_retriever: '검색 문서가 질문의 정책 범위와 일치하고 답변 주장의 근거가 되는지 평가한다.',
  inventory_api: 'evaluation-skill://tool-argument-contract/v2',
  decision: '가동 판단이 조회 결과와 업무 규칙을 빠짐없이 반영했는지 평가한다.'
};

function updateNodeGuideCount() {
  const total = document.querySelectorAll('.node-guide').length;
  const configured = document.querySelectorAll('.node-guide.configured').length;
  const count = document.querySelector('#node-guide-count');
  if (count) count.textContent = `Node 지침 ${configured} / ${total}`;
}

document.querySelectorAll('.node-guide').forEach((button) => button.addEventListener('click', (event) => {
  event.stopPropagation();
  currentNodeGuideButton = button;
  const node = button.closest('.graph-node');
  const name = button.dataset.node;
  const type = button.dataset.guide || 'prompt';
  if (nodeGuideName) nodeGuideName.textContent = name;
  if (nodeGuideType) nodeGuideType.value = type;
  if (nodeGuideValueLabel) nodeGuideValueLabel.textContent = type === 'skill' ? 'Skill URI' : 'Prompt';
  if (nodeGuideValue) nodeGuideValue.value = button.dataset.value || nodeGuideDefaults[name] || '';
  if (nodeGuideIcon) nodeGuideIcon.className = node?.classList.contains('rag') ? 'rag' : node?.classList.contains('tool') ? 'tool' : 'llm';
  openModal(nodeGuideModal);
}));

nodeGuideType?.addEventListener('change', () => {
  const skill = nodeGuideType.value === 'skill';
  if (nodeGuideValueLabel) nodeGuideValueLabel.textContent = skill ? 'Skill URI' : 'Prompt';
  if (nodeGuideValue && currentNodeGuideButton) nodeGuideValue.value = skill
    ? `evaluation-skill://${currentNodeGuideButton.dataset.node}/v1`
    : nodeGuideDefaults[currentNodeGuideButton.dataset.node] || '';
});

document.querySelector('#save-node-guide')?.addEventListener('click', () => {
  if (!currentNodeGuideButton) return;
  const type = nodeGuideType?.value || 'prompt';
  currentNodeGuideButton.dataset.guide = type;
  currentNodeGuideButton.dataset.value = nodeGuideValue?.value || '';
  currentNodeGuideButton.classList.add('configured');
  currentNodeGuideButton.textContent = type === 'skill' ? '✓ Skill' : '✓ Prompt';
  updateNodeGuideCount();
  setPlanReady(false);
  closeModal(nodeGuideModal);
});

document.querySelector('#remove-node-guide')?.addEventListener('click', () => {
  if (!currentNodeGuideButton) return;
  currentNodeGuideButton.classList.remove('configured');
  delete currentNodeGuideButton.dataset.guide;
  delete currentNodeGuideButton.dataset.value;
  currentNodeGuideButton.textContent = '＋ 지침';
  updateNodeGuideCount();
  setPlanReady(false);
  closeModal(nodeGuideModal);
});
updateNodeGuideCount();

document.querySelector('#edit-targets')?.addEventListener('click', (event) => {
  const targets = document.querySelectorAll('.design-graph .graph-node:not(.muted)');
  const editing = event.currentTarget.dataset.editing !== 'true';
  event.currentTarget.dataset.editing = String(editing);
  event.currentTarget.textContent = editing ? '선택 완료' : '대상 변경';
  targets.forEach((node) => node.classList.toggle('selectable', editing));
});
document.querySelector('.design-graph')?.addEventListener('click', (event) => {
  const node = event.target.closest('.graph-node.selectable');
  if (node) node.classList.toggle('target');
});

document.querySelectorAll('.node-list>button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.node-list>button').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelectorAll('.result-questions>button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.result-questions>button').forEach((item) => item.classList.toggle('active', item === button));
}));

function setRunComplete() {
  document.querySelector('#run-summary')?.classList.add('completed');
  const title = document.querySelector('#run-state-title');
  const copy = document.querySelector('#run-state-copy');
  const bar = document.querySelector('#run-progress-bar');
  const progress = document.querySelector('#run-progress-text');
  const questions = document.querySelector('#run-question-count');
  const resultLink = document.querySelector('#result-link');
  const hint = document.querySelector('#result-hint');
  if (title) title.textContent = '검증 완료';
  if (copy) copy.textContent = '결과 분석 준비 완료';
  if (bar) bar.style.width = '100%';
  if (progress) progress.textContent = '100%';
  if (questions) questions.textContent = '12 / 12';
  resultLink?.classList.remove('disabled');
  document.querySelector('#pause-run')?.classList.add('hidden');
  document.querySelector('#stop-run')?.classList.add('hidden');
  if (hint) {
    hint.textContent = '전체 Cycle이 완료되었습니다. 결과 분석에서 질문별·Node별 판정을 확인하세요.';
    hint.classList.add('ready');
  }
  document.querySelectorAll('.cycle-panel li').forEach((item) => {
    item.classList.remove('active');
    item.classList.add('done');
    const status = item.querySelector(':scope > span');
    const copy = item.querySelector('small');
    if (status) { status.className = ''; status.textContent = '✓'; }
    if (copy) copy.textContent = '완료';
  });
  document.querySelectorAll('.live-graph .graph-node').forEach((node) => {
    node.classList.remove('active', 'waiting');
    node.classList.add('done');
    const status = node.querySelector('em');
    if (status) { status.className = ''; status.textContent = '✓'; }
  });
}

if (params.get('state') === 'complete') setRunComplete();
if (params.get('modal') === 'recommend') openModal(document.querySelector('#recommend-modal'));
if (params.get('modal') === 'node') document.querySelector(`.node-guide[data-node="${params.get('node') || 'intent_router'}"]`)?.click();

updateQuestionCount();
