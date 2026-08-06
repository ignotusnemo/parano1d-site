(() => {
  "use strict";

  const chapters = [...document.querySelectorAll(".chapter")];
  const dots = [...document.querySelectorAll(".state-dot")];
  const prevButton = document.querySelector("#prev");
  const nextButton = document.querySelector("#next");
  const deckTitle = document.querySelector("#deck-title");
  const deckProof = document.querySelector("#deck-proof");
  const flash = document.querySelector("#transition-flash");
  const suffix = document.querySelector("#suffix");
  const app = document.querySelector("#app");
  const sceneElement = document.querySelector(".scene");
  const stateRail = document.querySelector(".state-rail");
  const overviewFacts = document.querySelector("#overview .hero-facts");
  const presentDetails = document.querySelector("#present .ledger");
  const mobileSceneAnchors = chapters.map((chapter) => chapter.querySelector(".chapter-inner")?.lastElementChild || null);
  const controlDeck = document.querySelector(".control-deck");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  const launchNotice = document.querySelector("#launch-notice");
  const launchNoticeClose = document.querySelector("#launch-notice-close");
  const navDropdowns = [...document.querySelectorAll(".nav-dropdown")];
  const downloadsModal = document.querySelector("#downloads-modal");
  const downloadsClose = document.querySelector("#downloads-close");
  const downloadsOpeners = [...document.querySelectorAll("[data-download-open]")];
  const downloadsPreview = document.querySelector("[data-download-preview]");
  const repositoryGate = document.querySelector("#repository-gate");
  const repositoryGateClose = document.querySelector("#repository-gate-close");
  const repositoryGateDismiss = document.querySelector("#repository-gate-dismiss");
  let mobileSceneLayoutFrame = 0;

  // Disable this single flag when the core repository becomes public.
  const PRIVATE_REPOSITORY_GATE = true;
  let repositoryGateLastFocus = null;
  let repositoryGateCloseTimer = 0;

  const launchNoticeStorageKey = "parano1d-public-network-2026-08-dismissed";
  try {
    if (localStorage.getItem(launchNoticeStorageKey) === "1") {
      launchNotice.hidden = true;
      app.classList.remove("launch-notice-visible");
    }
  } catch {}

  function secureExternalLinks(root = document) {
    root.querySelectorAll('a[href^="https://"], a[href^="http://"]').forEach((link) => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  secureExternalLinks();

  function isPrivateRepositoryLink(link) {
    if (!PRIVATE_REPOSITORY_GATE || !(link instanceof HTMLAnchorElement)) return false;
    try {
      const url = new URL(link.href, window.location.href);
      return url.hostname.toLowerCase() === "github.com"
        && /^\/ignotusnemo\/parano1d(?:\/|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  function openRepositoryGate() {
    if (!repositoryGate || !repositoryGate.hidden) return;
    clearTimeout(repositoryGateCloseTimer);
    repositoryGateLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    repositoryGate.hidden = false;
    document.body.classList.add("repository-gate-open");
    requestAnimationFrame(() => {
      repositoryGate.classList.add("is-open");
      repositoryGateClose?.focus({ preventScroll: true });
    });
  }

  function closeRepositoryGate() {
    if (!repositoryGate || repositoryGate.hidden) return;
    repositoryGate.classList.remove("is-open");
    document.body.classList.remove("repository-gate-open");
    repositoryGateCloseTimer = window.setTimeout(() => { repositoryGate.hidden = true; }, 220);
    repositoryGateLastFocus?.focus?.({ preventScroll: true });
  }

  function gatePrivateRepositoryNavigation(event) {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!isPrivateRepositoryLink(link)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openRepositoryGate();
  }

  document.addEventListener("click", gatePrivateRepositoryNavigation, true);
  document.addEventListener("auxclick", gatePrivateRepositoryNavigation, true);
  repositoryGateClose?.addEventListener("click", closeRepositoryGate);
  repositoryGateDismiss?.addEventListener("click", closeRepositoryGate);
  repositoryGate?.addEventListener("click", (event) => {
    if (event.target === repositoryGate) closeRepositoryGate();
  });
  repositoryGate?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...repositoryGate.querySelectorAll("a[href], button:not([disabled])")];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !repositoryGate || repositoryGate.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeRepositoryGate();
  }, true);

  function activeChapterTranslateY(chapter) {
    if (!chapter) return 0;
    const transform = getComputedStyle(chapter).transform;
    if (!transform || transform === "none") return 0;
    try {
      return new DOMMatrixReadOnly(transform).m42 || 0;
    } catch {
      const values = transform.match(/^matrix\((.+)\)$/)?.[1].split(",").map(Number);
      return values?.[5] || 0;
    }
  }

  function applyMobileSceneLayout() {
    if (window.innerWidth > 820 || !controlDeck || !sceneElement) {
      app.style.removeProperty("--mobile-scene-top");
      return;
    }

    const appRect = app.getBoundingClientRect();
    const deckRect = controlDeck.getBoundingClientRect();
    const deckTop = deckRect.top - appRect.top;
    const activeStep = Math.max(0, Math.min(chapters.length - 1, Number(app.dataset.currentStep || 0)));
    const anchor = activeStep === 0 ? overviewFacts : mobileSceneAnchors[activeStep];
    if (!anchor) return;

    const transitionOffset = activeChapterTranslateY(chapters[activeStep]);
    const contentBottom = anchor.getBoundingClientRect().bottom - appRect.top - transitionOffset;
    if (activeStep === 0) {
      const minimumSceneHeight = Math.min(190, Math.max(150, appRect.height * .25));
      const sceneTop = Math.min(contentBottom + 5, deckTop - minimumSceneHeight);
      app.style.setProperty("--mobile-scene-top", `${Math.max(0, Math.round(sceneTop))}px`);
      return;
    }

    const sceneBottom = sceneElement.getBoundingClientRect().bottom - appRect.top;
    const gap = Math.min(8, Math.max(4, appRect.height * .009));
    const minimumVisibleHeight = Math.min(96, Math.max(72, appRect.height * .115));
    const sceneTop = Math.min(contentBottom + gap, sceneBottom - minimumVisibleHeight);
    app.style.setProperty("--mobile-scene-top", `${Math.max(0, Math.round(sceneTop))}px`);
  }

  function syncMobileSceneLayouts({ immediate = false } = {}) {
    cancelAnimationFrame(mobileSceneLayoutFrame);
    if (immediate) {
      mobileSceneLayoutFrame = 0;
      applyMobileSceneLayout();
      return;
    }
    mobileSceneLayoutFrame = requestAnimationFrame(() => {
      mobileSceneLayoutFrame = 0;
      applyMobileSceneLayout();
    });
  }

  function dismissLaunchNotice() {
    if (!launchNotice || launchNotice.hidden) return;
    launchNotice.classList.add("is-closing");
    app.classList.remove("launch-notice-visible");
    try { localStorage.setItem(launchNoticeStorageKey, "1"); } catch {}
    syncMobileSceneLayouts();
    window.setTimeout(() => {
      launchNotice.hidden = true;
      launchNotice.classList.remove("is-closing");
      syncMobileSceneLayouts({ immediate: true });
    }, 280);
  }

  launchNoticeClose?.addEventListener("click", dismissLaunchNotice);

  function syncViewportHeight() {
    const height = Math.round(window.visualViewport?.height || window.innerHeight);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    syncMobileSceneLayouts();
  }

  syncViewportHeight();
  window.addEventListener("resize", syncViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });

  const sceneLabels = {
    stateTitle: document.querySelector("#scene-state-title"),
    stateCopy: document.querySelector("#scene-state-copy"),
    proofTitle: document.querySelector("#scene-proof-title"),
    proofCopy: document.querySelector("#scene-proof-copy"),
    tailTitle: document.querySelector("#scene-tail-title"),
    tailCopy: document.querySelector("#scene-tail-copy"),
    readState: document.querySelector("#read-state"),
    readHistory: document.querySelector("#read-history"),
    readVerify: document.querySelector("#read-verify")
  };

  const translations = {
    ru: {
      "brand.home": "Главная ParanO(1)d",
      "announcement.label": "Объявление о запуске сети",
      "announcement.launch": "Запуск публичной сети · август 2026",
      "announcement.contact": "Связаться с разработчиком",
      "announcement.dismiss": "Закрыть объявление",
      "nav.language": "Язык",
      "nav.menu": "Меню",
      "nav.downloads": "Загрузки",
      "nav.docs": "Документация",
      "repositoryGate.dialog": "Доступ к исходному коду Parano1d",
      "repositoryGate.close": "Закрыть сообщение",
      "repositoryGate.eyebrow": "Исходный код",
      "repositoryGate.title": "Код откроется перед запуском.",
      "repositoryGate.copy": "Основной репозиторий остаётся закрытым на финальном этапе подготовки. Код будущего релиза будет опубликован перед запуском публичной сети.",
      "repositoryGate.launch": "Запуск публичной сети · август 2026",
      "repositoryGate.contact": "Связаться с разработчиком",
      "repositoryGate.dismiss": "Закрыть",
      "downloads.dialog": "Загрузки Parano1d",
      "downloads.close": "Закрыть загрузки",
      "downloads.header": "Загрузки",
      "downloads.latest": "Последний релиз",
      "downloads.open": "Релиз",
      "downloads.all": "Все",
      "downloads.release": "Релиз",
      "downloads.gui.label": "01 / Нативное приложение",
      "downloads.gui.title": "GUI-кошелёк",
      "downloads.gui.copy": "Устанавливается как обычное приложение. Создайте или восстановите один 256-битный секрет, затем пользуйтесь кошельком, собственной полной нодой, Scope и майнером без терминала.",
      "downloads.preview": "Главный экран GUI-кошелька Parano1d",
      "downloads.preview.app": "Нативное приложение",
      "downloads.preview.stack": "Кошелёк + собственная полная нода",
      "downloads.preview.copy": "Одно приложение хранит секрет, проверяет сеть и отправляет доказанные транзакции.",
      "downloads.wallet.docs": "Документация кошелька",
      "downloads.gui.builds": "Сборки GUI-кошелька",
      "downloads.download": "Скачать",
      "downloads.core.label": "02 / Ноды и майнеры",
      "downloads.core.title": "Core-инструменты",
      "downloads.core.copy": "Для операторов нод, автоматизации и отдельного процесса майнинга. Каждый Core-архив содержит все три консольных бинарника для выбранной платформы.",
      "downloads.core.includes": "Один архив. Три специализированных инструмента.",
      "downloads.core.binaries": "Бинарники Core",
      "downloads.core.builds": "Архивы Core-инструментов",
      "downloads.integrity.title": "Проверяйте каждый файл.",
      "downloads.integrity.copy": "Вместе с установщиками и архивами каждого релиза публикуются контрольные суммы SHA-256.",
      "readout.state": "состояние",
      "readout.history": "история",
      "readout.verify": "проверка",
      "overview.index": "Сеть не повторяет исполнение. Она проверяет.",
      "overview.title": "Proof-native<br><em>L1 network</em>",
      "overview.lead": "<strong>Кошелёк доказывает владение. Майнер — точный переход состояния. Каждая нода проверяет результат.</strong> Без подписей. Без доверенной настройки. Без повтора с генезиса.",
      "overview.enter": "ПОЧЕМУ? <span>→</span>",
      "overview.fact.sync.value": "O(1) SYNC",
      "overview.fact.sync.copy": "без истории. без архивных нод",
      "overview.fact.signatureless.value": "БЕЗ ПОДПИСЕЙ",
      "overview.fact.signatureless.copy": "владение через хеш. <span class=\"nowrap\">PQ-safe</span>",
      "overview.fact.pow.value": "POW - ПОРЯДОК",
      "overview.fact.pow.copy": "переход разрешён доказательством",
      "dependency.index": "01 / Наследуемая зависимость",
      "dependency.title": "Классический блокчейн<br><em>Проверяет историю с генезиса.</em>",
      "dependency.lead": "Bitcoin, Ethereum и почти все современные блокчейны доказывают текущее состояние только одним способом: исполняют цепочку от генезиса. Чем активнее и старше сеть, тем больше работы ждёт каждую новую ноду.",
      "dependency.row1.label": "Основа доверия",
      "dependency.row1.value": "<strong>Полный журнал исполнения</strong>",
      "dependency.row2.label": "Новая полная нода",
      "dependency.row2.value": "Скачивает цепочку и исполняет её заново",
      "dependency.row3.label": "Возраст сети",
      "dependency.row3.value": "С каждым годом повышает требования к железу",
      "present.index": "02 / Разрыв с историей",
      "present.title": "В Parano1d<br><em>настоящее проверяется без прошлого.</em>",
      "present.lead": "<strong>Parano1d отделяет проверку корректности от повтора истории.</strong> Сеть поддерживает доказуемое живое UTXO-состояние: потраченные выходы освобождают место, а годы прошлой активности не превращаются в нагрузку для будущих нод.",
      "present.row1.label": "Рост состояния",
      "present.row1.value": "<strong>Живые UTXO, а не история транзакций</strong>",
      "present.row2.label": "Потраченные выходы",
      "present.row2.value": "Слоты очищаются и возвращаются аллокатору",
      "present.row3.label": "Возраст сети",
      "present.row3.value": "Не требует хранить всю историю и повторять цепочку с генезиса",
      "proof.index": "04 / Изменение парадигмы",
      "proof.title": "Где хранятся данные,<br><em>там и доказывай.</em>",
      "proof.lead": "Доказательство в Parano1d строит тот, у кого есть нужные данные. Сеть получает готовый результат, а не задачу повторить ту же работу.",
      "proof.wallet.label": "Кошелёк",
      "proof.wallet.copy": "Доказывает право расходования, не раскрывая секрет.",
      "proof.miner.label": "Майнер",
      "proof.miner.copy": "Доказывает публичную логику транзакции и точный переход состояния.",
      "proof.network.label": "Сеть",
      "proof.network.copy": "Проверяет доказательства, применяет доказанные изменения слотов и проверяет PoW.",
      "living.index": "05 / Живое состояние UTXO",
      "living.title": "Состояние растёт<br>от использования.<br><em>Не от времени.</em>",
      "living.lead": "Расходование освобождает слот. Аллокатор сначала использует свободные позиции и лишь затем расширяет состояние. Пустые сегменты существуют виртуально и исчезают, когда освобождён их последний UTXO.",
      "living.spend.label": "Расходование",
      "living.spend.value": "Очистить слот по индексу",
      "living.reuse.label": "Повторное использование",
      "living.reuse.value": "Поместить новый <code>creation_id</code> в свободную позицию",
      "living.expand.label": "Расширение",
      "living.expand.value": "При заполнении 75% подключить каноническую пустую половину без остановки сети",
      "ownership.index": "06 / Владение без подписей",
      "ownership.title": "Достаточно секрета.<br><em>Без пары ключей. Без подписи.</em>",
      "ownership.lead": "Parano1d нужны 256 бит секретной энтропии, а не пара ключей или мнемонический формат. Кошелёк доказывает знание секрета, не раскрывая его; каждая трата создаёт новое ZK-доказательство, связанное со всей транзакцией.",
      "ownership.secret": "секрет расходования",
      "ownership.address": "адрес o1…",
      "ownership.protocol.label": "Протокол",
      "ownership.protocol.value": "256-битный секрет · без обязательной мнемоники",
      "ownership.wire.label": "В сети",
      "ownership.wire.value": "Нет публичного ключа · нет подписи транзакции",
      "ownership.consensus.label": "В консенсусе",
      "ownership.consensus.value": "<strong>Владение только через хеш. <span class=\"nowrap\">PQ-safe</span> с генезиса</strong>",
      "paged.index": "07 / PagedSpend",
      "paged.title": "Много UTXO.<br><em>Одна транзакция.</em>",
      "paged.lead": "Страницы доказательства — только внутренняя геометрия протокола. До 128 страниц всё ещё образуют одну неделимую транзакцию пользователя: один txid, одна комиссия, одна capsule и один чек.",
      "paged.atomic": "1 020 входов · 256 выходов<br>ЕДИНЫЙ PAGEDSPEND",
      "history.index": "08 / Рекурсивная история",
      "history.title": "История сворачивается<br><em>в одно доказательство.</em>",
      "history.lead": "Каждый <code>HistoryStep</code> доказывает текущий блок и в той же схеме проверяет предыдущий terminal. Размер доказательства и работа верификатора не зависят от высоты цепочки.",
      "history.active.label": "Активная нода",
      "history.active.value": "Текущее состояние + компактные заголовки + последние 18 полных блоков",
      "history.age.label": "Возраст цепочки",
      "history.age.value": "<strong>Не увеличивает стоимость проверки истории</strong>",
      "privacy.index": "09 / Приватность через нехранение",
      "privacy.title": "Приватность<br><em>без приватности.</em>",
      "privacy.lead": "Текущее состояние публично, а транзакции видны, пока проходят через консенсус. Parano1d не заставляет каждую ноду сохранять постоянный граф транзакций. Чтобы годами следить за адресом, внешний трекер должен непрерывно записывать весь поток и сам оплачивать его хранение.",
      "privacy.live.label": "Текущий state",
      "privacy.live.value": "Публичные суммы · публичные владельцы",
      "privacy.graph.label": "Прошлый граф",
      "privacy.graph.value": "<strong>Не сохраняется консенсусом</strong>",
      "privacy.tracker.label": "Внешний трекинг",
      "privacy.tracker.value": "Записывать каждую транзакцию в реальном времени",
      "receipts.index": "10 / Переносимое доказательство платежа",
      "receipts.title": "История исчезает.<br><em>Чек остаётся.</em>",
      "receipts.lead": "После подтверждения платежа кошелёк отправителя сохраняет экспортируемый Merkle-чек. В нём находятся все публичные данные платежа и путь включения фиксированной глубины. Любая нода проверяет его по каноническому заголовку — старое тело блока не требуется.",
      "receipts.formula.payment": "платёж",
      "receipts.formula.receipt": "переносимый чек",
      "receipts.formula.verify": "проверено ✓",
      "receipts.auth.label": "Подтверждает",
      "receipts.auth.value": "txid · получателей · суммы · комиссию · время блока",
      "receipts.path.label": "Merkle-путь",
      "receipts.path.value": "Восемь уровней Poseidon2b",
      "receipts.body.label": "Старое тело блока",
      "receipts.body.value": "<strong>Не требуется</strong>",
      "stack.index": "11 / Единый бинарный proof stack",
      "stack.title": "Одна арифметика.<br><em>От начала до конца.</em>",
      "stack.lead": "Адреса, авторизация кошелька, транзакции, state, рекурсивная история и PoW используют один бинарный proof stack. FROST-GKR сворачивает повторяющиеся структуры Poseidon2b в общие булевы гиперкубы, а FRI-Binius замыкает relation без доверенной настройки.",
      "stack.formula.left": "владение + tx",
      "stack.formula.right": "state + история + PoW",
      "stack.field.label": "Поле",
      "stack.field.value": "<code>GF(2^128)</code> · единая бинарная арифметика",
      "stack.prover.label": "Prover",
      "stack.prover.value": "<strong>В 10,50 раза быстрее</strong> в сравнении на 59 перестановках",
      "stack.proof.label": "Алгебраический proof",
      "stack.proof.value": "<strong>В 51,67 раза меньше</strong>",
      "pow.index": "12 / Proof-native PoW",
      "pow.title": "Сначала докажи.<br><em>Потом майни.</em>",
      "pow.lead": "PoW только определяет порядок уже доказанных переходов. Майнер завершает не зависящее от nonce доказательство блока, фиксирует неизменяемый шаблон и перебирает лишь 128-битный nonce.",
      "pow.target.label": "Цель блока",
      "pow.target.value": "<strong>В среднем 15 секунд</strong> · сложность ASERT",
      "pow.majority.label": "Большинство хешрейта",
      "pow.majority.value": "Может цензурировать · менять порядок · делать реорги",
      "pow.boundary.label": "Граница доказательства",
      "pow.boundary.value": "<strong>Не может подделать владение или принять некорректный state</strong>",
      "join.index": "03 / Независимый bootstrap",
      "join.title": "Bootstrap из доказательства.<br><em>Не из доверия.</em>",
      "join.lead": "<strong>Пиры передают данные, а не доверие.</strong> Нода получает живое UTXO-состояние, соответствующий terminal и последние 18 полных блоков. Она подтверждает state, проверяет окно реорганизаций и становится независимой полной нодой. Процедура одинакова и в первый, и в десятый год сети.",
      "join.formula.state": "живое состояние",
      "join.formula.proof": "π<sub>tip</sub> + 18 блоков",
      "join.formula.node": "независимая нода ✓",
      "run.index": "13 / Децентрализация на любом железе",
      "run.title": "Вся L1.<br><em>На твоём ноутбуке.</em>",
      "run.lead": "Твой ноутбук может хранить всё текущее состояние и поддерживать всю L1. Parano1d подстраивает ёмкость блока под доступную вычислительную мощность: сильное железо повышает TPS, слабое — снижает. Пропускная способность меняется. Сеть не останавливается.",
      "run.capacity.modest": "Твой ноутбук",
      "run.capacity.modest.value": "ниже TPS",
      "run.capacity.fast": "Мощное железо",
      "run.capacity.fast.value": "выше TPS",
      "run.capacity.network": "Сеть",
      "run.capacity.network.value": "продолжает выпускать блоки",
      "run.download": "Загрузить кошелёк",
      "rail.label": "Разделы Parano1d",
      "rail.0": "Обзор Parano1d",
      "rail.1": "Зависимость от истории",
      "rail.2": "Настоящее",
      "rail.3": "Независимый bootstrap",
      "rail.4": "Proof-native архитектура",
      "rail.5": "Живой state",
      "rail.6": "Владение без подписей",
      "rail.7": "PagedSpend",
      "rail.8": "Рекурсивная история",
      "rail.9": "Приватность через нехранение",
      "rail.10": "Переносимые чеки",
      "rail.11": "Единый бинарный proof stack",
      "rail.12": "Proof-native PoW",
      "rail.13": "Подключиться к Parano1d",
      "deck.previous": "Предыдущее состояние"
    },
    zh: {
      "brand.home": "ParanO(1)d 首页",
      "announcement.label": "网络启动公告",
      "announcement.launch": "公网启动 · 2026 年 8 月",
      "announcement.contact": "联系开发者",
      "announcement.dismiss": "关闭公告",
      "nav.language": "语言",
      "nav.menu": "菜单",
      "nav.downloads": "下载",
      "nav.docs": "文档",
      "repositoryGate.dialog": "Parano1d 源代码访问说明",
      "repositoryGate.close": "关闭提示",
      "repositoryGate.eyebrow": "源代码",
      "repositoryGate.title": "代码将在网络启动前公开。",
      "repositoryGate.copy": "核心代码仓库将在最终准备阶段保持私有。即将发布版本的代码将在公共网络启动前公开。",
      "repositoryGate.launch": "公共网络启动 · 2026 年 8 月",
      "repositoryGate.contact": "联系开发者",
      "repositoryGate.dismiss": "关闭",
      "downloads.dialog": "下载 Parano1d",
      "downloads.close": "关闭下载页面",
      "downloads.header": "下载",
      "downloads.latest": "最新版本",
      "downloads.open": "版本",
      "downloads.all": "全部",
      "downloads.release": "版本",
      "downloads.gui.label": "01 / 原生应用",
      "downloads.gui.title": "GUI 钱包",
      "downloads.gui.copy": "像普通桌面应用一样安装。创建或恢复一个 256 位主密钥后，无需终端即可使用钱包、专用全节点、Scope 和矿工。",
      "downloads.preview": "Parano1d GUI 钱包主界面",
      "downloads.preview.app": "原生桌面应用",
      "downloads.preview.stack": "钱包 + 专用全节点",
      "downloads.preview.copy": "一个应用负责保管主密钥、验证网络并提交已证明的交易。",
      "downloads.wallet.docs": "钱包文档",
      "downloads.gui.builds": "GUI 钱包构建",
      "downloads.download": "下载",
      "downloads.core.label": "02 / 节点运维与挖矿",
      "downloads.core.title": "Core 工具",
      "downloads.core.copy": "适用于节点运维、自动化及独立挖矿进程。每个 Core 归档包都包含该平台所需的三个命令行程序。",
      "downloads.core.includes": "一个归档包，三个专用工具。",
      "downloads.core.binaries": "Core 可执行文件",
      "downloads.core.builds": "Core 工具归档包",
      "downloads.integrity.title": "请校验每个文件。",
      "downloads.integrity.copy": "每个版本都会随安装包和归档包一并发布 SHA-256 校验和。",
      "readout.state": "状态",
      "readout.history": "历史",
      "readout.verify": "验证",
      "overview.index": "网络不重复执行，只验证证明。",
      "overview.title": "Proof-native<br><em>L1 network</em>",
      "overview.lead": "<strong>钱包证明所有权，矿工证明精确状态转移，每个节点验证最终结果。</strong> 无需签名。无需可信设置。无需从创世块重放。",
      "overview.enter": "为什么？ <span>→</span>",
      "overview.fact.sync.value": "O(1) 同步",
      "overview.fact.sync.copy": "无历史。无需归档节点",
      "overview.fact.signatureless.value": "无签名",
      "overview.fact.signatureless.copy": "纯哈希所有权。<span class=\"nowrap\">后量子安全</span>",
      "overview.fact.pow.value": "POW 只负责排序",
      "overview.fact.pow.copy": "每次转移由证明授权",
      "dependency.index": "01 / 历史依赖",
      "dependency.title": "传统区块链<br><em>从创世块开始验证全部历史。</em>",
      "dependency.lead": "Bitcoin、Ethereum 和几乎所有现代区块链，都要从创世块开始执行全部历史，才能得到当前状态。网络使用得越多，每个未来验证者背负的永久启动成本就越高。",
      "dependency.row1.label": "信任来源",
      "dependency.row1.value": "<strong>完整执行日志</strong>",
      "dependency.row2.label": "新全节点",
      "dependency.row2.value": "下载并重新执行整条链",
      "dependency.row3.label": "网络年龄",
      "dependency.row3.value": "持续抬高独立验证的硬件门槛",
      "present.index": "02 / 摆脱历史依赖",
      "present.title": "在 Parano1d 中<br><em>当前状态可以自证有效性。</em>",
      "present.lead": "<strong>Parano1d 将有效性与历史重放分离。</strong> 共识只承载可证明的实时 UTXO 状态：已花费输出释放槽位，过去多年的活动不会变成未来节点的永久负担。",
      "present.row1.label": "状态增长",
      "present.row1.value": "<strong>取决于实时 UTXO，而非历史交易总量</strong>",
      "present.row2.label": "已花费输出",
      "present.row2.value": "槽位清空后返回分配器复用",
      "present.row3.label": "链龄",
      "present.row3.value": "不会增加永久存储，也无需从创世块重放",
      "proof.index": "04 / 范式转变",
      "proof.title": "数据在哪里，<br><em>就在哪里完成证明。</em>",
      "proof.lead": "在 Parano1d 中，由掌握所需数据的一方完成证明。网络接收已证明的结果，而不是再做一遍同样的工作。",
      "proof.wallet.label": "钱包",
      "proof.wallet.copy": "证明私有授权，但不泄露花费秘密。",
      "proof.miner.label": "矿工",
      "proof.miner.copy": "证明公开交易逻辑与精确的状态转移。",
      "proof.network.label": "网络",
      "proof.network.copy": "验证证明、应用已证明的槽位写入，并检查 PoW。",
      "living.index": "05 / 活的 UTXO 状态",
      "living.title": "状态随实际使用增长。<br><em>不随时间膨胀。</em>",
      "living.lead": "花费会清空槽位。分配器优先复用空位，只有必要时才扩展状态。空段是虚拟的；其中最后一个 UTXO 花费后，该段也随之消失。",
      "living.spend.label": "花费",
      "living.spend.value": "清空对应的索引槽位",
      "living.reuse.label": "复用",
      "living.reuse.value": "在空位中签发新的 <code>creation_id</code>",
      "living.expand.label": "扩展",
      "living.expand.value": "占用率达到 75% 时接入规范空白半区——网络不停顿",
      "ownership.index": "06 / 无签名所有权",
      "ownership.title": "一个秘密就够了。<br><em>无需密钥对，无需签名。</em>",
      "ownership.lead": "Parano1d 需要的是 256 位秘密熵，而不是公私钥对或规定格式的助记词。钱包在不泄露秘密的前提下证明自己知道它；每次花费都会生成绑定完整交易的全新 ZK 证明。",
      "ownership.secret": "花费秘密",
      "ownership.address": "o1… 地址",
      "ownership.protocol.label": "协议",
      "ownership.protocol.value": "256 位秘密 · 不强制助记词格式",
      "ownership.wire.label": "线上数据",
      "ownership.wire.value": "没有公钥 · 没有交易签名",
      "ownership.consensus.label": "共识层",
      "ownership.consensus.value": "<strong>纯哈希所有权。自创世起即具备后量子安全性</strong>",
      "paged.index": "07 / PagedSpend",
      "paged.title": "许多 UTXO。<br><em>一笔交易。</em>",
      "paged.lead": "固定大小的证明页只是协议内部结构。最多 128 页仍是一笔不可分割的用户交易：一个 txid、一份手续费、一份 capsule、一张回执。",
      "paged.atomic": "1,020 个输入 · 256 个输出<br>原子 PAGEDSPEND",
      "history.index": "08 / 递归历史",
      "history.title": "整段历史，<br><em>收敛为固定证明。</em>",
      "history.lead": "每个 <code>HistoryStep</code> 都证明当前区块，并在同一关系内验证前一个 terminal。证明大小与验证工作不会随区块高度增长。",
      "history.active.label": "在线节点",
      "history.active.value": "实时状态 + 紧凑区块头 + 最近 18 个完整区块",
      "history.age.label": "链的年龄",
      "history.age.value": "<strong>不会增加历史验证成本</strong>",
      "privacy.index": "09 / 非留存式隐私",
      "privacy.title": "无需隐私链，<br><em>也有隐私。</em>",
      "privacy.lead": "实时状态是公开的，交易经过共识时也可被观察。Parano1d 不要求每个节点永久保存完整交易关系图。若想多年追踪某个地址，外部追踪器必须持续实时记录全部交易，并自行承担不断增长的存储成本。",
      "privacy.live.label": "实时状态",
      "privacy.live.value": "金额公开 · 所有者公开",
      "privacy.graph.label": "历史关系图",
      "privacy.graph.value": "<strong>共识不会永久保留</strong>",
      "privacy.tracker.label": "外部追踪",
      "privacy.tracker.value": "必须实时记录每一笔交易",
      "receipts.index": "10 / 可携带的付款证明",
      "receipts.title": "历史会退场。<br><em>回执仍可验证。</em>",
      "receipts.lead": "付款确认后，发送方钱包会保存一份可导出的 Merkle 回执。它包含完整的公开付款数据和固定深度的包含路径。任何节点都能依据规范区块头验证回执，无需保留旧区块正文。",
      "receipts.formula.payment": "付款",
      "receipts.formula.receipt": "可携带回执",
      "receipts.formula.verify": "验证通过 ✓",
      "receipts.auth.label": "认证内容",
      "receipts.auth.value": "txid · 收款地址 · 金额 · 手续费 · 区块时间",
      "receipts.path.label": "Merkle 路径",
      "receipts.path.value": "八层 Poseidon2b",
      "receipts.body.label": "旧区块正文",
      "receipts.body.value": "<strong>无需保留</strong>",
      "stack.index": "11 / 单一二进制证明栈",
      "stack.title": "同一种算术。<br><em>贯穿始终。</em>",
      "stack.lead": "地址、钱包授权、交易、状态、递归历史与 PoW 共用同一套二进制证明栈。FROST-GKR 把重复的 Poseidon2b 结构折叠进共享布尔超立方体，FRI-Binius 则在无需可信设置的前提下闭合整个关系。",
      "stack.formula.left": "所有权 + 交易",
      "stack.formula.right": "状态 + 历史 + PoW",
      "stack.field.label": "域",
      "stack.field.value": "<code>GF(2^128)</code> · 统一二进制算术",
      "stack.prover.label": "Prover",
      "stack.prover.value": "在 59 次置换对比中<strong>快 10.50 倍</strong>",
      "stack.proof.label": "代数证明",
      "stack.proof.value": "<strong>缩小 51.67 倍</strong>",
      "pow.index": "12 / Proof-native PoW",
      "pow.title": "先证明。<br><em>再挖矿。</em>",
      "pow.lead": "PoW 只负责排列已被证明有效的状态转移。矿工先完成与 nonce 无关的区块证明，冻结不可变模板，然后只搜索 128 位 nonce。",
      "pow.target.label": "出块目标",
      "pow.target.value": "<strong>平均 15 秒</strong> · ASERT 难度",
      "pow.majority.label": "多数算力",
      "pow.majority.value": "可以审查 · 调整顺序 · 发起重组",
      "pow.boundary.label": "证明边界",
      "pow.boundary.value": "<strong>无法伪造所有权，也无法让无效状态通过验证</strong>",
      "join.index": "03 / 独立启动",
      "join.title": "从证明启动。<br><em>无需信任。</em>",
      "join.lead": "<strong>对等节点提供数据，而不是信任。</strong> 新节点接收实时 UTXO 状态、匹配的 terminal 和最近 18 个完整区块，自行认证状态并验证重组窗口，最终成为独立全节点。无论网络运行一年还是十年，流程完全相同。",
      "join.formula.state": "实时状态",
      "join.formula.proof": "π<sub>tip</sub> + 18 个区块",
      "join.formula.node": "独立节点 ✓",
      "run.index": "13 / 适应不同硬件的去中心化",
      "run.title": "完整 L1。<br><em>就在你的笔记本上。</em>",
      "run.lead": "你的笔记本就能保存全部实时状态，并独立验证整条 L1。Parano1d 会根据可用计算能力自动调整区块容量：硬件越强，TPS 越高；硬件较弱，TPS 随之降低。吞吐量会变，网络不会停。",
      "run.capacity.modest": "你的笔记本",
      "run.capacity.modest.value": "较低 TPS",
      "run.capacity.fast": "更强硬件",
      "run.capacity.fast.value": "更高 TPS",
      "run.capacity.network": "网络",
      "run.capacity.network.value": "持续产生区块",
      "run.download": "下载钱包",
      "rail.label": "Parano1d 章节",
      "rail.0": "Parano1d 概览",
      "rail.1": "历史依赖",
      "rail.2": "当前状态",
      "rail.3": "独立启动",
      "rail.4": "Proof-native 架构",
      "rail.5": "活状态",
      "rail.6": "无签名所有权",
      "rail.7": "PagedSpend",
      "rail.8": "递归历史",
      "rail.9": "非留存式隐私",
      "rail.10": "可携带回执",
      "rail.11": "单一二进制证明栈",
      "rail.12": "Proof-native PoW",
      "rail.13": "加入 Parano1d",
      "deck.previous": "上一个状态"
    }
  };

  const states = [
    {
      title: "PARANO(1)D · PROOF-NATIVE LAYER 1",
      proof: "prove once · verify everywhere",
      state: ["ONE PROVER", "wallet + miner establish validity"],
      proofLabel: ["FIXED PROOF", "crosses the consensus boundary"],
      tail: ["EVERY NODE", "verifies · never re-executes"],
      read: ["prove once", "fixed proof", "verify"]
    },
    {
      title: "STATE 01 · THE DEPENDENCY",
      proof: "genesis → every transition → now",
      state: ["THE PRESENT", "derived at the far end"],
      proofLabel: ["REPLAY", "work grows with history"],
      tail: ["PERMANENT LOG", "every past transition"],
      read: ["reconstructed", "full replay", "lifetime"]
    },
    {
      title: "STATE 02 · THE PRESENT",
      proof: "live state · no lifetime replay",
      state: ["LIVE UTXO STATE", "clear · reuse · expand"],
      proofLabel: ["π_tip", "fixed verification work"],
      tail: ["RECENT SUFFIX", "18 reorg blocks"],
      read: ["live utxo", "π_tip", "present"]
    },
    {
      title: "STATE 04 · PROOF-NATIVE",
      proof: "wallet proves · miner proves · network verifies",
      state: ["NETWORK", "applies proven writes"],
      proofLabel: ["PROOF FLOW", "information moves once"],
      tail: ["CONSENSUS", "verification, not re-execution"],
      read: ["proven writes", "two proofs", "relations"]
    },
    {
      title: "STATE 05 · LIVING STATE",
      proof: "spent → clear → reuse before growth",
      state: ["LIVE SLOTS", "clear · reuse · expand"],
      proofLabel: ["NEW ROOT", "exact indexed writes"],
      tail: ["OCCUPANCY", "growth follows live use"],
      read: ["46.8% live", "root_h", "writes"]
    },
    {
      title: "STATE 06 · OWNERSHIP",
      proof: "secret → Poseidon2b → address",
      state: ["SPENDING SECRET", "never enters consensus"],
      proofLabel: ["ZK CAPSULE", "fresh randomized proof"],
      tail: ["ADDRESS", "stateless ownership"],
      read: ["o1 address", "zk capsule", "preimage"]
    },
    {
      title: "STATE 07 · PAGEDSPEND",
      proof: "up to 128 pages · one logical transaction",
      state: ["PROOF PAGES", "fixed internal geometry"],
      proofLabel: ["ONE TXID", "atomic acceptance"],
      tail: ["USER INTENT", "1 fee · 1 capsule · 1 receipt"],
      read: ["1,020 inputs", "one capsule", "atomic tx"]
    },
    {
      title: "STATE 08 · HISTORYSTEP",
      proof: "π_h−1 + block_h + state_h → π_h",
      state: ["NEW TRANSITION", "block_h · state_h"],
      proofLabel: ["π_h", "same terminal size"],
      tail: ["RECENT SUFFIX", "18 complete blocks"],
      read: ["state_h", "π_h", "fixed work"]
    },
    {
      title: "STATE 12 · PROOF-NATIVE POW",
      proof: "prove transition · freeze template · scan nonce",
      state: ["PROVEN BLOCK", "immutable template"],
      proofLabel: ["128-BIT NONCE", "ordering already-valid work"],
      tail: ["ASERT", "complete block interval · 15-second mean"],
      read: ["B25 · m22", "template locked", "pow"]
    },
    {
      title: "STATE 03 · INDEPENDENT BOOTSTRAP",
      proof: "peer data → local verification → independent node",
      state: ["PEER DATA", "live state · terminal · 18 blocks"],
      proofLabel: ["VERIFY LOCALLY", "authenticate state + reorg window"],
      tail: ["FULL NODE", "independent from its first state"],
      read: ["peer data", "local verify", "independent"]
    },
    {
      title: "STATE 13 · HARDWARE-ADAPTIVE L1",
      proof: "hardware changes TPS · the network keeps moving",
      state: ["NODES ON ANY DEVICE", "each holds + verifies the entire L1"],
      proofLabel: ["ADAPTIVE TPS", "capacity follows proving power"],
      tail: ["LIVE NETWORK", "throughput changes · consensus advances"],
      read: ["entire L1", "adaptive TPS", "decentralized"]
    },
    {
      title: "STATE 09 · NON-RETENTION",
      proof: "public present · no permanent transaction graph",
      state: ["LIVE STATE", "transparent now"],
      proofLabel: ["CONSENSUS", "does not retain provenance"],
      tail: ["EXTERNAL TRACKER", "must record the stream itself"],
      read: ["public state", "no graph", "own tracker"]
    },
    {
      title: "STATE 10 · PORTABLE RECEIPT",
      proof: "payment + Merkle path + canonical header",
      state: ["PAYMENT DATA", "txid · recipients · amounts"],
      proofLabel: ["POSEIDON2b PATH", "eight fixed levels"],
      tail: ["VERIFIED", "no historical block body"],
      read: ["payment", "8-level path", "canonical"]
    },
    {
      title: "STATE 11 · FROST-GKR",
      proof: "one binary arithmetic · end to end",
      state: ["GF(2^128)", "ownership · tx · state · history · PoW"],
      proofLabel: ["FROST-GKR", "shared Boolean hypercubes"],
      tail: ["FRI-BINIUS", "no trusted setup"],
      read: ["one field", "10.50×", "51.67×"]
    }
  ];

  const stateTranslations = {
    ru: [
      {
        title: "PARANO(1)D · PROOF-NATIVE LAYER 1",
        proof: "доказать один раз · проверить везде",
        state: ["ОДИН PROVER", "кошелёк и майнер доказывают корректность"],
        proofLabel: ["КОМПАКТНОЕ ДОКАЗАТЕЛЬСТВО", "пересекает границу консенсуса"],
        tail: ["КАЖДАЯ НОДА", "проверяет · не исполняет заново"],
        read: ["одно доказательство", "фиксированный proof", "проверка"]
      },
      {
        title: "СОСТОЯНИЕ 01 · ЗАВИСИМОСТЬ",
        proof: "генезис → каждый переход → сейчас",
        state: ["НАСТОЯЩЕЕ", "получается лишь в конце истории"],
        proofLabel: ["ПОВТОР ИСТОРИИ", "работа растёт вместе с ней"],
        tail: ["ВЕЧНЫЙ ЖУРНАЛ", "все прошлые переходы"],
        read: ["пересобрано", "полный повтор", "вся история"]
      },
      {
        title: "СОСТОЯНИЕ 02 · НАСТОЯЩЕЕ",
        proof: "живое состояние · без повтора всей истории",
        state: ["ТЕКУЩЕЕ СОСТОЯНИЕ UTXO", "очищается · переиспользуется · расширяется"],
        proofLabel: ["π_tip", "постоянная цена проверки"],
        tail: ["ОКНО РЕОРГОВ", "18 свежих блоков"],
        read: ["живые UTXO", "π_tip", "настоящее"]
      },
      {
        title: "СОСТОЯНИЕ 04 · PROOF-NATIVE",
        proof: "кошелёк доказывает · майнер доказывает · сеть проверяет",
        state: ["СЕТЬ", "применяет доказанные записи"],
        proofLabel: ["ПОТОК ДОКАЗАТЕЛЬСТВ", "информация движется один раз"],
        tail: ["КОНСЕНСУС", "проверка вместо повторного исполнения"],
        read: ["доказанные записи", "два доказательства", "связи"]
      },
      {
        title: "СОСТОЯНИЕ 05 · ЖИВОЕ СОСТОЯНИЕ",
        proof: "расходовать → очистить → использовать снова → расширить",
        state: ["ЖИВЫЕ СЛОТЫ", "очищаются · переиспользуются · расширяются"],
        proofLabel: ["НОВЫЙ КОРЕНЬ", "точные индексированные записи"],
        tail: ["ЗАПОЛНЕНИЕ", "рост следует за числом живых UTXO"],
        read: ["46.8% занято", "root_h", "записи"]
      },
      {
        title: "СОСТОЯНИЕ 06 · ВЛАДЕНИЕ",
        proof: "секрет → Poseidon2b → адрес",
        state: ["СЕКРЕТ РАСХОДОВАНИЯ", "не входит в консенсус"],
        proofLabel: ["ZK CAPSULE", "новое рандомизированное доказательство"],
        tail: ["АДРЕС", "stateless-владение"],
        read: ["адрес o1", "ZK capsule", "прообраз"]
      },
      {
        title: "СОСТОЯНИЕ 07 · PAGEDSPEND",
        proof: "до 128 страниц · одна логическая транзакция",
        state: ["СТРАНИЦЫ ДОКАЗАТЕЛЬСТВА", "фиксированная внутренняя геометрия"],
        proofLabel: ["ОДИН TXID", "атомарное принятие"],
        tail: ["НАМЕРЕНИЕ ПОЛЬЗОВАТЕЛЯ", "1 комиссия · 1 capsule · 1 чек"],
        read: ["1 020 входов", "одна capsule", "одна транзакция"]
      },
      {
        title: "СОСТОЯНИЕ 08 · HISTORYSTEP",
        proof: "π_h−1 + block_h + state_h → π_h",
        state: ["НОВЫЙ ПЕРЕХОД", "block_h · state_h"],
        proofLabel: ["π_h", "размер terminal не меняется"],
        tail: ["ОКНО РЕОРГОВ", "18 полных блоков"],
        read: ["state_h", "π_h", "постоянная работа"]
      },
      {
        title: "СОСТОЯНИЕ 12 · PROOF-NATIVE POW",
        proof: "доказать переход · зафиксировать шаблон · искать nonce",
        state: ["ДОКАЗАННЫЙ БЛОК", "неизменяемый шаблон"],
        proofLabel: ["128-БИТНЫЙ NONCE", "порядок уже корректных переходов"],
        tail: ["ASERT", "полный интервал блока · средняя цель 15 секунд"],
        read: ["B25 · m22", "шаблон зафиксирован", "PoW"]
      },
      {
        title: "СОСТОЯНИЕ 03 · НЕЗАВИСИМЫЙ BOOTSTRAP",
        proof: "данные пиров → локальная проверка → независимая нода",
        state: ["ДАННЫЕ ПИРОВ", "живой state · terminal · 18 блоков"],
        proofLabel: ["ПРОВЕРИТЬ ЛОКАЛЬНО", "подтвердить state и окно реоргов"],
        tail: ["ПОЛНАЯ НОДА", "независима с первого состояния"],
        read: ["данные пиров", "своя проверка", "независима"]
      },
      {
        title: "СОСТОЯНИЕ 13 · АДАПТИВНАЯ L1",
        proof: "железо меняет TPS · сеть продолжает работать",
        state: ["НОДЫ НА ЛЮБОМ УСТРОЙСТВЕ", "каждая хранит и проверяет всю L1"],
        proofLabel: ["АДАПТИВНЫЙ TPS", "ёмкость следует за мощностью"],
        tail: ["ЖИВАЯ СЕТЬ", "TPS меняется · консенсус движется"],
        read: ["вся L1", "адаптивный TPS", "децентрализована"]
      },
      {
        title: "СОСТОЯНИЕ 09 · НЕХРАНЕНИЕ",
        proof: "публичное настоящее · без вечного графа транзакций",
        state: ["ТЕКУЩИЙ STATE", "прозрачен сейчас"],
        proofLabel: ["КОНСЕНСУС", "не хранит происхождение вечно"],
        tail: ["ВНЕШНИЙ ТРЕКЕР", "сам записывает весь поток"],
        read: ["публичный state", "без графа", "свой трекер"]
      },
      {
        title: "СОСТОЯНИЕ 10 · ПЕРЕНОСИМЫЙ ЧЕК",
        proof: "платёж + Merkle-путь + канонический заголовок",
        state: ["ДАННЫЕ ПЛАТЕЖА", "txid · получатели · суммы"],
        proofLabel: ["ПУТЬ POSEIDON2b", "восемь фиксированных уровней"],
        tail: ["ПРОВЕРЕНО", "без исторического тела блока"],
        read: ["платёж", "путь ×8", "канонический"]
      },
      {
        title: "СОСТОЯНИЕ 11 · FROST-GKR",
        proof: "одна бинарная арифметика · от начала до конца",
        state: ["GF(2^128)", "владение · tx · state · история · PoW"],
        proofLabel: ["FROST-GKR", "общие булевы гиперкубы"],
        tail: ["FRI-BINIUS", "без доверенной настройки"],
        read: ["одно поле", "10,50×", "51,67×"]
      }
    ],
    zh: [
      {
        title: "PARANO(1)D · PROOF-NATIVE 状态链",
        proof: "只证明一次 · 所有节点验证",
        state: ["一个证明方", "钱包与矿工完成有效性证明"],
        proofLabel: ["固定证明", "跨越共识边界"],
        tail: ["每个节点", "只验证 · 不重复执行"],
        read: ["一次证明", "固定证明", "验证"]
      },
      {
        title: "状态 01 · 历史依赖",
        proof: "创世块 → 每次转移 → 此刻",
        state: ["当前状态", "位于历史的最远端"],
        proofLabel: ["重放", "工作量随历史增长"],
        tail: ["永久日志", "每一次历史转移"],
        read: ["重新构建", "完整重放", "全部历史"]
      },
      {
        title: "状态 02 · 当前状态",
        proof: "实时状态 · 无需重放全部历史",
        state: ["实时 UTXO 状态", "清空 · 复用 · 扩展"],
        proofLabel: ["π_tip", "固定验证成本"],
        tail: ["近期重组后缀", "18 个近期区块"],
        read: ["实时 utxo", "π_tip", "当前状态"]
      },
      {
        title: "状态 04 · PROOF-NATIVE",
        proof: "钱包证明 · 矿工证明 · 网络验证",
        state: ["网络", "应用已证明写入"],
        proofLabel: ["证明流", "信息只移动一次"],
        tail: ["共识", "只验证，不重复执行"],
        read: ["已证明写入", "两份证明", "关系"]
      },
      {
        title: "状态 05 · 实时 UTXO 状态",
        proof: "花费 → 清空 → 优先复用，再扩展",
        state: ["活跃槽位", "清空 · 复用 · 扩展"],
        proofLabel: ["新状态根", "精确索引写入"],
        tail: ["占用率", "只随实际使用增长"],
        read: ["46.8% 活跃", "root_h", "写入"]
      },
      {
        title: "状态 06 · 所有权",
        proof: "秘密 → Poseidon2b → 地址",
        state: ["花费秘密", "永不进入共识"],
        proofLabel: ["ZK CAPSULE", "全新随机化证明"],
        tail: ["地址", "无状态所有权"],
        read: ["o1 地址", "zk capsule", "原像"]
      },
      {
        title: "状态 07 · PAGEDSPEND",
        proof: "最多 128 页 · 一笔逻辑交易",
        state: ["证明分页", "固定内部几何"],
        proofLabel: ["一个 TXID", "原子接受"],
        tail: ["用户意图", "1 份手续费 · 1 份 capsule · 1 张回执"],
        read: ["1,020 个输入", "一个 capsule", "原子交易"]
      },
      {
        title: "状态 08 · HISTORYSTEP",
        proof: "π_h−1 + block_h + state_h → π_h",
        state: ["新状态转移", "block_h · state_h"],
        proofLabel: ["π_h", "terminal 大小不变"],
        tail: ["近期重组后缀", "18 个完整区块"],
        read: ["state_h", "π_h", "固定工作量"]
      },
      {
        title: "状态 12 · PROOF-NATIVE POW",
        proof: "证明转移 · 冻结模板 · 搜索 nonce",
        state: ["已证明区块", "不可变模板"],
        proofLabel: ["128 位 NONCE", "只排列已有效工作"],
        tail: ["ASERT", "完整区块间隔 · 平均目标 15 秒"],
        read: ["B25 · m22", "模板已锁定", "pow"]
      },
      {
        title: "状态 03 · 独立启动",
        proof: "对等节点数据 → 本地验证 → 独立节点",
        state: ["对等节点数据", "实时状态 · terminal · 18 个区块"],
        proofLabel: ["本地验证", "认证状态与重组窗口"],
        tail: ["完整节点", "从首个状态起独立"],
        read: ["对等数据", "本地验证", "独立"]
      },
      {
        title: "状态 13 · 硬件自适应 L1",
        proof: "硬件改变 TPS · 网络持续运行",
        state: ["任意设备上的节点", "每个节点都保存并验证完整 L1"],
        proofLabel: ["自适应 TPS", "容量跟随计算能力"],
        tail: ["持续运行的网络", "TPS 会变 · 共识继续"],
        read: ["完整 L1", "自适应 TPS", "去中心化"]
      },
      {
        title: "状态 09 · 非留存",
        proof: "当前公开 · 不保留永久交易图",
        state: ["实时状态", "此刻透明"],
        proofLabel: ["共识", "不永久保存来源关系"],
        tail: ["外部追踪器", "必须自行记录全部数据流"],
        read: ["公开状态", "无永久图", "自行追踪"]
      },
      {
        title: "状态 10 · 可携带回执",
        proof: "付款 + Merkle 路径 + 规范区块头",
        state: ["付款数据", "txid · 收款地址 · 金额"],
        proofLabel: ["POSEIDON2b 路径", "固定八层"],
        tail: ["验证通过", "无需历史区块正文"],
        read: ["付款", "八层路径", "规范链"]
      },
      {
        title: "状态 11 · FROST-GKR",
        proof: "同一种二进制算术 · 贯穿始终",
        state: ["GF(2^128)", "所有权 · 交易 · 状态 · 历史 · PoW"],
        proofLabel: ["FROST-GKR", "共享布尔超立方体"],
        tail: ["FRI-BINIUS", "无需可信设置"],
        read: ["同一个域", "10.50×", "51.67×"]
      }
    ]
  };

  const stateSequence = [0, 1, 2, 9, 3, 4, 5, 6, 7, 11, 12, 13, 8, 10];

  const interfaceCopy = {
    en: { next: "NEXT", current: "CURRENT STATE ✓" },
    ru: { next: "ДАЛЬШЕ", current: "ТЕКУЩЕЕ ✓" },
    zh: { next: "下一步", current: "当前状态 ✓" }
  };

  const metaCopy = {
    en: {
      title: "Parano1d. Proof-native Layer 1",
      description: "Parano1d is a proof-native Layer 1 network secured by proof of work. Recursive proofs authenticate the current State without replaying transaction history.",
      locale: "en_US"
    },
    ru: {
      title: "Parano1d. Proof-native Layer 1",
      description: "Parano1d — proof-native-сеть первого уровня, защищённая proof of work. Рекурсивные доказательства аутентифицируют текущий State без повтора истории транзакций.",
      locale: "ru_RU"
    },
    zh: {
      title: "Parano1d. Proof-native Layer 1",
      description: "Parano1d 是一个由工作量证明保护的证明原生第一层网络。递归证明可认证当前 State，无需重放交易历史。",
      locale: "zh_CN"
    }
  };

  const canvasTranslations = {
    ru: {
      proveOnce: "ДОКАЗАТЬ ОДИН РАЗ",
      proofBoundary: "ГРАНИЦА ДОКАЗАТЕЛЬСТВА",
      verifyEverywhere: "КАЖДАЯ НОДА ПРОВЕРЯЕТ",
      noReexecution: "БЕЗ ПОВТОРНОГО ИСПОЛНЕНИЯ",
      liveStateAdvances: "ТЕКУЩЕЕ СОСТОЯНИЕ ОБНОВЛЕНО",
      provenBlock: "ДОКАЗАННЫЙ БЛОК",
      snapshot: "СНИМОК СОСТОЯНИЯ · БЛОК",
      genesis: "ГЕНЕЗИС",
      now: "СЕЙЧАС",
      transitions: "ИЗ ∞ ПЕРЕХОДОВ",
      privateWitness: "СЕКРЕТНЫЕ ДАННЫЕ",
      publicTransition: "ПУБЛИЧНЫЙ ПЕРЕХОД",
      verify: "ПРОВЕРКА",
      authorizationProof: "доказательство владения",
      writesProof: "доказательство точных записей",
      virtualHalf: "ВИРТУАЛЬНАЯ ПУСТАЯ ПОЛОВИНА",
      secret: "СЕКРЕТ",
      statelessAddress: "STATELESS-АДРЕС",
      one: "ОДИН",
      atomic: "АТОМАРНО",
      blockState: "БЛОК + СОСТОЯНИЕ",
      sameSize: "размер не растёт",
      proven: "ДОКАЗАН",
      template: "ШАБЛОН",
      nonceOnly: "ИЩЕМ ТОЛЬКО NONCE",
      asert: "15 с · ASERT",
      liveState: "ТЕКУЩЕЕ СОСТОЯНИЕ",
      blocks18: "18 БЛОКОВ",
      independentNode: "НЕЗАВИСИМАЯ НОДА",
      fullVerification: "ПОЛНАЯ ПРОВЕРКА",
      livePercent: "живых UTXO",
      bitcoinFullNode: "BITCOIN FULL NODE",
      everyBlockKept: "КАЖДЫЙ БЛОК ОСТАЁТСЯ",
      historyGrows: "ДИСК И ЗАПУСК РАСТУТ С КАЖДЫМ БЛОКОМ",
      paranoidNode: "НОДА PARANO(1)D",
      slotsReused: "ПОТРАЧЕННЫЕ СЛОТЫ ОЧИЩАЮТСЯ И ИСПОЛЬЗУЮТСЯ СНОВА",
      storageTracksLive: "ХРАНЕНИЕ ЗАВИСИТ ОТ ЖИВЫХ UTXO, А НЕ ОТ ВОЗРАСТА СЕТИ",
      today: "СЕГОДНЯ",
      tenYears: "+10 ЛЕТ",
      liveProofWindow: "ЖИВОЙ STATE · PROOF · 18 БЛОКОВ",
      peerData: "ДАННЫЕ ОТ ЛЮБОГО ПИРА",
      verifyLocally: "ПРОВЕРИТЬ ЛОКАЛЬНО",
      authenticated: "ПОДТВЕРЖДЕНО",
      independentFullNode: "НЕЗАВИСИМАЯ ПОЛНАЯ НОДА",
      sameProcedure: "ОДНА ПРОЦЕДУРА · ГОД 1 → ГОД 10",
      networkConsensus: "КОНСЕНСУС СЕТИ",
      transparentNow: "ПРОЗРАЧНО СЕЙЧАС",
      externalTracker: "ВНЕШНИЙ ТРЕКЕР",
      recordEverything: "ЗАПИСЫВАЕТ ВСЁ САМ",
      lifetimeStorage: "ХРАНЕНИЕ РАСТЁТ ВСЮ ЖИЗНЬ СЕТИ",
      payment: "ПЛАТЁЖ",
      portableReceipt: "ПЕРЕНОСИМЫЙ ЧЕК",
      canonicalHeader: "КАНОНИЧЕСКИЙ ЗАГОЛОВОК",
      noBlockBody: "СТАРОЕ ТЕЛО БЛОКА НЕ НУЖНО",
      merklePath8: "MERKLE-ПУТЬ ×8",
      verifiedCanonical: "ПРОВЕРЕНО · КАНОНИЧЕСКАЯ ЦЕПЬ",
      ownershipLane: "ВЛАДЕНИЕ",
      transactionLane: "ТРАНЗАКЦИЯ",
      stateLane: "STATE",
      historyLane: "ИСТОРИЯ",
      powLane: "POW",
      oneBinaryField: "ОДНО БИНАРНОЕ ПОЛЕ",
      oneProofStack: "ЕДИНЫЙ PROOF STACK",
      noTrustedSetup: "БЕЗ ДОВЕРЕННОЙ НАСТРОЙКИ",
      validityLocked: "КОРРЕКТНОСТЬ ЗАФИКСИРОВАНА ДО ХЕШРЕЙТА"
    },
    zh: {
      proveOnce: "只证明一次",
      proofBoundary: "证明边界",
      verifyEverywhere: "每个节点只做验证",
      noReexecution: "无需重复执行",
      liveStateAdvances: "实时状态前进",
      provenBlock: "已证明区块",
      snapshot: "状态快照 :: 区块",
      genesis: "创世块",
      now: "当前",
      transitions: "次 / 无限状态转移",
      privateWitness: "私有见证",
      publicTransition: "公开状态转移",
      verify: "验证",
      authorizationProof: "授权证明",
      writesProof: "精确写入证明",
      virtualHalf: "虚拟空白半区",
      secret: "秘密",
      statelessAddress: "无状态地址",
      one: "一笔",
      atomic: "原子交易",
      blockState: "区块 + 状态",
      sameSize: "大小不变",
      proven: "已证明",
      template: "模板",
      nonceOnly: "仅搜索 NONCE",
      asert: "15 秒 · ASERT",
      liveState: "实时状态",
      blocks18: "18 个区块",
      independentNode: "独立节点",
      fullVerification: "完整验证",
      livePercent: "有效 UTXO",
      bitcoinFullNode: "BITCOIN 全节点",
      everyBlockKept: "每个区块都永久保留",
      historyGrows: "磁盘与启动负担随每个区块增长",
      paranoidNode: "PARANO(1)D 节点",
      slotsReused: "已花费槽位会清空并重新使用",
      storageTracksLive: "存储取决于实时 UTXO，而非网络年龄",
      today: "现在",
      tenYears: "+10 年",
      liveProofWindow: "实时状态 · 证明 · 18 个区块",
      peerData: "来自任意对等节点的数据",
      verifyLocally: "本地验证",
      authenticated: "已认证",
      independentFullNode: "独立全节点",
      sameProcedure: "同一流程 · 第 1 年 → 第 10 年",
      networkConsensus: "网络共识",
      transparentNow: "当前透明",
      externalTracker: "外部追踪器",
      recordEverything: "必须自行记录全部数据",
      lifetimeStorage: "存储随网络寿命持续增长",
      payment: "付款",
      portableReceipt: "可携带回执",
      canonicalHeader: "规范区块头",
      noBlockBody: "无需旧区块正文",
      merklePath8: "MERKLE 路径 ×8",
      verifiedCanonical: "验证通过 · 规范链",
      ownershipLane: "所有权",
      transactionLane: "交易",
      stateLane: "状态",
      historyLane: "历史",
      powLane: "POW",
      oneBinaryField: "同一个二进制域",
      oneProofStack: "单一证明栈",
      noTrustedSetup: "无需可信设置",
      validityLocked: "有效性在算力介入前已经锁定"
    }
  };

  const canvasText = (key, english) => language === "en" ? english : (canvasTranslations[language]?.[key] || english);

  const sourceCopy = new Map();
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (!sourceCopy.has(key)) sourceCopy.set(key, element.innerHTML);
  });
  const sourceAria = new Map();
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.dataset.i18nAria;
    if (!sourceAria.has(key)) sourceAria.set(key, element.getAttribute("aria-label") || "");
  });

  let language = "en";
  const queryLanguage = new URLSearchParams(window.location.search).get("lang");
  if (["en", "ru", "zh"].includes(queryLanguage)) {
    language = queryLanguage;
  } else {
    try {
      const storedLanguage = localStorage.getItem("parano1d-language");
      if (["en", "ru", "zh"].includes(storedLanguage)) language = storedLanguage;
    } catch {}
  }

  for (let i = 0; i < chapters.length - 1; i += 1) {
    const block = document.createElement("i");
    suffix.append(block);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hashIndex = chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash);
  let current = hashIndex >= 0 ? hashIndex : 0;
  if (window.location.hash) {
    window.history.replaceState(
      { step: current },
      "",
      `${window.location.pathname}${window.location.search}`
    );
  }
  let wheelAccumulator = 0;
  let wheelDirection = 0;
  let wheelLastEventAt = 0;
  let wheelLastStepAt = 0;
  const wheelGestureGapMs = 240;
  const wheelStepCooldownMs = 320;
  const wheelTriggerDistance = 34;
  let touchStart = null;
  let scene = null;
  let wheelAudioContext = null;
  let wheelAudioOutput = null;
  let wheelAudioResume = null;

  function ensureWheelAudio() {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return null;
    if (!wheelAudioContext) {
      wheelAudioContext = new AudioEngine({ latencyHint: "interactive" });
      wheelAudioOutput = wheelAudioContext.createGain();
      wheelAudioOutput.gain.value = 1;
      wheelAudioOutput.connect(wheelAudioContext.destination);
    }
    return wheelAudioContext;
  }

  function unlockWheelAudio() {
    try {
      const context = ensureWheelAudio();
      if (context?.state === "suspended") {
        const resume = context.resume();
        wheelAudioResume = resume;
        resume.catch(() => {}).finally(() => {
          if (wheelAudioResume === resume) wheelAudioResume = null;
        });
      }
    } catch {}
  }

  window.addEventListener("pointerdown", unlockWheelAudio, { passive: true });
  window.addEventListener("keydown", unlockWheelAudio);

  function scheduleWheelTick(context, at, direction, emphasis = 1) {
    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(direction > 0 ? 920 : 790, at);
    body.frequency.exponentialRampToValueAtTime(direction > 0 ? 470 : 410, at + .03);
    bodyGain.gain.setValueAtTime(.0001, at);
    bodyGain.gain.exponentialRampToValueAtTime(.12 * emphasis, at + .0015);
    bodyGain.gain.exponentialRampToValueAtTime(.0001, at + .035);
    body.connect(bodyGain).connect(wheelAudioOutput);
    body.start(at);
    body.stop(at + .04);

    const edge = context.createBufferSource();
    const edgeLength = Math.max(1, Math.round(context.sampleRate * .012));
    const edgeBuffer = context.createBuffer(1, edgeLength, context.sampleRate);
    const edgeData = edgeBuffer.getChannelData(0);
    for (let sample = 0; sample < edgeLength; sample += 1) {
      const envelope = 1 - sample / edgeLength;
      edgeData[sample] = (Math.random() * 2 - 1) * envelope * envelope;
    }
    edge.buffer = edgeBuffer;
    const edgeFilter = context.createBiquadFilter();
    edgeFilter.type = "bandpass";
    edgeFilter.frequency.value = direction > 0 ? 2450 : 2050;
    edgeFilter.Q.value = .72;
    const edgeGain = context.createGain();
    edgeGain.gain.setValueAtTime(.0001, at);
    edgeGain.gain.exponentialRampToValueAtTime(.22 * emphasis, at + .0008);
    edgeGain.gain.exponentialRampToValueAtTime(.0001, at + .013);
    edge.connect(edgeFilter).connect(edgeGain).connect(wheelAudioOutput);
    edge.start(at);
    edge.stop(at + .015);
  }

  function playWheelTicks(from, to) {
    if (from === to || document.hidden) return;
    try {
      const activation = navigator.userActivation;
      if (!wheelAudioContext && activation && !activation.isActive) return;
      const context = ensureWheelAudio();
      if (!context) return;
      const direction = to > from ? 1 : -1;
      const steps = Math.min(6, Math.abs(to - from));
      const play = () => {
        const start = context.currentTime + .006;
        for (let step = 0; step < steps; step += 1) {
          scheduleWheelTick(context, start + step * .045, direction, step === steps - 1 ? 1.16 : .82);
        }
      };
      if (context.state === "suspended") {
        if (wheelAudioResume) wheelAudioResume.then(play).catch(() => {});
        else if (!activation || activation.isActive) context.resume().then(play).catch(() => {});
      } else play();
    } catch {}
  }

  function applyLanguage(nextLanguage, persist = true) {
    language = ["en", "ru", "zh"].includes(nextLanguage) ? nextLanguage : "en";
    const selected = translations[language] || {};
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.title = metaCopy[language].title;
    document.querySelector('meta[name="description"]').setAttribute("content", metaCopy[language].description);
    document.querySelectorAll("[data-meta-title]").forEach((element) => element.setAttribute("content", metaCopy[language].title));
    document.querySelectorAll("[data-meta-description]").forEach((element) => element.setAttribute("content", metaCopy[language].description));
    document.querySelector("[data-meta-locale]")?.setAttribute("content", metaCopy[language].locale);

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      element.innerHTML = language === "en" ? sourceCopy.get(key) : (selected[key] ?? sourceCopy.get(key));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const key = element.dataset.i18nAria;
      element.setAttribute("aria-label", language === "en" ? sourceAria.get(key) : (selected[key] ?? sourceAria.get(key)));
    });
    const languageLabels = { en: "EN", ru: "RU", zh: "中文" };
    const languageAria = { en: "Language · EN", ru: "Язык · RU", zh: "语言 · 中文" };
    document.querySelectorAll(".language-current").forEach((label) => { label.textContent = languageLabels[language]; });
    document.querySelectorAll(".language-dropdown > summary").forEach((summary) => { summary.setAttribute("aria-label", languageAria[language]); });
    document.querySelectorAll(".language-option").forEach((option) => {
      const active = option.dataset.lang === language;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", active ? "true" : "false");
    });

    nextButton.textContent = current === chapters.length - 1 ? interfaceCopy[language].current : interfaceCopy[language].next;
    updateLabels(current);
    syncMobileSceneLayouts();
    if (scene) {
      scene.invalidateLayout();
      scene.draw(performance.now());
    }
    if (persist) {
      try { localStorage.setItem("parano1d-language", language); } catch {}
    }
  }

  document.querySelectorAll(".language-option").forEach((option) => {
    option.addEventListener("click", () => {
      applyLanguage(option.dataset.lang);
      option.closest(".language-dropdown")?.removeAttribute("open");
    });
  });

  function setMobileMenu(open, { restoreFocus = false } = {}) {
    if (!mobileMenu || !mobileMenuToggle) return;
    const next = Boolean(open);
    mobileMenu.hidden = !next;
    mobileMenuToggle.setAttribute("aria-expanded", next ? "true" : "false");
    if (!next && restoreFocus) mobileMenuToggle.focus({ preventScroll: true });
  }

  function closeNavDropdowns(except = null) {
    navDropdowns.forEach((dropdown) => {
      if (dropdown !== except) dropdown.removeAttribute("open");
    });
  }

  let downloadsLastFocus = null;
  let downloadsCloseTimer = 0;
  let latestReleasePromise = null;

  function loadDownloadsPreview() {
    if (!downloadsPreview || downloadsPreview.getAttribute("src")) return;
    const source = downloadsPreview.dataset.src;
    if (source) downloadsPreview.setAttribute("src", source);
  }

  function hydrateLatestRelease() {
    if (latestReleasePromise) return latestReleasePromise;
    if (!["parano1d.org", "www.parano1d.org"].includes(window.location.hostname)) {
      latestReleasePromise = Promise.resolve();
      return latestReleasePromise;
    }
    latestReleasePromise = (async () => {
      try {
        const response = await fetch("https://api.github.com/repos/ignotusnemo/parano1d/releases/latest", {
          credentials: "omit",
          headers: { Accept: "application/vnd.github+json" }
        });
        if (!response.ok) return;
        const release = await response.json();
        const tag = typeof release.tag_name === "string" ? release.tag_name : "";
        if (!tag || release.draft || release.prerelease || !Array.isArray(release.assets)) return;

        const assets = new Map(release.assets.map((asset) => [asset.name, asset.browser_download_url]));
        document.querySelectorAll("[data-release-pattern]").forEach((link) => {
          const expectedName = link.dataset.releasePattern.replace("{tag}", tag);
          const downloadUrl = assets.get(expectedName);
          if (downloadUrl) link.href = downloadUrl;
        });
        document.querySelectorAll("[data-release-page]").forEach((link) => {
          if (release.html_url) link.href = release.html_url;
        });
        document.querySelectorAll("[data-release-tag]").forEach((label) => { label.textContent = tag; });
      } catch {}
    })();
    return latestReleasePromise;
  }

  function openDownloads() {
    if (!downloadsModal || !downloadsModal.hidden) return;
    clearTimeout(downloadsCloseTimer);
    downloadsLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMobileMenu(false);
    closeNavDropdowns();
    downloadsModal.hidden = false;
    downloadsModal.scrollTop = 0;
    document.body.classList.add("downloads-open");
    app.setAttribute("inert", "");
    loadDownloadsPreview();
    hydrateLatestRelease();
    requestAnimationFrame(() => {
      downloadsModal.scrollTop = 0;
      downloadsModal.classList.add("is-open");
      downloadsModal.focus({ preventScroll: true });
    });
  }

  function closeDownloads() {
    if (!downloadsModal || downloadsModal.hidden) return;
    downloadsModal.classList.remove("is-open");
    document.body.classList.remove("downloads-open");
    app.removeAttribute("inert");
    downloadsCloseTimer = window.setTimeout(() => { downloadsModal.hidden = true; }, 260);
    downloadsLastFocus?.focus?.({ preventScroll: true });
  }

  downloadsOpeners.forEach((button) => button.addEventListener("click", openDownloads));
  downloadsClose?.addEventListener("click", closeDownloads);
  downloadsModal?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...downloadsModal.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === downloadsModal) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  mobileMenuToggle?.addEventListener("click", () => {
    const open = mobileMenuToggle.getAttribute("aria-expanded") !== "true";
    closeNavDropdowns();
    setMobileMenu(open);
  });

  mobileMenu?.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) setMobileMenu(false);
  });

  navDropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        setMobileMenu(false);
        closeNavDropdowns(dropdown);
      }
    });
    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => dropdown.removeAttribute("open"));
    });
  });

  document.addEventListener("click", (event) => {
    if (mobileMenu && mobileMenuToggle && !mobileMenu.hidden && !mobileMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
      setMobileMenu(false);
    }
    navDropdowns.forEach((dropdown) => {
      if (dropdown.open && !dropdown.contains(event.target)) dropdown.removeAttribute("open");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) setMobileMenu(false);
    else closeNavDropdowns();
  }, { passive: true });

  function updateLabels(index) {
    const sourceIndex = stateSequence[index];
    const data = language === "en" ? states[sourceIndex] : stateTranslations[language][sourceIndex];
    deckTitle.textContent = data.title;
    deckProof.textContent = data.proof;
    [sceneLabels.stateTitle.textContent, sceneLabels.stateCopy.textContent] = data.state;
    [sceneLabels.proofTitle.textContent, sceneLabels.proofCopy.textContent] = data.proofLabel;
    [sceneLabels.tailTitle.textContent, sceneLabels.tailCopy.textContent] = data.tail;
    [sceneLabels.readState.textContent, sceneLabels.readHistory.textContent, sceneLabels.readVerify.textContent] = data.read;

    const blocks = [...suffix.children];
    const progressIndex = index - 1;
    blocks.forEach((block, i) => {
      block.classList.toggle("on", progressIndex >= 0 && i <= progressIndex);
      block.classList.toggle("tip", progressIndex >= 0 && i === progressIndex);
    });
  }

  function updateStateWheel(index, { instant = false } = {}) {
    if (!stateRail || window.innerWidth <= 820) return;
    const height = stateRail.getBoundingClientRect().height;
    if (height < 1) return;

    if (instant) stateRail.classList.add("instant");
    const radius = Math.max(170, height * .48);
    const angleStep = 13 * Math.PI / 180;
    const visibleDistance = 5.15;

    dots.forEach((dot, dotIndex) => {
      const delta = dotIndex - index;
      const distance = Math.abs(delta);
      const angle = delta * angleStep;
      const y = Math.sin(angle) * radius;
      const z = (Math.cos(angle) - 1) * radius * 1.16;
      const opacity = distance === 0 ? 1 : Math.max(.12, .92 - distance * .135);
      const scale = distance === 0 ? 1.055 : Math.max(.92, 1 - distance * .012);
      const blur = Math.max(0, distance - 2.4) * .22;
      const visible = distance <= visibleDistance;

      dot.style.setProperty("--wheel-y", `${y.toFixed(2)}px`);
      dot.style.setProperty("--wheel-z", `${z.toFixed(2)}px`);
      dot.style.setProperty("--wheel-angle", `${(-angle * 180 / Math.PI).toFixed(2)}deg`);
      dot.style.setProperty("--wheel-scale", scale.toFixed(3));
      dot.style.setProperty("--wheel-opacity", visible ? opacity.toFixed(3) : "0");
      dot.style.setProperty("--wheel-blur", `${blur.toFixed(2)}px`);
      dot.style.setProperty("--wheel-order", String(100 - Math.round(distance * 10)));
      dot.classList.toggle("wheel-hidden", !visible);
      dot.tabIndex = visible ? 0 : -1;
    });

    if (instant) {
      requestAnimationFrame(() => requestAnimationFrame(() => stateRail.classList.remove("instant")));
    }
  }

  let wheelResizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(wheelResizeFrame);
    wheelResizeFrame = requestAnimationFrame(() => updateStateWheel(current, { instant: true }));
  }, { passive: true });

  chapters.forEach((chapter) => {
    chapter.addEventListener("transitionend", (event) => {
      if (event.propertyName === "transform" && chapter.classList.contains("active")) {
        syncMobileSceneLayouts();
      }
    });
  });

  function goTo(next, { instant = false } = {}) {
    next = Math.max(0, Math.min(chapters.length - 1, Number(next)));
    if (!Number.isFinite(next) || (next === current && !instant)) return;

    const old = current;
    const direction = next > old ? 1 : -1;
    if (!instant) playWheelTicks(old, next);
    current = next;
    app.dataset.currentStep = String(next);

    if (instant) chapters.forEach((chapter) => { chapter.style.transition = "none"; });

    chapters.forEach((chapter, i) => {
      chapter.classList.toggle("active", i === next);
      chapter.classList.toggle("leaving-up", i === old && direction > 0 && i !== next);
      chapter.setAttribute("aria-hidden", i === next ? "false" : "true");
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === next);
      dot.classList.toggle("visited", i < next);
      if (i === next) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
    updateStateWheel(next, { instant });
    syncMobileSceneLayouts({ immediate: true });

    prevButton.disabled = next === 0;
    nextButton.disabled = next === chapters.length - 1;
    nextButton.textContent = next === chapters.length - 1 ? interfaceCopy[language].current : interfaceCopy[language].next;
    updateLabels(next);

    if (!instant && !reducedMotion.matches) {
      flash.classList.remove("run");
      void flash.offsetWidth;
      flash.classList.add("run");
    }

    scene.setStep(next, instant ? next : old);
    if (window.innerWidth <= 820) {
      scene.resize();
      scene.draw(performance.now());
    }
    if (instant) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        chapters.forEach((chapter) => { chapter.style.removeProperty("transition"); });
      }));
    }
  }

  function advance(delta) {
    goTo(current + delta);
  }

  document.querySelectorAll("[data-go]").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      goTo(Number(control.dataset.go));
    });
  });

  document.querySelectorAll("[data-next]").forEach((control) => control.addEventListener("click", () => advance(1)));
  prevButton.addEventListener("click", () => advance(-1));
  nextButton.addEventListener("click", () => advance(1));

  window.addEventListener("keydown", (event) => {
    if (downloadsModal && !downloadsModal.hidden) {
      if (event.key === "Escape") closeDownloads();
      return;
    }
    if (event.key === "Escape") {
      const openDropdown = navDropdowns.find((dropdown) => dropdown.open);
      if (openDropdown) {
        openDropdown.removeAttribute("open");
        openDropdown.querySelector("summary")?.focus({ preventScroll: true });
        return;
      }
      if (mobileMenu && !mobileMenu.hidden) {
        setMobileMenu(false, { restoreFocus: true });
        return;
      }
      return;
    }
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !event.shiftKey)) {
      event.preventDefault();
      advance(1);
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey)) {
      event.preventDefault();
      advance(-1);
    } else if (event.key === "Home") {
      goTo(0);
    } else if (event.key === "End") {
      goTo(chapters.length - 1);
    }
  });

  window.addEventListener("wheel", (event) => {
    if (downloadsModal && !downloadsModal.hidden) return;
    if (window.innerWidth <= 820 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const now = performance.now();
    const scale = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * scale;
    const direction = Math.sign(delta);
    if (!direction) return;

    const reversed = wheelDirection !== 0 && direction !== wheelDirection;
    const newGesture = now - wheelLastEventAt > wheelGestureGapMs;
    if (reversed || newGesture) wheelAccumulator = 0;
    wheelDirection = direction;
    wheelLastEventAt = now;

    // A wheel or trackpad keeps emitting inertial events after the user's
    // physical gesture. Do not bank that tail and spend it on another slide
    // the instant the transition lock expires.
    if (!reversed && wheelLastStepAt > 0 && now - wheelLastStepAt < wheelStepCooldownMs) {
      wheelAccumulator = 0;
      return;
    }
    wheelAccumulator += delta;

    if (Math.abs(wheelAccumulator) < wheelTriggerDistance) return;

    wheelAccumulator = 0;
    wheelLastStepAt = now;
    advance(direction);
  }, { passive: true });

  window.addEventListener("touchstart", (event) => {
    if (downloadsModal && !downloadsModal.hidden) return;
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    if (downloadsModal && !downloadsModal.hidden) return;
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const elapsed = performance.now() - touchStart.time;
    touchStart = null;
    if (elapsed > 800 || Math.abs(dy) < 52 || Math.abs(dy) < Math.abs(dx) * .8) return;
    advance(dy < 0 ? 1 : -1);
  }, { passive: true });

  class StateScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true });
      this.w = 1;
      this.h = 1;
      this.dpr = 1;
      this.step = current;
      this.fromStep = current;
      this.transitionAt = performance.now() - 1000;
      this.lastFrame = 0;
      this.lastMutation = 0;
      this.mutation = { from: 0, to: 1, at: performance.now() };
      this.seed = 0x1f2e3d4c;
      this.cells = Array.from({ length: 24 * 16 }, (_, i) => this.random(i * 13 + 7) > .55);
      this.boardCols = 56;
      this.boardRows = 36;
      this.boardSize = this.boardCols * this.boardRows;
      this.boardTarget = new Uint8Array(this.boardSize);
      this.boardLevel = new Float32Array(this.boardSize);
      this.boardValue = new Float32Array(this.boardSize);
      this.boardMintAt = new Float64Array(this.boardSize).fill(-99999);
      this.boardSpentAt = new Float64Array(this.boardSize).fill(-99999);
      this.boardCoinbaseAt = new Float64Array(this.boardSize).fill(-99999);
      this.boardOccupied = 0;
      for (let i = 0; i < this.boardSize; i += 1) {
        const live = this.random(17000 + i * 17) < .46 ? 1 : 0;
        this.boardTarget[i] = live;
        this.boardLevel[i] = live;
        this.boardValue[i] = .4 + this.random(19000 + i * 23) * .6;
        this.boardOccupied += live;
      }
      const startedAt = performance.now();
      this.boardTransfers = [];
      this.boardTx = 0;
      this.nextBoardTxAt = startedAt + 180;
      this.lastBoardTickAt = startedAt;
      this.blockHeight = 12884;
      this.blockCycle = 5600;
      this.nextBlockAt = startedAt + 1750;
      this.photo = null;
      this.overflowBlock = null;
      this.tailShiftAt = -99999;
      this.proofBurstAt = -99999;
      this.tailPhotos = Array.from({ length: 18 }, (_, i) => ({
        height: this.blockHeight - i,
        seed: this.blockHeight - i
      }));
      this.stars = Array.from({ length: 95 }, (_, i) => ({
        x: this.random(600 + i * 5),
        y: this.random(900 + i * 11),
        r: .25 + this.random(1200 + i) * 1.1,
        a: .08 + this.random(1300 + i) * .3
      }));
      this.verificationGlow = document.createElement("canvas");
      this.contentRightCache = new Map();
      this.verificationGlow.width = 128;
      this.verificationGlow.height = 128;
      const glowContext = this.verificationGlow.getContext("2d");
      const glowTexture = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
      glowTexture.addColorStop(0, "rgba(223,255,245,.58)");
      glowTexture.addColorStop(.16, "rgba(115,255,197,.30)");
      glowTexture.addColorStop(.48, "rgba(115,255,197,.09)");
      glowTexture.addColorStop(1, "rgba(2,8,7,0)");
      glowContext.fillStyle = glowTexture;
      glowContext.fillRect(0, 0, 128, 128);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
      this.resize();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }

    random(n) {
      let x = (this.seed + n * 0x6d2b79f5) >>> 0;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const pixelWidth = Math.round(nextW * nextDpr);
      const pixelHeight = Math.round(nextH * nextDpr);
      if (
        Math.abs(this.w - nextW) < .1 &&
        Math.abs(this.h - nextH) < .1 &&
        this.dpr === nextDpr &&
        this.canvas.width === pixelWidth &&
        this.canvas.height === pixelHeight
      ) return false;
      this.dpr = nextDpr;
      this.w = nextW;
      this.h = nextH;
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.invalidateLayout();
      return true;
    }

    invalidateLayout() {
      this.contentRightCache.clear();
    }

    setStep(step, fromStep = this.step) {
      this.fromStep = fromStep;
      this.step = step;
      this.transitionAt = performance.now();
    }

    frame(now) {
      if (now - this.lastFrame > (reducedMotion.matches ? 500 : 32)) {
        this.lastFrame = now;
        this.draw(now);
      }
      requestAnimationFrame(this.frame);
    }

    draw(now) {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      this.drawAtmosphere(now);

      const raw = Math.min(1, (now - this.transitionAt) / 720);
      const mix = raw < .5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      if (this.fromStep !== this.step && mix < 1) {
        this.drawScene(this.fromStep, 1 - mix, now);
        this.drawScene(this.step, mix, now);
      } else {
        this.drawScene(this.step, 1, now);
      }
    }

    drawAtmosphere(now) {
      const ctx = this.ctx;
      const pulse = .5 + .5 * Math.sin(now * .00038);
      const radial = ctx.createRadialGradient(this.w * .73, this.h * .48, 0, this.w * .73, this.h * .48, this.w * .48);
      radial.addColorStop(0, `rgba(58, 225, 158, ${.038 + pulse * .018})`);
      radial.addColorStop(.45, "rgba(44, 94, 80, .018)");
      radial.addColorStop(1, "rgba(2, 8, 7, 0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, this.w, this.h);

      for (const star of this.stars) {
        const x = star.x * this.w;
        const y = star.y * this.h;
        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191,247,255,${star.a})`;
        ctx.fill();
      }
    }

    drawScene(index, alpha, now) {
      if (alpha <= .002) return;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      const scenes = [
        this.drawNetworkIntro,
        this.drawReplay,
        this.drawPresent,
        this.drawJoin,
        this.drawProofFlow,
        this.drawLivingState,
        this.drawOwnership,
        this.drawPagedSpend,
        this.drawHistoryStep,
        this.drawPrivacy,
        this.drawReceipt,
        this.drawProofStack,
        this.drawPow,
        this.drawNode
      ];
      scenes[index].call(this, now);
      this.ctx.restore();
    }

    layout() {
      const viewportWidth = window.innerWidth;
      const mobile = viewportWidth <= 820;
      const compact = !mobile && viewportWidth <= 1180;
      return {
        mobile,
        compact,
        left: mobile ? this.w * .08 : this.w * (compact ? .57 : .44),
        right: mobile ? this.w * .91 : this.w * (compact ? .94 : .92),
        top: mobile ? this.h * .10 : this.h * .22,
        bottom: mobile ? this.h * .84 : this.h * .73,
        cx: mobile ? this.w * .52 : this.w * (compact ? .76 : .69),
        cy: this.h * .48
      };
    }

    desktopStageBounds() {
      const fallback = { top: this.h * .10, bottom: this.h * .90, center: this.h * .50 };
      const canvasRect = this.canvas.getBoundingClientRect();
      const topbar = document.querySelector(".topbar")?.getBoundingClientRect();
      const deck = document.querySelector(".control-deck")?.getBoundingClientRect();
      if (!topbar || !deck) return fallback;
      const top = Math.max(0, topbar.bottom - canvasRect.top);
      const bottom = Math.min(this.h, deck.top - canvasRect.top);
      if (bottom <= top) return fallback;
      return { top, bottom, center: (top + bottom) / 2 };
    }

    contentRight(selector) {
      if (window.innerWidth <= 820) return 0;
      if (this.contentRightCache.has(selector)) return this.contentRightCache.get(selector);
      const canvasRect = this.canvas.getBoundingClientRect();
      const elements = [...document.querySelectorAll(selector)];
      const right = elements.reduce((edge, element) => {
        const rect = element.getBoundingClientRect();
        return Math.max(edge, rect.right - canvasRect.left);
      }, 0);
      this.contentRightCache.set(selector, right);
      return right;
    }

    line(points, color, width = 1, glow = 0) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
      }
      ctx.stroke();
      ctx.restore();
    }

    path(path, color, width = 1, glow = 0) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      path(ctx);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
      }
      ctx.stroke();
      ctx.restore();
    }

    dot(x, y, radius, color, glow = 0) {
      const ctx = this.ctx;
      ctx.save();
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.6);
      gradient.addColorStop(0, color);
      gradient.addColorStop(.34, color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
      }
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    text(text, x, y, color = "rgba(239,255,248,.72)", size = 9, align = "center") {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `650 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    roundedRect(x, y, width, height, radius, stroke, fill = null, lineWidth = 1) {
      const ctx = this.ctx;
      const r = Math.min(radius, width / 2, height / 2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    node(x, y, radius, label, color = "#73ffc5", now = 0, active = true) {
      const ctx = this.ctx;
      const pulse = .5 + .5 * Math.sin(now * .002 + x * .01);
      ctx.save();
      ctx.translate(x, y);
      if (active) {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2);
        glow.addColorStop(0, color.replace(")", ""));
        glow.addColorStop(.18, color);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha *= .12 + pulse * .05;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha /= (.12 + pulse * .05);
      }
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1 - i * .21), 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? color : color.replace("1)", `${.34 - i * .08})`);
        ctx.globalAlpha *= i === 0 ? .8 : .42;
        ctx.lineWidth = i === 0 ? 1.1 : .7;
        ctx.stroke();
        ctx.globalAlpha /= i === 0 ? .8 : .42;
      }
      ctx.restore();
      this.text(label, x, y, color, Math.max(8, radius * .34));
    }

    packetAlong(x1, y1, x2, y2, phase, color, radius = 2.2) {
      const t = ((phase % 1) + 1) % 1;
      const eased = t * t * (3 - 2 * t);
      this.dot(x1 + (x2 - x1) * eased, y1 + (y2 - y1) * eased, radius, color, 12);
    }

    drawGrid(now, options = {}) {
      const ctx = this.ctx;
      const l = this.layout();
      const cols = options.cols || (l.mobile ? 16 : 22);
      const rows = options.rows || (l.mobile ? 10 : 14);
      const left = options.left ?? l.left;
      const right = options.right ?? (l.mobile ? l.right * .87 : this.w * .83);
      const top = options.top ?? l.top;
      const bottom = options.bottom ?? l.bottom;
      const depth = options.depth ?? (l.mobile ? this.w * .055 : this.w * .045);
      const corners = [
        [left + depth, top],
        [right, top + depth * .18],
        [right - depth * .55, bottom],
        [left, bottom - depth * .18]
      ];

      const bilerp = (u, v) => {
        const topX = corners[0][0] + (corners[1][0] - corners[0][0]) * u;
        const topY = corners[0][1] + (corners[1][1] - corners[0][1]) * u;
        const bottomX = corners[3][0] + (corners[2][0] - corners[3][0]) * u;
        const bottomY = corners[3][1] + (corners[2][1] - corners[3][1]) * u;
        return [topX + (bottomX - topX) * v, topY + (bottomY - topY) * v];
      };

      ctx.save();
      const plane = ctx.createLinearGradient(left, top, right, bottom);
      plane.addColorStop(0, "rgba(115,255,197,.015)");
      plane.addColorStop(.55, "rgba(115,255,197,.055)");
      plane.addColorStop(1, "rgba(194,170,255,.025)");
      ctx.beginPath();
      corners.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = plane;
      ctx.fill();
      ctx.strokeStyle = "rgba(115,255,197,.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let col = 0; col <= cols; col += 1) {
        const a = bilerp(col / cols, 0);
        const b = bilerp(col / cols, 1);
        this.line([a, b], "rgba(115,255,197,.09)", .65);
      }
      for (let row = 0; row <= rows; row += 1) {
        const a = bilerp(0, row / rows);
        const b = bilerp(1, row / rows);
        this.line([a, b], "rgba(115,255,197,.09)", .65);
      }

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const index = (row * 24 + col) % this.cells.length;
          if (!this.cells[index] && !options.showEmpty) continue;
          const pad = .22;
          const p1 = bilerp((col + pad) / cols, (row + pad) / rows);
          const p2 = bilerp((col + 1 - pad) / cols, (row + pad) / rows);
          const p3 = bilerp((col + 1 - pad) / cols, (row + 1 - pad) / rows);
          const p4 = bilerp((col + pad) / cols, (row + 1 - pad) / rows);
          ctx.beginPath();
          [p1, p2, p3, p4].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          ctx.closePath();
          const changing = index === this.mutation.from || index === this.mutation.to;
          ctx.fillStyle = this.cells[index]
            ? (changing ? "rgba(191,247,255,.72)" : "rgba(115,255,197,.24)")
            : "rgba(115,255,197,.025)";
          ctx.fill();
          if (this.cells[index] && this.random(index + 300) > .83) {
            const center = bilerp((col + .5) / cols, (row + .5) / rows);
            this.dot(center[0], center[1], changing ? 1.9 : .75, changing ? "#bff7ff" : "#73ffc5", changing ? 10 : 3);
          }
        }
      }
      ctx.restore();
      return { bilerp, corners, root: bilerp(1, .5) };
    }

    mutateState(now) {
      if (now - this.lastMutation < 1750) return;
      this.lastMutation = now;
      let from = Math.floor(this.random(Math.floor(now / 1700) + 77) * this.cells.length);
      let to = Math.floor(this.random(Math.floor(now / 1700) + 177) * this.cells.length);
      for (let i = 0; i < this.cells.length && !this.cells[from]; i += 1) from = (from + 1) % this.cells.length;
      for (let i = 0; i < this.cells.length && this.cells[to]; i += 1) to = (to + 1) % this.cells.length;
      this.cells[from] = false;
      this.cells[to] = true;
      this.mutation = { from, to, at: now };
    }

    drawTail(x1, x2, y, now, color = "rgba(191,247,255,.52)") {
      const count = 18;
      const gap = (x2 - x1) / (count - 1);
      this.line([[x1, y], [x2, y]], "rgba(191,247,255,.11)", 1);
      for (let i = 0; i < count; i += 1) {
        const x = x1 + i * gap;
        const size = i === count - 1 ? 5 : 3.2;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillStyle = i === count - 1 ? "rgba(194,170,255,.7)" : "rgba(191,247,255,.18)";
        this.ctx.strokeStyle = i === count - 1 ? "#c2aaff" : color;
        this.ctx.lineWidth = .8;
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        this.ctx.strokeRect(-size, -size, size * 2, size * 2);
        this.ctx.restore();
      }
      this.packetAlong(x1, y, x2, y, now * .00016, "#bff7ff", 1.5);
    }

    ease(value) {
      const t = Math.max(0, Math.min(1, value));
      return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    liveBoardRect(layout, rightOverride = null, leftOverride = null) {
      const left = leftOverride ?? (layout.mobile ? this.w * .055 : this.w * (layout.compact ? .56 : .44));
      const right = rightOverride ?? (layout.mobile ? this.w * .78 : this.w * .83);
      const naturalWidth = right - left;
      const heightLimit = layout.mobile ? this.h * .82 : Infinity;
      const width = Math.min(naturalWidth, heightLimit * this.boardCols / this.boardRows);
      const height = width * this.boardRows / this.boardCols;
      const centerX = (left + right) / 2;
      const centerY = layout.mobile ? this.h * .46 : this.desktopStageBounds().center;
      return { x: centerX - width / 2, y: centerY - height / 2, w: width, h: height };
    }

    boardPoint(rect, index) {
      const col = index % this.boardCols;
      const row = Math.floor(index / this.boardCols);
      return [
        rect.x + (col + .5) * rect.w / this.boardCols,
        rect.y + (this.boardRows - row - .5) * rect.h / this.boardRows
      ];
    }

    pickBoardSlot(live, used, salt) {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const index = Math.floor(this.random(salt + attempt * 47) * this.boardSize);
        if (used.has(index)) continue;
        if (Boolean(this.boardTarget[index]) === live) return index;
      }
      return -1;
    }

    captureState(height) {
      return {
        height,
        seed: height,
        bits: new Uint8Array(this.boardTarget)
      };
    }

    fakeRoot(seed, length = 22) {
      let result = "";
      for (let i = 0; i < length; i += 1) {
        result += Math.floor(this.random(seed * 131 + i * 29) * 16).toString(16);
      }
      return result;
    }

    updateLiveBoard(now, withBlocks) {
      const dt = Math.min(80, Math.max(0, now - this.lastBoardTickAt));
      this.lastBoardTickAt = now;
      const levelMix = Math.min(1, dt * .0085);
      for (let i = 0; i < this.boardSize; i += 1) {
        this.boardLevel[i] += (this.boardTarget[i] - this.boardLevel[i]) * levelMix;
      }

      let generated = 0;
      while (now >= this.nextBoardTxAt && generated < 4) {
        generated += 1;
        this.boardTx += 1;
        const used = new Set();
        const inputs = [];
        const outputs = [];
        const twoInputs = this.random(23000 + this.boardTx * 7) > .68;
        const twoOutputs = this.random(24000 + this.boardTx * 11) > .68;
        const occupancy = this.boardOccupied / this.boardSize;
        const inputCount = (twoInputs ? 2 : 1) + (occupancy > .475 ? 1 : 0);
        const outputCount = (twoOutputs ? 2 : 1) + (occupancy < .445 ? 1 : 0);

        for (let i = 0; i < inputCount; i += 1) {
          const index = this.pickBoardSlot(true, used, 25000 + this.boardTx * 101 + i * 17);
          if (index < 0) continue;
          used.add(index);
          inputs.push(index);
          this.boardTarget[index] = 0;
          this.boardOccupied -= 1;
          this.boardSpentAt[index] = now;
        }
        for (let i = 0; i < outputCount; i += 1) {
          const index = this.pickBoardSlot(false, used, 27000 + this.boardTx * 103 + i * 19);
          if (index < 0) continue;
          used.add(index);
          outputs.push(index);
          this.boardTarget[index] = 1;
          this.boardOccupied += 1;
          this.boardMintAt[index] = now;
          this.boardValue[index] = .4 + this.random(29000 + this.boardTx * 31 + i) * .6;
        }
        const pairs = Math.max(inputs.length, outputs.length);
        for (let i = 0; i < pairs; i += 1) {
          if (!inputs.length || !outputs.length) break;
          this.boardTransfers.push({
            from: inputs[i % inputs.length],
            to: outputs[i % outputs.length],
            startedAt: now,
            duration: 520 + this.random(31000 + this.boardTx * 37 + i) * 330
          });
        }
        this.nextBoardTxAt = now + 120 + this.random(32000 + this.boardTx * 41) * 210;
      }
      this.boardTransfers = this.boardTransfers.filter((transfer) => now - transfer.startedAt < transfer.duration + 320);

      if (!withBlocks) return;
      if (now >= this.nextBlockAt && !this.photo) {
        this.blockHeight += 1;
        const coinbase = this.pickBoardSlot(false, new Set(), 35000 + this.blockHeight * 13);
        if (coinbase >= 0) {
          this.boardTarget[coinbase] = 1;
          this.boardOccupied += 1;
          this.boardMintAt[coinbase] = now;
          this.boardCoinbaseAt[coinbase] = now;
          this.boardValue[coinbase] = 1;
        }
        this.photo = {
          snapshot: this.captureState(this.blockHeight),
          startedAt: now,
          landed: false
        };
        this.nextBlockAt = now + this.blockCycle;
      }

      if (this.photo && !this.photo.landed && now - this.photo.startedAt >= 1500) {
        this.photo.landed = true;
        this.tailPhotos.unshift(this.photo.snapshot);
        const displaced = this.tailPhotos.pop();
        this.tailShiftAt = now;
        this.overflowBlock = displaced ? { snapshot: displaced, startedAt: now, arrived: false } : null;
      }

      if (this.photo && this.photo.landed && now - this.photo.startedAt > 1750) this.photo = null;
      if (this.overflowBlock) {
        const age = now - this.overflowBlock.startedAt;
        if (!this.overflowBlock.arrived && age >= 1120) {
          this.overflowBlock.arrived = true;
          this.proofBurstAt = now;
        }
        if (age > 1480) this.overflowBlock = null;
      }
    }

    drawLiveBoard(rect, now, dim = 1) {
      const ctx = this.ctx;
      const cellW = rect.w / this.boardCols;
      const cellH = rect.h / this.boardRows;
      const gap = Math.max(.35, Math.min(1.7, cellW * .17));
      const panel = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      panel.addColorStop(0, `rgba(4,16,12,${.78 * dim})`);
      panel.addColorStop(1, `rgba(3,10,9,${.88 * dim})`);
      ctx.save();
      ctx.fillStyle = panel;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      for (let i = 0; i < this.boardSize; i += 1) {
        const col = i % this.boardCols;
        const row = this.boardRows - 1 - Math.floor(i / this.boardCols);
        const x = rect.x + col * cellW + gap;
        const y = rect.y + row * cellH + gap;
        const width = Math.max(.35, cellW - gap * 2);
        const height = Math.max(.35, cellH - gap * 2);
        const level = this.boardLevel[i];
        const mintAge = now - this.boardMintAt[i];
        const spentAge = now - this.boardSpentAt[i];
        const coinbaseAge = now - this.boardCoinbaseAt[i];

        if (level > .025) {
          const value = this.boardValue[i];
          const breath = .88 + .12 * Math.sin(now * .0024 + i * .9);
          const red = Math.round(20 + value * 28);
          const green = Math.round(150 + value * 82);
          const blue = Math.round(92 + value * 57);
          ctx.fillStyle = `rgba(${red},${green},${blue},${Math.min(.95, level * breath * dim)})`;
        } else {
          ctx.fillStyle = `rgba(8,31,21,${.52 * dim})`;
        }
        ctx.fillRect(x, y, width, height);

        if (mintAge >= 0 && mintAge < 650) {
          const fade = Math.pow(1 - mintAge / 650, 2) * dim;
          ctx.fillStyle = `rgba(215,255,233,${fade})`;
          ctx.fillRect(x, y, width, height);
        }
        if (coinbaseAge >= 0 && coinbaseAge < 850) {
          const fade = Math.pow(1 - coinbaseAge / 850, 2) * dim;
          ctx.fillStyle = `rgba(255,178,72,${fade})`;
          ctx.fillRect(x, y, width, height);
        }
        if (spentAge >= 0 && spentAge < 380) {
          const fade = Math.pow(1 - spentAge / 380, 2) * .82 * dim;
          ctx.fillStyle = `rgba(239,255,248,${fade})`;
          ctx.fillRect(x, y, width, height);
        }
      }

      for (const transfer of this.boardTransfers) {
        const elapsed = (now - transfer.startedAt) / transfer.duration;
        if (elapsed <= 0 || elapsed > 1.18) continue;
        const [fromX, fromY] = this.boardPoint(rect, transfer.from);
        const [toX, toY] = this.boardPoint(rect, transfer.to);
        const controlX = (fromX + toX) / 2;
        const controlY = (fromY + toY) / 2 - Math.min(34, rect.h * .09);
        for (let trail = 0; trail < 7; trail += 1) {
          const t = Math.max(0, Math.min(1, elapsed - trail * .045));
          if (t <= 0 || t >= 1) continue;
          const u = 1 - t;
          const x = u * u * fromX + 2 * u * t * controlX + t * t * toX;
          const y = u * u * fromY + 2 * u * t * controlY + t * t * toY;
          const head = trail === 0 ? 1 : 1 - trail / 7;
          this.dot(x, y, Math.max(.55, cellW * .12 * head), "#73ffc5", trail === 0 ? 9 : 2);
        }
      }

      ctx.strokeStyle = `rgba(56,239,158,${.42 * dim})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x + .5, rect.y + .5, rect.w - 1, rect.h - 1);
      const corner = Math.min(22, rect.w * .045);
      ctx.strokeStyle = `rgba(115,255,197,${.82 * dim})`;
      ctx.lineWidth = 1.4;
      const corners = [
        [rect.x, rect.y, 1, 1],
        [rect.x + rect.w, rect.y, -1, 1],
        [rect.x, rect.y + rect.h, 1, -1],
        [rect.x + rect.w, rect.y + rect.h, -1, -1]
      ];
      for (const [x, y, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + sx * corner, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + sy * corner);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSnapshot(rect, snapshot, opacity = 1, detailed = false) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= opacity;
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, Math.max(0, rect.w), Math.max(0, rect.h));
      ctx.clip();
      ctx.fillStyle = "#020807";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      if (detailed && snapshot.bits) {
        const cellW = rect.w / this.boardCols;
        const cellH = rect.h / this.boardRows;
        const gap = Math.max(.3, Math.min(1.7, cellW * .17));
        for (let i = 0; i < snapshot.bits.length; i += 1) {
          const col = i % this.boardCols;
          const row = this.boardRows - 1 - Math.floor(i / this.boardCols);
          ctx.fillStyle = snapshot.bits[i]
            ? (this.random(snapshot.seed * 17 + i) > .88 ? "rgba(215,255,233,.8)" : "rgba(56,239,158,.5)")
            : "rgba(8,24,17,.7)";
          ctx.fillRect(
            rect.x + col * cellW + gap,
            rect.y + row * cellH + gap,
            Math.max(.3, cellW - gap * 2),
            Math.max(.3, cellH - gap * 2)
          );
        }
      } else {
        const cols = 7;
        const rows = 4;
        const cellW = rect.w / cols;
        const cellH = rect.h / rows;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            if (this.random(snapshot.seed * 97 + row * 19 + col * 11) < .46) continue;
            ctx.fillStyle = "rgba(56,239,158,.38)";
            ctx.fillRect(rect.x + col * cellW + 1, rect.y + row * cellH + 1, Math.max(.5, cellW - 2), Math.max(.5, cellH - 2));
          }
        }
      }

      ctx.strokeStyle = detailed ? "rgba(115,255,197,.86)" : "rgba(115,255,197,.42)";
      ctx.lineWidth = detailed ? 1.5 : .7;
      ctx.strokeRect(rect.x + .5, rect.y + .5, Math.max(0, rect.w - 1), Math.max(0, rect.h - 1));

      if (detailed && rect.w > 180) {
        const topH = Math.max(26, rect.h * .105);
        const bottomH = Math.max(24, rect.h * .095);
        ctx.fillStyle = "rgba(2,8,7,.82)";
        ctx.fillRect(rect.x + 8, rect.y + 8, Math.min(rect.w * .63, 310), topH);
        ctx.fillRect(rect.x + 8, rect.y + rect.h - bottomH - 8, rect.w - 16, bottomH);
        this.text(`${canvasText("snapshot", "SNAPSHOT :: BLOCK")} #${snapshot.height}`, rect.x + 18, rect.y + 8 + topH / 2, "#d7ffe9", Math.max(8, rect.w * .018), "left");
        this.text(`state_root ${this.fakeRoot(snapshot.seed)}`, rect.x + 18, rect.y + rect.h - bottomH / 2 - 8, "rgba(115,255,197,.42)", Math.max(6.5, rect.w * .013), "left");

        ctx.save();
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.font = `800 ${Math.max(54, rect.h * .34)}px ui-monospace, monospace`;
        ctx.fillStyle = "rgba(215,255,233,.42)";
        ctx.fillText(`#${snapshot.height}`, rect.x + rect.w - 14, rect.y + rect.h - bottomH - 18);
        ctx.restore();
      }
      ctx.restore();
    }

    tailLayout(boardRect, proofX, layout) {
      const y = layout.mobile ? this.h * .87 : this.h * .79;
      const start = boardRect.x + 4;
      const end = proofX - (layout.mobile ? 55 : 115);
      const step = (end - start) / 17;
      const width = Math.min(layout.mobile ? 13 : 29, step * .72);
      const height = width * this.boardRows / this.boardCols;
      return {
        y,
        width,
        height,
        positions: Array.from({ length: 18 }, (_, i) => start + step * i)
      };
    }

    drawPhotoPipeline(boardRect, proofX, proofY, layout, now) {
      const tail = this.tailLayout(boardRect, proofX, layout);
      const shift = this.ease((now - this.tailShiftAt) / 620);
      this.line([[tail.positions[0], tail.y], [tail.positions[17], tail.y]], "rgba(115,255,197,.12)", .8);

      this.tailPhotos.forEach((snapshot, index) => {
        let x = tail.positions[index];
        if (index > 0 && shift < 1) x = tail.positions[index - 1] + (x - tail.positions[index - 1]) * shift;
        const rect = { x: x - tail.width / 2, y: tail.y - tail.height / 2, w: tail.width, h: tail.height };
        this.drawSnapshot(rect, snapshot, index === 17 ? .9 : .62, false);
      });
      this.text(`#${this.tailPhotos[0].height}`, tail.positions[0], tail.y - tail.height - 9, "rgba(115,255,197,.62)", 7);

      if (this.photo && !this.photo.landed) {
        const age = now - this.photo.startedAt;
        let rect;
        if (age < 520) {
          const reveal = this.ease(age / 170);
          rect = {
            x: boardRect.x,
            y: boardRect.y + boardRect.h * (1 - reveal) / 2,
            w: boardRect.w,
            h: Math.max(2, boardRect.h * reveal)
          };
        } else {
          const move = this.ease((age - 520) / 980);
          const target = {
            x: tail.positions[0] - tail.width / 2,
            y: tail.y - tail.height / 2,
            w: tail.width,
            h: tail.height
          };
          rect = {
            x: boardRect.x + (target.x - boardRect.x) * move,
            y: boardRect.y + (target.y - boardRect.y) * move,
            w: boardRect.w + (target.w - boardRect.w) * move,
            h: boardRect.h + (target.h - boardRect.h) * move
          };
        }
        this.drawSnapshot(rect, this.photo.snapshot, 1, rect.w > 150);

        if (age < 410) {
          const flash = Math.sin(Math.min(1, age / 410) * Math.PI) * .34;
          const gradient = this.ctx.createRadialGradient(
            boardRect.x + boardRect.w / 2,
            boardRect.y + boardRect.h / 2,
            0,
            boardRect.x + boardRect.w / 2,
            boardRect.y + boardRect.h / 2,
            boardRect.w * .7
          );
          gradient.addColorStop(0, `rgba(215,255,233,${flash})`);
          gradient.addColorStop(1, "rgba(115,255,197,0)");
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(boardRect.x - 40, boardRect.y - 40, boardRect.w + 80, boardRect.h + 80);
        }
      }

      if (this.overflowBlock) {
        const t = Math.max(0, Math.min(1, (now - this.overflowBlock.startedAt) / 1120));
        const e = this.ease(t);
        const fromX = tail.positions[17];
        const fromY = tail.y;
        const controlX = (fromX + proofX) / 2 + (layout.mobile ? 4 : 26);
        const controlY = Math.min(fromY, proofY) - (layout.mobile ? 25 : 70);
        const u = 1 - e;
        const x = u * u * fromX + 2 * u * e * controlX + e * e * proofX;
        const y = u * u * fromY + 2 * u * e * controlY + e * e * proofY;
        this.path((path) => {
          path.moveTo(fromX, fromY);
          path.quadraticCurveTo(controlX, controlY, proofX, proofY);
        }, "rgba(194,170,255,.22)", .9);
        if (e < .6) {
          const scale = 1 - e * .7;
          this.drawSnapshot({
            x: x - tail.width * scale / 2,
            y: y - tail.height * scale / 2,
            w: tail.width * scale,
            h: tail.height * scale
          }, this.overflowBlock.snapshot, 1, false);
        }
        this.dot(x, y, 1.8 + e * 3.2, e > .45 ? "#c2aaff" : "#73ffc5", 18);
      }

      return tail;
    }

    drawNetworkIntro(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const clamp01 = value => Math.max(0, Math.min(1, value));
      const smooth = (start, end, value) => this.ease((value - start) / Math.max(.0001, end - start));
      const cycle = 10400;
      const phase = ((now + 1200) % cycle) / cycle;
      const stateProgress = smooth(.20, .50, phase) * (1 - smooth(.80, .92, phase));
      // Proofs form a pipeline: as soon as the first verifier tier can relay
      // one proof, the core begins broadcasting the next one.
      const proofWaveInterval = 2875;
      const proofWaveHead = (now + 1200) % proofWaveInterval;
      const proofWaves = [
        proofWaveHead,
        proofWaveHead + proofWaveInterval,
        proofWaveHead + proofWaveInterval * 2,
        proofWaveHead + proofWaveInterval * 3
      ];

      const left = this.w * (l.mobile ? .05 : l.compact ? .615 : .515);
      const right = this.w * (l.mobile ? .95 : l.compact ? .96 : .92);
      const stage = l.mobile ? null : this.desktopStageBounds();
      const sceneHeight = this.h * .54;
      const top = l.mobile ? this.h * .02 : stage.center - sceneHeight / 2;
      const bottom = l.mobile ? this.h * .84 : stage.center + sceneHeight / 2;
      const width = right - left;
      const height = bottom - top;
      const centerY = (top + bottom) / 2;
      const proverX = left + width * .21;
      const boundaryX = left + width * .38;
      const proverRadius = l.mobile
        ? Math.min(29, height * .15)
        : l.compact
          ? Math.min(29, width * .11)
          : Math.min(42, width * .068);
      const labelSize = l.mobile ? 6.5 : l.compact ? 7.2 : 9;

      const nodeSpecs = l.mobile
        ? [[.50, .49], [.57, .25], [.67, .75], [.78, .14], [.87, .46], [.84, .85]]
        : [[.50, .49], [.57, .26], [.67, .75], [.79, .15], [.87, .47], [.84, .83]];
      const nodes = nodeSpecs.map(([x, y]) => ({ x: left + width * x, y: top + height * y }));
      const cardW = l.mobile ? 36 : l.compact ? 40 : 57;
      const cardH = l.mobile ? 26 : l.compact ? 28 : 37;

      const cubicPoint = (p0, p1, p2, p3, t) => {
        const u = 1 - t;
        return {
          x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
          y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
        };
      };

      const quadraticPoint = (from, control, to, t) => {
        const u = 1 - t;
        return {
          x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
          y: u * u * from.y + 2 * u * t * control.y + t * t * to.y
        };
      };

      const curveControl = (from, to, bend = 0) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        return {
          x: (from.x + to.x) / 2 - dy / length * bend,
          y: (from.y + to.y) / 2 + dx / length * bend
        };
      };

      ctx.save();

      const field = ctx.createRadialGradient(boundaryX, centerY, 0, boundaryX, centerY, width * .58);
      field.addColorStop(0, "rgba(115,255,197,.065)");
      field.addColorStop(.46, "rgba(61,164,126,.024)");
      field.addColorStop(1, "rgba(2,8,7,0)");
      ctx.fillStyle = field;
      ctx.fillRect(left - width * .08, top - height * .12, width * 1.16, height * 1.24);

      const streamColors = ["#ff957d", "#c2aaff", "#bff7ff", "#73ffc5", "#c2aaff"];
      const streamOffsets = [-.30, -.15, 0, .16, .30];
      streamOffsets.forEach((offset, index) => {
        const p0 = { x: left, y: centerY + offset * height };
        const p1 = { x: left + width * .09, y: centerY + offset * height * 1.12 };
        const p2 = { x: proverX - proverRadius * 1.75, y: centerY + offset * height * .24 };
        const p3 = { x: proverX - proverRadius * .82, y: centerY + offset * proverRadius * .20 };
        const color = streamColors[index];

        this.path(path => {
          path.moveTo(p0.x, p0.y);
          path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        }, index === 0 ? "rgba(255,149,125,.25)" : index === 3 ? "rgba(115,255,197,.25)" : "rgba(194,170,255,.18)", l.mobile ? .75 : 1);

        ctx.save();
        ctx.translate(p0.x, p0.y);
        ctx.rotate(Math.PI / 4);
        const fragment = l.mobile ? 2.1 : 2.8;
        ctx.fillStyle = `${color}88`;
        ctx.fillRect(-fragment, -fragment, fragment * 2, fragment * 2);
        ctx.restore();

        for (let packetIndex = 0; packetIndex < 2; packetIndex += 1) {
          const t = (now * .00013 + index * .173 + packetIndex * .51) % 1;
          const packet = cubicPoint(p0, p1, p2, p3, this.ease(t));
          this.dot(packet.x, packet.y, l.mobile ? 1.15 : 1.65, color, l.mobile ? 7 : 11);
        }
      });

      const corePulse = .5 + .5 * Math.sin(now * .0024);
      const coreHalo = ctx.createRadialGradient(proverX, centerY, 0, proverX, centerY, proverRadius * 2.5);
      coreHalo.addColorStop(0, `rgba(194,170,255,${.16 + corePulse * .06})`);
      coreHalo.addColorStop(.35, "rgba(115,255,197,.055)");
      coreHalo.addColorStop(1, "rgba(2,8,7,0)");
      ctx.fillStyle = coreHalo;
      ctx.beginPath();
      ctx.arc(proverX, centerY, proverRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(proverX, centerY);
      ctx.beginPath();
      for (let side = 0; side < 6; side += 1) {
        const angle = -Math.PI / 2 + side * Math.PI / 3;
        const x = Math.cos(angle) * proverRadius;
        const y = Math.sin(angle) * proverRadius;
        if (side === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(7,20,18,.90)";
      ctx.fill();
      ctx.strokeStyle = "rgba(194,170,255,.76)";
      ctx.lineWidth = l.mobile ? 1 : 1.25;
      ctx.shadowColor = "#c2aaff";
      ctx.shadowBlur = 12 + corePulse * 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let ring = 0; ring < 3; ring += 1) {
        const radius = proverRadius * (.70 - ring * .16);
        const rotation = now * (.00022 + ring * .00007) * (ring % 2 ? -1 : 1);
        ctx.beginPath();
        ctx.arc(0, 0, radius, rotation, rotation + Math.PI * (1.05 + ring * .16));
        ctx.strokeStyle = ring === 0 ? "rgba(255,149,125,.56)" : ring === 1 ? "rgba(194,170,255,.58)" : "rgba(115,255,197,.68)";
        ctx.lineWidth = l.mobile ? .85 : 1.1;
        ctx.stroke();
      }
      ctx.restore();
      this.text("1×", proverX, centerY, "#effff8", l.mobile ? 8 : l.compact ? 9 : 11);

      ctx.save();
      ctx.setLineDash([2, l.mobile ? 6 : 8]);
      ctx.beginPath();
      ctx.moveTo(boundaryX, top + height * .10);
      ctx.lineTo(boundaryX, bottom - height * .10);
      ctx.strokeStyle = "rgba(191,247,255,.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      const proofStart = { x: proverX + proverRadius * .96, y: centerY };
      const capsuleW = l.mobile ? 31 : l.compact ? 35 : 46;
      const capsuleH = l.mobile ? 22 : l.compact ? 24 : 30;

      const drawProofCapsule = (point, alpha = 1, scale = 1) => {
        const width = capsuleW * scale;
        const height = capsuleH * scale;
        ctx.save();
        ctx.globalAlpha *= alpha;
        this.roundedRect(
          point.x - width / 2,
          point.y - height / 2,
          width,
          height,
          Math.max(3, (l.mobile ? 5 : 7) * scale),
          "rgba(194,170,255,.90)",
          "rgba(19,12,37,.90)",
          l.mobile ? .9 : 1.1
        );
        this.text("π", point.x, point.y, "#d8c8ff", Math.max(5.5, (l.mobile ? 8 : 10) * scale));
        ctx.restore();
      };

      const directPeers = [
        { node: nodes[0], bend: -height * .018, duration: 940 },
        { node: nodes[1], bend: height * .070, duration: 1250 },
        { node: nodes[2], bend: height * .110, duration: 1560 }
      ];
      directPeers.forEach(({ node, bend, duration }) => {
        const control = curveControl(proofStart, node, bend);
        ctx.save();
        const route = ctx.createLinearGradient(proofStart.x, proofStart.y, node.x, node.y);
        route.addColorStop(0, "rgba(194,170,255,.18)");
        route.addColorStop(.48, "rgba(191,247,255,.18)");
        route.addColorStop(1, "rgba(115,255,197,.15)");
        ctx.beginPath();
        ctx.moveTo(proofStart.x, proofStart.y);
        ctx.quadraticCurveTo(control.x, control.y, node.x, node.y);
        ctx.strokeStyle = route;
        ctx.lineWidth = l.mobile ? .7 : .9;
        ctx.stroke();
        ctx.restore();

        proofWaves.forEach(waveElapsed => {
          if (waveElapsed > duration) return;
          const broadcastRaw = clamp01(waveElapsed / duration);
          const broadcastProgress = this.ease(broadcastRaw);
          const broadcastEnergy = smooth(0, .10, broadcastRaw) * (1 - smooth(.84, 1, broadcastRaw));
          const copy = quadraticPoint(proofStart, control, node, broadcastProgress);
          drawProofCapsule(copy, broadcastEnergy, l.mobile ? .53 : .48);
        });
      });

      const drawVerifier = (node, verificationProgress, amount, isVerifying) => {
        if (amount > .015) {
          const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, cardW * .95);
          halo.addColorStop(0, isVerifying
            ? `rgba(194,170,255,${.14 * amount})`
            : `rgba(115,255,197,${.16 * amount})`);
          halo.addColorStop(1, isVerifying ? "rgba(194,170,255,0)" : "rgba(115,255,197,0)");
          ctx.fillStyle = halo;
          ctx.fillRect(node.x - cardW, node.y - cardW, cardW * 2, cardW * 2);
        }

        this.roundedRect(
          node.x - cardW / 2,
          node.y - cardH / 2,
          cardW,
          cardH,
          l.mobile ? 6 : 8,
          isVerifying
            ? `rgba(194,170,255,${.44 + amount * .48})`
            : `rgba(115,255,197,${.48 + amount * .46})`,
          isVerifying
            ? `rgba(14,12,31,${.76 + amount * .12})`
            : `rgba(4,25,19,${.72 + amount * .14})`,
          amount > .55 ? 1.2 : .8
        );

        ctx.save();
        ctx.globalAlpha *= .62 + amount * .34;
        this.text("π", node.x - cardW * .22, node.y, "#d8c8ff", l.mobile ? 6.5 : 8);

        ctx.strokeStyle = "rgba(191,247,255,.55)";
        ctx.lineWidth = l.mobile ? .65 : .8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(node.x - cardW * .065, node.y);
        ctx.lineTo(node.x + cardW * .025, node.y);
        ctx.moveTo(node.x - cardW * .005, node.y - cardH * .06);
        ctx.lineTo(node.x + cardW * .025, node.y);
        ctx.lineTo(node.x - cardW * .005, node.y + cardH * .06);
        ctx.stroke();

        const checkStart = { x: node.x + cardW * .07, y: node.y + cardH * .02 };
        const checkJoint = { x: node.x + cardW * .15, y: node.y + cardH * .15 };
        const checkEnd = { x: node.x + cardW * .31, y: node.y - cardH * .18 };
        const firstCheck = clamp01(verificationProgress / .34);
        const secondCheck = clamp01((verificationProgress - .34) / .66);

        // A node is always live. During verification, the previous completed
        // check remains underneath while the new result is drawn over it.
        ctx.beginPath();
        ctx.moveTo(checkStart.x, checkStart.y);
        ctx.lineTo(checkJoint.x, checkJoint.y);
        ctx.lineTo(checkEnd.x, checkEnd.y);
        ctx.strokeStyle = isVerifying ? "rgba(115,255,197,.20)" : "rgba(115,255,197,.46)";
        ctx.lineWidth = l.mobile ? .9 : 1.05;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.beginPath();
        if (firstCheck > 0) {
          ctx.moveTo(checkStart.x, checkStart.y);
          ctx.lineTo(
            checkStart.x + (checkJoint.x - checkStart.x) * firstCheck,
            checkStart.y + (checkJoint.y - checkStart.y) * firstCheck
          );
        }
        if (secondCheck > 0) {
          ctx.moveTo(checkJoint.x, checkJoint.y);
          ctx.lineTo(
            checkJoint.x + (checkEnd.x - checkJoint.x) * secondCheck,
            checkJoint.y + (checkEnd.y - checkJoint.y) * secondCheck
          );
        }
        ctx.strokeStyle = isVerifying ? "#c2aaff" : "#73ffc5";
        ctx.lineWidth = l.mobile ? 1.1 : 1.35;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = isVerifying ? "#c2aaff" : "#73ffc5";
        ctx.shadowBlur = amount * 10;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = isVerifying ? "rgba(194,170,255,.70)" : "rgba(115,255,197,.62)";
        ctx.fillRect(
          node.x - cardW * .31,
          node.y + cardH * .31,
          cardW * .62 * verificationProgress,
          l.mobile ? .7 : 1
        );
        ctx.restore();
      };

      const peerEdges = [
        { from: 1, to: 3, bend: -height * .018, delay: 2760 },
        { from: 0, to: 4, bend: -height * .012, delay: 1930 },
        { from: 2, to: 5, bend: height * .018, delay: 2760 },
        { from: 1, to: 4, bend: height * .032, delay: 2760 },
        { from: 2, to: 4, bend: -height * .027, delay: 2760 },
        { from: 3, to: 4, bend: height * .030, delay: 6330, relay: false },
        { from: 4, to: 5, bend: height * .028, delay: 5910, relay: false }
      ];

      const outsideX = right + width * (l.mobile ? .14 : .16);
      const externalEdges = [
        { from: 3, to: { x: outsideX, y: top - height * .02 }, bend: -height * .022, delay: 6330 },
        { from: 3, to: { x: outsideX, y: top + height * .27 }, bend: height * .018, delay: 6330 },
        { from: 4, to: { x: outsideX, y: top + height * .51 }, bend: -height * .012, delay: 5910 },
        { from: 5, to: { x: outsideX, y: bottom + height * .04 }, bend: height * .020, delay: 6050 },
        { from: 1, to: { x: left + width * .84, y: top - height * .17 }, bend: -height * .018, delay: 2760 },
        { from: 2, to: { x: left + width * .86, y: bottom + height * .16 }, bend: height * .020, delay: 2760 }
      ];

      const drawNetworkLink = (from, to, bend, external = false) => {
        const control = curveControl(from, to, bend);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
        if (external) {
          const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          gradient.addColorStop(0, "rgba(115,255,197,.17)");
          gradient.addColorStop(.58, "rgba(115,255,197,.10)");
          gradient.addColorStop(1, "rgba(115,255,197,0)");
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = "rgba(115,255,197,.14)";
        }
        ctx.lineWidth = l.mobile ? .65 : .9;
        ctx.stroke();
        ctx.restore();
        return control;
      };

      const drawRelay = (edge, edgeIndex, external = false) => {
        const from = nodes[edge.from];
        const to = edge.to.x === undefined ? nodes[edge.to] : edge.to;
        const control = drawNetworkLink(from, to, edge.bend, external);
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const duration = (external ? 2760 : 2040) + Math.min(720, distance / Math.max(1, width) * 1160);
        const jitter = (((edgeIndex * 7) % 5) - 2) * 15;
        const start = edge.delay + jitter;
        proofWaves.forEach(waveElapsed => {
          const relayRaw = (waveElapsed - start) / duration;
          if (edge.relay !== false && relayRaw > 0 && relayRaw < 1) {
            const progress = this.ease(relayRaw);
            const packet = quadraticPoint(from, control, to, progress);
            const energy = Math.pow(Math.sin(relayRaw * Math.PI), .72);
            drawProofCapsule(packet, energy, l.mobile ? .43 : .36);
          }
        });

        const ambientProgress = (now * .000055 + edgeIndex * .173) % 1;
        const ambient = quadraticPoint(from, control, to, ambientProgress);
        ctx.save();
        ctx.globalAlpha *= external ? .16 : .24;
        ctx.fillStyle = "#73ffc5";
        ctx.beginPath();
        ctx.arc(ambient.x, ambient.y, l.mobile ? .48 : .65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      peerEdges.forEach((edge, index) => drawRelay(edge, index));
      externalEdges.forEach((edge, index) => drawRelay(edge, peerEdges.length + index, true));

      const verificationTimelines = [
        { arrival: 940, duration: 990 },
        { arrival: 1250, duration: 1510 },
        { arrival: 1560, duration: 1200 },
        { arrival: 5080, duration: 1250 },
        { arrival: 4400, duration: 1510 },
        { arrival: 5010, duration: 1040 }
      ];
      nodes.forEach((node, index) => {
        const timing = verificationTimelines[index];
        const completion = timing.arrival + timing.duration;
        const activeWave = proofWaves.find(waveElapsed => waveElapsed >= timing.arrival && waveElapsed < completion);
        const isVerifying = activeWave !== undefined;
        const verificationRaw = isVerifying ? clamp01((activeWave - timing.arrival) / timing.duration) : 1;
        const verificationProgress = isVerifying ? this.ease(verificationRaw) : 1;
        const arrivalPulse = Math.max(...proofWaves.map(waveElapsed => Math.exp(-Math.pow((waveElapsed - timing.arrival) / 260, 2))));
        const completionPulse = Math.max(...proofWaves.map(waveElapsed => Math.exp(-Math.pow((waveElapsed - completion) / 415, 2))));
        const amount = Math.min(1, .42 + (isVerifying ? .08 : .14) + arrivalPulse * .28 + completionPulse * .34);
        drawVerifier(node, verificationProgress, amount, isVerifying);
      });

      const stripLeft = boundaryX + width * .08;
      const stripRight = right - width * .025;
      const stripY = bottom - (l.mobile ? 18 : 24);
      const cellCount = l.mobile ? 9 : 12;
      const cellGap = l.mobile ? 2 : 3;
      const cellWidth = (stripRight - stripLeft - cellGap * (cellCount - 1)) / cellCount;
      for (let cell = 0; cell < cellCount; cell += 1) {
        const live = this.random(6100 + cell * 19) > .37;
        const clearing = cell === Math.floor(cellCount * .30);
        const filling = cell === Math.floor(cellCount * .72);
        let alpha = live ? .30 : .055;
        let color = "115,255,197";
        if (clearing) {
          alpha = .34 * (1 - stateProgress) + .045;
          color = "255,149,125";
        }
        if (filling) alpha = .055 + stateProgress * .72;
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.fillRect(stripLeft + cell * (cellWidth + cellGap), stripY, cellWidth, l.mobile ? 3 : 4);
      }

      this.text(canvasText("proveOnce", "PROVE ONCE"), proverX, top + labelSize, "rgba(255,255,255,.72)", labelSize);
      this.text(canvasText("verifyEverywhere", "EVERY NODE VERIFIES"), left + width * .82, top + labelSize, "rgba(115,255,197,.72)", labelSize);
      if (!l.mobile && !l.compact) this.text(canvasText("proofBoundary", "PROOF BOUNDARY"), boundaryX, top + labelSize * 3.4, "rgba(191,247,255,.34)", labelSize * .78);
      this.text(canvasText("noReexecution", "NO RE-EXECUTION"), (proverX + boundaryX) / 2, centerY + proverRadius + (l.mobile ? 20 : 29), "rgba(194,170,255,.62)", labelSize * .86);
      this.text(canvasText("liveStateAdvances", "LIVE STATE ADVANCES"), (stripLeft + stripRight) / 2, bottom - (l.mobile ? 4 : 7), stateProgress > .5 ? "rgba(115,255,197,.72)" : "rgba(115,255,197,.38)", labelSize * .82);

      ctx.restore();
    }

    drawPresent(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const right = this.w * (l.mobile ? .945 : l.compact ? .935 : .915);
      const baselineLeft = this.w * (l.mobile ? .055 : l.compact ? .555 : .445);
      let left = baselineLeft;
      if (!l.mobile && presentDetails) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const contentRect = presentDetails.getBoundingClientRect();
        const contentBoundary = contentRect.right - canvasRect.left;
        const proportionalGap = this.w * .012;
        left = Math.min(right - this.w * .30, Math.max(baselineLeft, contentBoundary + proportionalGap));
      }
      const top = this.h * (l.mobile ? .055 : .295);
      const bottom = this.h * (l.mobile ? .94 : .695);
      const width = right - left;
      const height = bottom - top;
      const labelSize = l.mobile ? 7.2 : l.compact ? 8.4 : 9.6;
      const annotationSize = l.mobile ? 5.35 : labelSize * .74;
      const columns = l.mobile ? 28 : l.compact ? 34 : 40;
      const gap = l.mobile ? 1.15 : 1.8;
      const columnWidth = (width - gap * (columns - 1)) / columns;
      const scanCycle = (now * .00005) % 1;
      const scan = Math.min(1, scanCycle / .84);
      const scanColumn = Math.min(columns - 1, Math.floor(scan * columns));

      const axisY = bottom;
      this.line([[left, axisY], [right, axisY]], "rgba(191,247,255,.19)", .8);
      for (let tick = 0; tick <= 5; tick += 1) {
        const x = left + width * tick / 5;
        this.line([[x, axisY - 3], [x, axisY + 3]], "rgba(191,247,255,.22)", .8);
      }
      this.text(canvasText("today", "TODAY"), left, axisY + (l.mobile ? 8 : 12), "rgba(191,247,255,.52)", annotationSize, "left");
      this.text(canvasText("tenYears", "+10 YEARS"), right, axisY + (l.mobile ? 8 : 12), "rgba(191,247,255,.72)", annotationSize, "right");

      const historyBase = top + height * .42;
      const historyMax = height * .29;
      this.text(canvasText("bitcoinFullNode", "BITCOIN FULL NODE"), left, top, "rgba(255,149,125,.95)", labelSize, "left");
      this.text(canvasText("everyBlockKept", "EVERY BLOCK STAYS"), left, top + labelSize * 1.55, "rgba(255,149,125,.56)", annotationSize, "left");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left, historyBase);
      for (let i = 0; i < columns; i += 1) {
        const t = i / (columns - 1);
        const x = left + i * (columnWidth + gap) + columnWidth * .5;
        const stackHeight = historyMax * (.12 + .88 * Math.pow(t, .84));
        ctx.lineTo(x, historyBase - stackHeight);
      }
      ctx.lineTo(right, historyBase);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,149,125,.025)";
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < columns; i += 1) {
        const t = i / (columns - 1);
        const rows = Math.max(1, Math.round(1 + t * (l.mobile ? 7 : 10)));
        const cellHeight = Math.max(2.1, historyMax / (l.mobile ? 9.8 : 12.6));
        const x = left + i * (columnWidth + gap);
        const distance = Math.abs(i - scanColumn);
        for (let row = 0; row < rows; row += 1) {
          const y = historyBase - (row + 1) * (cellHeight + gap * .46);
          const lit = distance <= 1;
          const accumulated = i <= scanColumn;
          ctx.fillStyle = lit
            ? `rgba(255,149,125,${.44 - distance * .10})`
            : accumulated
              ? `rgba(255,149,125,${.14 + t * .12})`
              : `rgba(255,149,125,${.035 + t * .035})`;
          ctx.fillRect(x, y, columnWidth, cellHeight);
          if (row === rows - 1) {
            ctx.strokeStyle = lit ? "rgba(255,194,174,.72)" : accumulated ? "rgba(255,149,125,.28)" : "rgba(255,149,125,.11)";
            ctx.lineWidth = .55;
            ctx.strokeRect(x, y, columnWidth, cellHeight);
          }
        }
      }
      this.line([[left, historyBase], [right, historyBase]], "rgba(255,149,125,.28)", .8);
      const scanX = left + scan * width;
      const scanT = scan;
      const scanY = historyBase - historyMax * (.12 + .88 * Math.pow(scanT, .84));
      this.line([[scanX, top + labelSize * 3], [scanX, axisY]], "rgba(191,247,255,.08)", .65);
      this.dot(scanX, scanY, l.mobile ? 1.2 : 1.7, "#ff957d", l.mobile ? 3 : 5);
      this.text(canvasText("historyGrows", "DISK + BOOTSTRAP GROW WITH EVERY BLOCK"), right, historyBase + labelSize * 1.55, "rgba(255,149,125,.72)", annotationSize, "right");

      const stateTop = top + height * .59;
      const stateRows = l.mobile ? 3 : 4;
      const stateHeight = height * (l.mobile ? .115 : .13);
      const stateCellHeight = (stateHeight - gap * (stateRows - 1)) / stateRows;
      this.text(canvasText("paranoidNode", "PARANO(1)D NODE"), left, stateTop - labelSize * 1.4, "rgba(115,255,197,.96)", labelSize, "left");
      this.text(canvasText("slotsReused", "SPENT SLOTS CLEAR · NEW OUTPUTS REUSE THEM"), left, stateTop, "rgba(115,255,197,.57)", annotationSize, "left");

      const gridTop = stateTop + labelSize * 1.25;
      const mutationPhase = (now * .00034) % 1;
      const mutationColumn = Math.floor(mutationPhase * columns);
      for (let column = 0; column < columns; column += 1) {
        const x = left + column * (columnWidth + gap);
        for (let row = 0; row < stateRows; row += 1) {
          const y = gridTop + row * (stateCellHeight + gap);
          const seed = column * 31 + row * 97 + 7100;
          const occupied = this.random(seed) > .28;
          const mutating = column === mutationColumn && row === (mutationColumn % stateRows);
          let fill = occupied ? "rgba(115,255,197,.18)" : "rgba(115,255,197,.025)";
          let stroke = occupied ? "rgba(115,255,197,.25)" : "rgba(115,255,197,.08)";
          if (mutating) {
            const refill = (mutationPhase * columns) % 1;
            fill = refill < .48
              ? `rgba(255,149,125,${.34 * (1 - refill / .48) + .04})`
              : `rgba(115,255,197,${.12 + .42 * (refill - .48) / .52})`;
            stroke = refill < .48 ? "rgba(255,149,125,.52)" : "rgba(191,247,255,.56)";
          }
          ctx.fillStyle = fill;
          ctx.fillRect(x, y, columnWidth, stateCellHeight);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = .45;
          ctx.strokeRect(x, y, columnWidth, stateCellHeight);
        }
      }

      const proofRadius = l.mobile ? 6.8 : 9.5;
      const proofX = right - proofRadius;
      const proofY = gridTop + stateHeight * .5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(proofX, proofY, proofRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(194,170,255,.11)";
      ctx.fill();
      ctx.strokeStyle = "rgba(194,170,255,.82)";
      ctx.lineWidth = .8;
      ctx.stroke();
      ctx.restore();
      this.text("π", proofX, proofY + .2, "#c2aaff", labelSize * .9);

      const tailCount = 18;
      const tailRight = proofX - proofRadius - gap * 2;
      const tailWidth = Math.min(width * (l.mobile ? .23 : .18), l.mobile ? 58 : 112);
      const tailLeft = tailRight - tailWidth;
      for (let i = 0; i < tailCount; i += 1) {
        const x = tailLeft + tailWidth * i / (tailCount - 1);
        const size = l.mobile ? 1.15 : 1.7;
        ctx.fillStyle = i === tailCount - 1 ? "rgba(194,170,255,.72)" : "rgba(191,247,255,.20)";
        ctx.fillRect(x - size, proofY - size, size * 2, size * 2);
      }
      this.text(canvasText("storageTracksLive", "STORAGE TRACKS LIVE UTXOs — NOT CHAIN AGE"), right, gridTop + stateHeight + labelSize * 1.25, "rgba(115,255,197,.76)", annotationSize, "right");
      this.text(canvasText("liveProofWindow", "LIVE STATE · PROOF · 18 BLOCKS"), right, gridTop - labelSize * .62, "rgba(194,170,255,.68)", l.mobile ? 4.9 : annotationSize * .9, "right");
    }

    drawReplay(now) {
      const l = this.layout();
      const startX = l.mobile ? this.w * .05 : this.w * (l.compact ? .56 : .39);
      const endX = l.mobile ? this.w * .92 : this.w * (l.compact ? .93 : .91);
      const cy = this.h * .49;
      const count = l.mobile ? 30 : 54;
      const amplitude = this.h * (l.compact ? .145 : .18);
      const ctx = this.ctx;
      this.path((p) => {
        p.moveTo(startX, cy);
        p.bezierCurveTo(startX + (endX - startX) * .34, cy - amplitude, startX + (endX - startX) * .68, cy + amplitude, endX, cy);
      }, "rgba(255,149,125,.24)", 1.2, 8);

      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const x = startX + (endX - startX) * t;
        const y = cy + Math.sin(t * Math.PI * 2) * amplitude * .53;
        const s = 2.2 + t * 3.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 1.7);
        ctx.fillStyle = `rgba(255,149,125,${.05 + t * .2})`;
        ctx.strokeStyle = `rgba(255,149,125,${.18 + t * .45})`;
        ctx.lineWidth = .75;
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        ctx.restore();
      }
      const t = (now * .0001) % 1;
      const px = startX + (endX - startX) * t;
      const py = cy + Math.sin(t * Math.PI * 2) * amplitude * .53;
      this.dot(px, py, 2.8, "#ff957d", 14);
      this.node(endX, cy, l.mobile ? 21 : 29, canvasText("now", "NOW"), "#ff957d", now);
      this.text(canvasText("genesis", "GENESIS"), startX, cy + 35, "rgba(255,149,125,.55)", 8);
      this.text(`${count} ${canvasText("transitions", "OF ∞ TRANSITIONS")}`, (startX + endX) / 2, cy + amplitude * .88, "rgba(255,149,125,.48)", 8);
    }

    drawProofFlow(now) {
      const l = this.layout();
      const right = l.mobile ? this.w * .87 : this.w * (l.compact ? .92 : .88);
      const radius = l.mobile ? 22 : 31;
      const fallbackLeft = this.w * (l.compact ? .59 : .48);
      const contentEdge = this.contentRight("#proof-native h2, #proof-native .lead, #proof-native .role-list");
      const left = l.mobile
        ? this.w * .13
        : Math.max(fallbackLeft, contentEdge + radius + this.w * (l.compact ? .018 : .022));
      const y = this.h * .48;
      const positions = [left, (left + right) / 2, right];
      const labels = ["W", "M", "N"];
      const colors = ["#ff957d", "#bff7ff", "#73ffc5"];
      const words = [
        canvasText("privateWitness", "PRIVATE WITNESS"),
        canvasText("publicTransition", "PUBLIC TRANSITION"),
        canvasText("verify", "VERIFY")
      ];

      this.line([[left, y], [right, y]], "rgba(115,255,197,.14)", 1);
      positions.forEach((x, i) => {
        this.node(x, y, radius, labels[i], colors[i], now);
        this.text(words[i], x, y + radius + 23, `${colors[i]}aa`, 7.5);
      });
      for (let lane = 0; lane < 3; lane += 1) {
        this.packetAlong(left + radius, y, positions[1] - radius, y, now * .00018 + lane * .33, "#c2aaff", 1.8);
        this.packetAlong(positions[1] + radius, y, right - radius, y, now * .00018 + .16 + lane * .33, "#73ffc5", 1.8);
      }
      this.text(canvasText("authorizationProof", "proof of authorization"), (positions[0] + positions[1]) / 2, y - 22, "rgba(194,170,255,.62)", 7.5);
      this.text(canvasText("writesProof", "proof of exact writes"), (positions[1] + positions[2]) / 2, y - 22, "rgba(115,255,197,.62)", 7.5);
    }

    drawLivingState(now) {
      const l = this.layout();
      this.updateLiveBoard(now, false);
      if (this.step === 5) sceneLabels.readState.textContent = `${(this.boardOccupied / this.boardSize * 100).toFixed(1)}% ${canvasText("livePercent", "live")}`;
      const boardRight = l.mobile ? this.w * .78 : this.w * (l.compact ? .86 : .79);
      const fallbackLeft = this.w * (l.compact ? .56 : .44);
      const contentEdge = this.contentRight("#living-state h2, #living-state .lead, #living-state .ledger");
      const boardLeft = l.mobile
        ? null
        : Math.max(fallbackLeft, contentEdge + this.w * (l.compact ? .018 : .022));
      const board = this.liveBoardRect(l, boardRight, boardLeft);
      this.drawLiveBoard(board, now, 1);
      const segmentX = l.mobile ? this.w * .84 : this.w * (l.compact ? .89 : .86);
      const segmentW = l.mobile ? this.w * .12 : this.w * (l.compact ? .055 : .08);
      const top = board.y;
      const bottom = board.y + board.h;
      this.ctx.save();
      this.ctx.setLineDash([4, 5]);
      this.ctx.strokeStyle = "rgba(115,255,197,.25)";
      this.ctx.strokeRect(segmentX, top, segmentW, bottom - top);
      this.ctx.restore();
      this.text(canvasText("virtualHalf", "VIRTUAL EMPTY HALF"), segmentX + segmentW / 2, bottom + 18, "rgba(115,255,197,.43)", 7);
      this.line([[board.x + board.w, (top + bottom) / 2], [segmentX, (top + bottom) / 2]], "rgba(115,255,197,.18)", 1);
    }

    drawOwnership(now) {
      const l = this.layout();
      const left = l.mobile ? this.w * .13 : this.w * (l.compact ? .59 : .48);
      const mid = l.mobile ? this.w * .51 : this.w * (l.compact ? .75 : .68);
      const right = l.mobile ? this.w * .88 : this.w * (l.compact ? .92 : .88);
      const compactMobile = l.mobile && this.h < 170;
      const y = this.h * (l.mobile ? .50 : .48);
      const radius = l.mobile ? Math.min(22, this.h * .115) : 30;
      this.node(left, y, radius, "s", "#ff957d", now);

      const ctx = this.ctx;
      const coreRadius = compactMobile ? 15 : 25;
      ctx.save();
      ctx.translate(mid, y);
      for (let ring = 0; ring < 4; ring += 1) {
        ctx.rotate(.24 + ring * .04);
        ctx.strokeStyle = `rgba(194,170,255,${.55 - ring * .09})`;
        const inset = ring * coreRadius * .2;
        ctx.strokeRect(-coreRadius + inset, -coreRadius + inset, coreRadius * 2 - inset * 2, coreRadius * 2 - inset * 2);
      }
      ctx.restore();
      this.text("P2b", mid, y, "#c2aaff", 10);
      this.node(right, y, radius, "o1", "#73ffc5", now);
      const coreEdge = coreRadius + (compactMobile ? 5 : 7);
      this.line([[left + radius, y], [mid - coreEdge, y]], "rgba(255,149,125,.22)", 1);
      this.line([[mid + coreEdge, y], [right - radius, y]], "rgba(115,255,197,.24)", 1);
      for (let i = 0; i < 3; i += 1) {
        this.packetAlong(left + radius, y, mid - coreEdge, y, now * .00016 + i / 3, "#ff957d", 1.7);
        this.packetAlong(mid + coreEdge, y, right - radius, y, now * .00016 + .18 + i / 3, "#73ffc5", 1.7);
      }
      const orbit = now * .0012;
      const orbitRadius = radius + (compactMobile ? 8 : 17);
      const proofX = right + Math.cos(orbit) * orbitRadius;
      const proofY = y + Math.sin(orbit) * orbitRadius;
      this.dot(proofX, proofY, 2, "#c2aaff", 10);
      if (!compactMobile) {
        this.text(canvasText("secret", "SECRET"), left, y + radius + 23, "rgba(255,149,125,.58)", 7.5);
        this.text("POSEIDON2b", mid, y + radius + 23, "rgba(194,170,255,.62)", 7.5);
        this.text(canvasText("statelessAddress", "STATELESS ADDRESS"), right, y + radius + 23, "rgba(115,255,197,.58)", 7.5);
      }
    }

    drawPagedSpend(now) {
      const l = this.layout();
      const left = l.mobile ? this.w * .10 : this.w * (l.compact ? .58 : .47);
      const txX = l.mobile ? this.w * .71 : this.w * (l.compact ? .83 : .80);
      const cy = this.h * .48;
      const pageCount = l.mobile ? 12 : 18;
      const spread = this.h * .5;
      for (let i = 0; i < pageCount; i += 1) {
        const lane = (i / (pageCount - 1) - .5);
        const x = left;
        const y = cy + lane * spread;
        const w = l.mobile ? 18 : 24;
        const h = l.mobile ? 9 : 12;
        this.roundedRect(x, y - h / 2, w, h, 2, "rgba(115,255,197,.35)", "rgba(115,255,197,.07)");
        this.path((p) => {
          p.moveTo(x + w, y);
          p.bezierCurveTo(x + (txX - x) * .46, y, txX - 60, cy, txX - 40, cy);
        }, "rgba(115,255,197,.12)", .8);
        if (i % 4 === 0) {
          const phase = (now * .00013 + i / pageCount) % 1;
          const px = x + w + (txX - 40 - x - w) * phase;
          const py = y + (cy - y) * phase * phase;
          this.dot(px, py, 1.4, "#73ffc5", 6);
        }
      }
      const txW = l.mobile ? 88 : 116;
      const txH = l.mobile ? 64 : 82;
      this.roundedRect(txX - txW / 2, cy - txH / 2, txW, txH, 13, "rgba(194,170,255,.72)", "rgba(194,170,255,.08)", 1.2);
      this.text(canvasText("one", "ONE"), txX, cy - 13, "rgba(194,170,255,.68)", 8);
      this.text("PAGEDSPEND", txX, cy + 3, "#c2aaff", l.mobile ? 8 : 9);
      this.text(canvasText("atomic", "ATOMIC"), txX, cy + 20, "rgba(239,255,248,.62)", 7);
      this.node(l.mobile ? this.w * .91 : this.w * .91, cy, l.mobile ? 14 : 18, "✓", "#73ffc5", now);
    }

    drawHistoryStep(now) {
      const l = this.layout();
      const left = l.mobile ? this.w * .14 : this.w * (l.compact ? .59 : .49);
      const mid = l.mobile ? this.w * .52 : this.w * (l.compact ? .75 : .69);
      const right = l.mobile ? this.w * .87 : this.w * (l.compact ? .92 : .88);
      const y = this.h * (l.mobile ? .40 : .45);
      const r = l.mobile ? 21 : 28;
      this.node(left, y, r, "π−1", "#c2aaff", now);

      const gridSize = l.mobile ? 48 : 62;
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(mid, y);
      ctx.rotate(-.12);
      ctx.strokeStyle = "rgba(115,255,197,.45)";
      ctx.fillStyle = "rgba(115,255,197,.035)";
      ctx.fillRect(-gridSize / 2, -gridSize / 2, gridSize, gridSize);
      ctx.strokeRect(-gridSize / 2, -gridSize / 2, gridSize, gridSize);
      for (let i = 1; i < 5; i += 1) {
        this.line([[-gridSize / 2, -gridSize / 2 + gridSize * i / 5], [gridSize / 2, -gridSize / 2 + gridSize * i / 5]], "rgba(115,255,197,.16)", .6);
        this.line([[-gridSize / 2 + gridSize * i / 5, -gridSize / 2], [-gridSize / 2 + gridSize * i / 5, gridSize / 2]], "rgba(115,255,197,.16)", .6);
      }
      ctx.restore();
      this.text(canvasText("blockState", "BLOCK + STATE"), mid, y + gridSize / 2 + 22, "rgba(115,255,197,.58)", 7.5);

      this.node(right, y, r + 4, "π", "#c2aaff", now);
      this.line([[left + r, y], [mid - gridSize / 2, y]], "rgba(194,170,255,.28)", 1);
      this.line([[mid + gridSize / 2, y], [right - r - 4, y]], "rgba(194,170,255,.34)", 1.2, 7);
      for (let i = 0; i < 3; i += 1) {
        this.packetAlong(left + r, y, mid - gridSize / 2, y, now * .0002 + i / 3, "#c2aaff", 1.8);
        this.packetAlong(mid + gridSize / 2, y, right - r - 4, y, now * .0002 + .2 + i / 3, "#c2aaff", 1.8);
      }
      this.text(canvasText("sameSize", "same size"), right, y + r + 26, "rgba(194,170,255,.64)", 8);
      this.drawTail(left, right, this.h * (l.mobile ? .68 : .77), now);
    }

    drawPrivacy(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const left = l.mobile ? this.w * .055 : this.w * (l.compact ? .575 : .465);
      const right = l.mobile ? this.w * .945 : this.w * (l.compact ? .93 : .91);
      const width = right - left;
      const streamY = this.h * .34;
      const trackerY = this.h * .72;
      const stateW = Math.min(l.mobile ? 68 : 104, width * .22);
      const stateH = Math.min(l.mobile ? 48 : 68, this.h * .34);
      const stateX = right - stateW * .55;
      const streamEnd = stateX - stateW * .58;
      const tapX = left + width * .39;
      const trackerX = left + width * .28;
      const labelSize = l.mobile ? Math.max(4.4, Math.min(6.2, this.h * .034)) : 7.4;

      this.text(canvasText("networkConsensus", "NETWORK CONSENSUS"), left, this.h * .10, "rgba(115,255,197,.74)", labelSize, "left");
      this.text(canvasText("transparentNow", "TRANSPARENT NOW"), right, this.h * .10, "rgba(191,247,255,.52)", labelSize, "right");
      this.line([[left, streamY], [streamEnd, streamY]], "rgba(115,255,197,.18)", 1);

      const packetCount = l.mobile ? 15 : 22;
      for (let i = 0; i < packetCount; i += 1) {
        const phase = (now * .000105 + i / packetCount) % 1;
        const x = left + (streamEnd - left) * phase;
        const wave = Math.sin(i * 2.31) * this.h * .035;
        const y = streamY + wave;
        const size = l.mobile ? 1.4 + (i % 3) * .35 : 2 + (i % 3) * .45;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `rgba(115,255,197,${.08 + phase * .28})`;
        ctx.strokeStyle = `rgba(191,247,255,${.12 + phase * .34})`;
        ctx.lineWidth = .55;
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.strokeRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
      for (let i = 0; i < 3; i += 1) {
        this.packetAlong(left, streamY, streamEnd, streamY, now * .00014 + i / 3, i === 1 ? "#bff7ff" : "#73ffc5", l.mobile ? 1.2 : 1.7);
      }

      this.roundedRect(
        stateX - stateW / 2,
        streamY - stateH / 2,
        stateW,
        stateH,
        l.mobile ? 8 : 11,
        "rgba(115,255,197,.62)",
        "rgba(6,28,21,.72)",
        1.1
      );
      const cols = 6;
      const rows = 4;
      const cellW = stateW * .68 / cols;
      const cellH = stateH * .46 / rows;
      const gridLeft = stateX - stateW * .34;
      const gridTop = streamY - stateH * .19;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const occupied = this.random(8800 + row * 31 + col * 17) > .32;
          ctx.fillStyle = occupied ? "rgba(115,255,197,.35)" : "rgba(115,255,197,.045)";
          ctx.fillRect(gridLeft + col * cellW, gridTop + row * cellH, Math.max(.8, cellW - 1), Math.max(.8, cellH - 1));
        }
      }
      this.text(canvasText("liveState", "LIVE STATE"), stateX, streamY + stateH * .36, "rgba(115,255,197,.78)", labelSize * .88);

      this.path((p) => {
        p.moveTo(tapX, streamY);
        p.bezierCurveTo(tapX, streamY + this.h * .12, trackerX, trackerY - this.h * .12, trackerX, trackerY);
      }, "rgba(255,149,125,.34)", 1, l.mobile ? 0 : 4);
      this.packetAlong(tapX, streamY, trackerX, trackerY, now * .00016, "#ff957d", l.mobile ? 1.2 : 1.7);
      this.node(trackerX, trackerY, l.mobile ? 13 : 19, "T", "#ff957d", now);
      this.text(canvasText("externalTracker", "EXTERNAL TRACKER"), trackerX, trackerY + (l.mobile ? 22 : 31), "rgba(255,149,125,.72)", labelSize);
      this.text(canvasText("recordEverything", "RECORDS EVERYTHING ITSELF"), trackerX, trackerY + (l.mobile ? 31 : 43), "rgba(255,149,125,.43)", labelSize * .74);

      const archiveLeft = trackerX + (l.mobile ? 25 : 39);
      const archiveRight = right;
      const columns = l.mobile ? 12 : 16;
      const gap = l.mobile ? 1.2 : 2;
      const columnW = (archiveRight - archiveLeft - gap * (columns - 1)) / columns;
      const cellHArchive = Math.max(1.4, Math.min(l.mobile ? 3.2 : 5, this.h * .026));
      const scan = Math.floor((now * .0014) % columns);
      for (let column = 0; column < columns; column += 1) {
        const height = 1 + Math.round(column / Math.max(1, columns - 1) * (l.mobile ? 7 : 10));
        for (let row = 0; row < height; row += 1) {
          const x = archiveLeft + column * (columnW + gap);
          const y = trackerY + (l.mobile ? 23 : 31) - (row + 1) * (cellHArchive + gap * .45);
          const active = column === scan;
          ctx.fillStyle = active ? "rgba(255,194,174,.48)" : `rgba(255,149,125,${.055 + column / columns * .12})`;
          ctx.strokeStyle = active ? "rgba(255,194,174,.72)" : "rgba(255,149,125,.18)";
          ctx.lineWidth = .45;
          ctx.fillRect(x, y, columnW, cellHArchive);
          ctx.strokeRect(x, y, columnW, cellHArchive);
        }
      }
      this.text(canvasText("lifetimeStorage", "STORAGE GROWS FOR THE NETWORK'S LIFETIME"), archiveRight, this.h * .92, "rgba(255,149,125,.55)", labelSize * .78, "right");
    }

    drawReceipt(now) {
      const l = this.layout();
      const ctx = this.ctx;
      let left = l.mobile ? this.w * .07 : this.w * (l.compact ? .585 : .48);
      const right = l.mobile ? this.w * .93 : this.w * (l.compact ? .925 : .90);
      if (!l.mobile) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const content = [...document.querySelectorAll("#receipts h2, #receipts .lead, #receipts .ledger")];
        const contentRight = content.reduce((edge, element) => Math.max(edge, element.getBoundingClientRect().right - canvasRect.left), 0);
        left = Math.max(left, contentRight + this.w * (l.compact ? .016 : .022));
      }
      const width = right - left;
      const y = this.h * .50;
      const paymentW = Math.min(l.mobile ? 64 : (l.compact ? 64 : 96), width * (l.mobile ? .22 : .18));
      const receiptW = Math.min(l.mobile ? 58 : (l.compact ? 64 : 86), width * (l.mobile ? .21 : .18));
      const paymentX = l.mobile ? left + width * .12 : left + paymentW * 1.90;
      const receiptX = l.mobile ? left + width * .51 : left + width * .58;
      const verifyX = left + width * .90;
      const cardH = Math.min(l.mobile ? 62 : 92, this.h * .56);
      const labelSize = l.mobile ? Math.max(4.3, Math.min(6.1, this.h * .034)) : 7.3;
      const layerStep = paymentW * .135;
      const dustStep = paymentW * .045;

      for (let layer = 0; layer < 4; layer += 1) {
        const fade = 1 - layer / 4;
        const x = paymentX - paymentW * .74 - layer * layerStep;
        const h = cardH * (.72 - layer * .08);
        this.roundedRect(x - paymentW * .34, y - h / 2, paymentW * .68, h, 5, `rgba(255,149,125,${.08 * fade})`, `rgba(255,149,125,${.018 * fade})`, .7);
        for (let dust = 0; dust < 5; dust += 1) {
          const dx = x - paymentW * .42 - dust * dustStep;
          const dy = y + (this.random(layer * 29 + dust * 17 + 9100) - .5) * h;
          this.dot(dx, dy, l.mobile ? .45 : .7, "#ff957d", 1);
        }
      }

      this.roundedRect(paymentX - paymentW / 2, y - cardH / 2, paymentW, cardH, 9, "rgba(115,255,197,.52)", "rgba(6,25,19,.72)", 1);
      this.text(canvasText("payment", "PAYMENT"), paymentX, y - cardH * .31, "rgba(115,255,197,.82)", labelSize);
      const lineLeft = paymentX - paymentW * .31;
      for (let row = 0; row < 4; row += 1) {
        const lineY = y - cardH * .12 + row * cardH * .13;
        this.line([[lineLeft, lineY], [paymentX + paymentW * (.12 + row * .035), lineY]], row === 2 ? "rgba(194,170,255,.48)" : "rgba(191,247,255,.20)", row === 2 ? 1.2 : .8);
      }

      this.line([[paymentX + paymentW / 2, y], [receiptX - receiptW / 2, y]], "rgba(194,170,255,.24)", 1);
      for (let packet = 0; packet < 2; packet += 1) {
        this.packetAlong(paymentX + paymentW / 2, y, receiptX - receiptW / 2, y, now * .00015 + packet * .5, "#c2aaff", l.mobile ? 1.1 : 1.6);
      }

      this.roundedRect(receiptX - receiptW / 2, y - cardH * .58, receiptW, cardH * 1.16, 7, "rgba(194,170,255,.76)", "rgba(19,13,37,.66)", 1.2);
      const fold = Math.min(12, receiptW * .2);
      this.line([
        [receiptX + receiptW / 2 - fold, y - cardH * .58],
        [receiptX + receiptW / 2 - fold, y - cardH * .58 + fold],
        [receiptX + receiptW / 2, y - cardH * .58 + fold]
      ], "rgba(194,170,255,.42)", .8);
      this.text(canvasText("portableReceipt", "PORTABLE RECEIPT"), receiptX, y - cardH * .39, "rgba(194,170,255,.88)", labelSize * .86);
      const receiptLineLeft = receiptX - receiptW * .31;
      for (let row = 0; row < 5; row += 1) {
        const lineY = y - cardH * .17 + row * cardH * .12;
        this.line([[receiptLineLeft, lineY], [receiptX + receiptW * (.16 + (row % 2) * .10), lineY]], row === 3 ? "rgba(115,255,197,.52)" : "rgba(191,247,255,.21)", row === 3 ? 1.1 : .75);
      }
      this.text("π", receiptX, y + cardH * .40, "#c2aaff", labelSize * 1.25);

      const pathStart = receiptX + receiptW / 2 + (l.mobile ? 5 : 9);
      const pathEnd = verifyX - (l.mobile ? 17 : 25);
      const pathY = y;
      this.line([[pathStart, pathY], [pathEnd, pathY]], "rgba(191,247,255,.16)", 1);
      for (let level = 0; level < 8; level += 1) {
        const x = pathStart + (pathEnd - pathStart) * (level + .5) / 8;
        const size = l.mobile ? 1.6 : 2.4;
        ctx.save();
        ctx.translate(x, pathY);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = level === 7 ? "rgba(115,255,197,.38)" : "rgba(191,247,255,.13)";
        ctx.strokeStyle = level === 7 ? "rgba(115,255,197,.72)" : "rgba(191,247,255,.35)";
        ctx.lineWidth = .65;
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.strokeRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
      this.packetAlong(pathStart, pathY, pathEnd, pathY, now * .00018, "#bff7ff", l.mobile ? 1.1 : 1.6);
      this.text(canvasText("merklePath8", "MERKLE PATH ×8"), (pathStart + pathEnd) / 2, pathY + (l.mobile ? 13 : 20), "rgba(191,247,255,.48)", labelSize * .78);

      const verifyRadius = l.mobile ? 15 : 22;
      this.node(verifyX, y, verifyRadius, "✓", "#73ffc5", now);
      const headerY = Math.max(this.h * .12, y - cardH * .48);
      const headerW = l.mobile ? 54 : 82;
      this.roundedRect(verifyX - headerW / 2, headerY - (l.mobile ? 8 : 11), headerW, l.mobile ? 16 : 22, 5, "rgba(115,255,197,.30)", "rgba(6,25,19,.52)", .8);
      this.text(canvasText("canonicalHeader", "CANONICAL HEADER"), verifyX, headerY, "rgba(115,255,197,.66)", labelSize * .68);
      this.line([[verifyX, headerY + (l.mobile ? 8 : 11)], [verifyX, y - verifyRadius]], "rgba(115,255,197,.24)", .8);
      this.text(canvasText("verifiedCanonical", "VERIFIED · CANONICAL"), verifyX, y + verifyRadius + (l.mobile ? 14 : 21), "rgba(115,255,197,.70)", labelSize * .78);
      this.text(canvasText("noBlockBody", "NO HISTORICAL BLOCK BODY"), (left + right) / 2, this.h * .92, "rgba(239,255,248,.44)", labelSize * .82);
    }

    drawProofStack(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const left = l.mobile ? this.w * .07 : this.w * (l.compact ? .59 : .49);
      const right = l.mobile ? this.w * .93 : this.w * (l.compact ? .925 : .90);
      const width = right - left;
      const stage = l.mobile ? null : this.desktopStageBounds();
      const stageBottom = l.mobile ? this.h : stage.bottom;
      const centerY = l.mobile ? this.h * .48 : stage.center;
      const cubeX = left + width * .65;
      const cubeSize = Math.min(l.mobile ? 68 : 106, width * .25, this.h * .47);
      const sourceX = left + width * .02;
      const cubeLeft = cubeX - cubeSize * .56;
      const outputX = right - (l.mobile ? 12 : 18);
      const labelSize = l.mobile ? Math.max(4.2, Math.min(6.0, this.h * .033)) : 7.2;
      const laneLabels = [
        canvasText("ownershipLane", "OWNERSHIP"),
        canvasText("transactionLane", "TRANSACTION"),
        canvasText("stateLane", "STATE"),
        canvasText("historyLane", "HISTORY"),
        canvasText("powLane", "POW")
      ];
      const colors = ["#ff957d", "#c2aaff", "#73ffc5", "#bff7ff", "#73ffc5"];
      const laneSpan = this.h * (l.mobile ? .56 : .48);

      laneLabels.forEach((label, index) => {
        const laneY = centerY - laneSpan / 2 + laneSpan * index / (laneLabels.length - 1);
        const targetY = centerY + (index - 2) * cubeSize * .105;
        this.text(label, sourceX, laneY, `${colors[index]}b8`, labelSize, "left");
        this.path((p) => {
          p.moveTo(sourceX + width * .14, laneY);
          p.bezierCurveTo(left + width * .33, laneY, cubeLeft - width * .08, targetY, cubeLeft, targetY);
        }, `${colors[index]}3d`, index === 2 ? 1.15 : .8, l.mobile ? 0 : 3);
        const phase = now * .00013 + index * .19;
        const startX = sourceX + width * .14;
        const endX = cubeLeft;
        const t = ((phase % 1) + 1) % 1;
        const eased = t * t * (3 - 2 * t);
        const x = startX + (endX - startX) * eased;
        const y = laneY + (targetY - laneY) * eased * eased;
        this.dot(x, y, l.mobile ? 1.05 : 1.55, colors[index], l.mobile ? 3 : 7);
      });

      const glow = ctx.createRadialGradient(cubeX, centerY, 0, cubeX, centerY, cubeSize * 1.2);
      glow.addColorStop(0, "rgba(191,247,255,.13)");
      glow.addColorStop(.42, "rgba(115,255,197,.045)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cubeX - cubeSize * 1.2, centerY - cubeSize * 1.2, cubeSize * 2.4, cubeSize * 2.4);

      ctx.save();
      ctx.translate(cubeX, centerY);
      const outer = cubeSize;
      const inner = cubeSize * .55;
      ctx.fillStyle = "rgba(191,247,255,.025)";
      ctx.strokeStyle = "rgba(191,247,255,.62)";
      ctx.lineWidth = 1.1;
      ctx.fillRect(-outer / 2, -outer / 2, outer, outer);
      ctx.strokeRect(-outer / 2, -outer / 2, outer, outer);
      ctx.strokeStyle = "rgba(115,255,197,.52)";
      ctx.strokeRect(-inner / 2, -inner / 2, inner, inner);
      const corners = [
        [-1, -1], [1, -1], [1, 1], [-1, 1]
      ];
      corners.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(sx * outer / 2, sy * outer / 2);
        ctx.lineTo(sx * inner / 2, sy * inner / 2);
        ctx.stroke();
      });
      for (let layer = 1; layer <= 3; layer += 1) {
        const size = inner * (1 - layer * .19);
        ctx.strokeStyle = `rgba(194,170,255,${.34 - layer * .055})`;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
      }
      ctx.strokeStyle = "rgba(191,247,255,.72)";
      ctx.lineWidth = .8;
      for (let ray = 0; ray < 6; ray += 1) {
        const angle = ray * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * cubeSize * .055, Math.sin(angle) * cubeSize * .055);
        ctx.lineTo(Math.cos(angle) * cubeSize * .19, Math.sin(angle) * cubeSize * .19);
        ctx.stroke();
      }
      ctx.restore();

      this.text("FROST-GKR", cubeX, centerY + cubeSize * .68, "rgba(191,247,255,.82)", labelSize * 1.05);
      this.text(canvasText("oneBinaryField", "ONE BINARY FIELD"), cubeX, centerY - cubeSize * .68, "rgba(115,255,197,.62)", labelSize * .82);
      this.line([[cubeX + cubeSize / 2, centerY], [outputX, centerY]], "rgba(191,247,255,.38)", 1.2, l.mobile ? 0 : 6);
      for (let packet = 0; packet < 3; packet += 1) {
        this.packetAlong(cubeX + cubeSize / 2, centerY, outputX, centerY, now * .00017 + packet / 3, packet === 1 ? "#c2aaff" : "#bff7ff", l.mobile ? 1.1 : 1.6);
      }
      this.node(outputX, centerY, l.mobile ? 13 : 18, "π", "#bff7ff", now);
      this.text(canvasText("oneProofStack", "ONE PROOF STACK"), outputX, centerY + (l.mobile ? 24 : 31), "rgba(191,247,255,.65)", labelSize * .78);
      const footerY = l.mobile ? this.h * .92 : Math.min(stageBottom - labelSize * 2.4, centerY + laneSpan * .66);
      this.text(canvasText("noTrustedSetup", "NO TRUSTED SETUP"), (left + right) / 2, footerY, "rgba(194,170,255,.52)", labelSize * .84);
    }

    drawPow(now) {
      const l = this.layout();
      const blockX = l.mobile ? this.w * .32 : this.w * (l.compact ? .67 : .60);
      const nonceX = l.mobile ? this.w * .76 : this.w * (l.compact ? .88 : .84);
      const y = this.h * .48;
      const size = l.mobile ? 78 : 108;
      const ctx = this.ctx;
      const cold = ctx.createLinearGradient(blockX - size / 2, y - size / 2, blockX + size / 2, y + size / 2);
      cold.addColorStop(0, "rgba(191,247,255,.03)");
      cold.addColorStop(.5, "rgba(191,247,255,.15)");
      cold.addColorStop(1, "rgba(194,170,255,.035)");
      this.roundedRect(blockX - size / 2, y - size / 2, size, size, 12, "rgba(191,247,255,.62)", cold, 1.2);
      for (let i = 1; i < 4; i += 1) {
        this.line([[blockX - size / 2, y - size / 2 + i * size / 4], [blockX + size / 2, y - size / 2 + i * size / 4]], "rgba(191,247,255,.13)", .7);
        this.line([[blockX - size / 2 + i * size / 4, y - size / 2], [blockX - size / 2 + i * size / 4, y + size / 2]], "rgba(191,247,255,.13)", .7);
      }
      const scanY = y - size / 2 + ((now * .00012) % 1) * size;
      this.line([[blockX - size / 2, scanY], [blockX + size / 2, scanY]], "rgba(191,247,255,.65)", 1.3, 9);
      this.text(canvasText("proven", "PROVEN"), blockX, y - 10, "rgba(191,247,255,.65)", 8);
      this.text(canvasText("template", "TEMPLATE"), blockX, y + 9, "#bff7ff", 10);
      this.line([[blockX + size / 2, y], [nonceX - 31, y]], "rgba(191,247,255,.25)", 1);
      this.node(nonceX, y, l.mobile ? 25 : 34, "128", "#73ffc5", now);
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.save();
        ctx.beginPath();
        const start = now * .0015 + ring * 2.1;
        ctx.arc(nonceX, y, (l.mobile ? 38 : 49) + ring * 9, start, start + .72);
        ctx.strokeStyle = `rgba(115,255,197,${.5 - ring * .12})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
      this.text(canvasText("nonceOnly", "NONCE ONLY"), nonceX, y + (l.mobile ? 64 : 82), "rgba(115,255,197,.58)", 8);
      this.text(canvasText("asert", "15 s ASERT"), (blockX + nonceX) / 2, this.h * .78, "rgba(239,255,248,.48)", 8);
    }

    drawLaptop(x, y, width, color = "#73ffc5") {
      const height = width * .62;
      this.roundedRect(x - width / 2, y - height / 2, width, height, 8, `${color}aa`, "rgba(6,24,19,.64)", 1.2);
      this.roundedRect(x - width * .4, y - height * .39, width * .8, height * .7, 4, `${color}55`, "rgba(115,255,197,.025)", .8);
      this.line([[x - width * .62, y + height / 2 + 5], [x + width * .62, y + height / 2 + 5]], `${color}66`, 2);
      this.text("O(1)", x, y, color, Math.max(6.5, width * .1));
    }

    drawJoin(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const left = l.mobile ? this.w * .075 : this.w * (l.compact ? .585 : .485);
      const right = l.mobile ? this.w * .925 : this.w * (l.compact ? .925 : .91);
      const width = right - left;
      const y = this.h * .50;
      const span = this.h * (l.mobile ? .27 : .145);
      const verifierX = left + width * (l.mobile ? .60 : .59);
      const laptopX = left + width * .90;
      const laptopWidth = l.mobile ? Math.min(48, width * .17) : Math.min(88, width * .15);
      const gateSize = l.mobile ? Math.min(42, this.h * .29) : Math.min(66, this.h * .095);
      const inputRadius = l.mobile ? Math.min(10, this.h * .067) : 16;
      const labelSize = l.mobile ? 5.4 : 7.4;
      const inputs = [
        { y: y - span, label: canvasText("liveState", "LIVE STATE"), symbol: "S", color: "#73ffc5" },
        { y, label: "π_tip", color: "#c2aaff" },
        { y: y + span, label: canvasText("blocks18", "18 BLOCKS"), symbol: "18", color: "#bff7ff" }
      ];

      const inputHeaderY = Math.max(labelSize, y - span - inputRadius - (l.mobile ? 15 : 24));
      this.text(canvasText("peerData", "DATA FROM ANY PEER"), left, inputHeaderY, "rgba(255,149,125,.68)", labelSize, "left");

      const bezierPoint = (x1, y1, x2, y2, t) => {
        const controlX = x1 + (x2 - x1) * .58;
        const inverse = 1 - t;
        return {
          x: inverse * inverse * x1 + 2 * inverse * t * controlX + t * t * x2,
          y: inverse * inverse * y1 + 2 * inverse * t * y1 + t * t * y2
        };
      };

      inputs.forEach((input, i) => {
        const symbol = input.symbol || "π";
        this.node(left, input.y, inputRadius, symbol, input.color, now);
        this.path((p) => {
          p.moveTo(left + inputRadius, input.y);
          p.quadraticCurveTo(left + (verifierX - left) * .58, input.y, verifierX - gateSize * .56, y);
        }, `${input.color}42`, 1, l.mobile ? 0 : 3);
        this.text(input.label, left + inputRadius + (l.mobile ? 6 : 10), input.y, `${input.color}a8`, labelSize, "left");

        const phase = (now * .00014 + i * .29) % 1;
        const eased = phase * phase * (3 - 2 * phase);
        const packet = bezierPoint(left + inputRadius, input.y, verifierX - gateSize * .56, y, eased);
        this.dot(packet.x, packet.y, l.mobile ? 1.15 : 1.7, input.color, l.mobile ? 4 : 8);
      });

      const gatePulse = .5 + .5 * Math.sin(now * .0022);
      this.line(
        [[verifierX, y - gateSize * .92], [verifierX, y + gateSize * .92]],
        `rgba(115,255,197,${.20 + gatePulse * .10})`,
        1
      );
      this.roundedRect(
        verifierX - gateSize / 2,
        y - gateSize / 2,
        gateSize,
        gateSize,
        gateSize * .20,
        `rgba(115,255,197,${.60 + gatePulse * .22})`,
        "rgba(6,25,20,.86)",
        1.15
      );
      this.roundedRect(
        verifierX - gateSize * .36,
        y - gateSize * .36,
        gateSize * .72,
        gateSize * .72,
        gateSize * .14,
        "rgba(115,255,197,.20)",
        "rgba(115,255,197,.035)",
        .7
      );
      this.text("✓", verifierX, y - gateSize * .08, "#73ffc5", l.mobile ? 10 : 14);
      this.text(canvasText("verifyLocally", "VERIFY LOCALLY"), verifierX, y + gateSize * .18, "rgba(115,255,197,.72)", l.mobile ? 4.3 : 6.2);

      const outputStart = verifierX + gateSize * .52;
      const outputEnd = laptopX - laptopWidth * .58;
      this.line([[outputStart, y], [outputEnd, y]], "rgba(115,255,197,.34)", 1.1, l.mobile ? 0 : 5);
      for (let packet = 0; packet < 3; packet += 1) {
        this.packetAlong(outputStart, y, outputEnd, y, now * .00016 + packet / 3, "#73ffc5", l.mobile ? 1.15 : 1.7);
      }
      this.text(canvasText("authenticated", "AUTHENTICATED"), (outputStart + outputEnd) / 2, y - (l.mobile ? 9 : 15), "rgba(115,255,197,.58)", l.mobile ? 4.5 : 6.5);

      this.drawLaptop(laptopX, y, laptopWidth);
      this.dot(laptopX, y, l.mobile ? 1.5 : 2.2, "#73ffc5", l.mobile ? 5 : 10);
      this.text(canvasText("independentFullNode", "INDEPENDENT FULL NODE"), laptopX, y + laptopWidth * .48, "rgba(115,255,197,.72)", labelSize);

      const timelineY = y + span + inputRadius + (l.mobile ? 14 : 27);
      this.line([[left, timelineY], [right, timelineY]], "rgba(191,247,255,.13)", .7);
      this.text(canvasText("sameProcedure", "SAME PROCEDURE · YEAR 1 → YEAR 10"), (left + right) / 2, timelineY + (l.mobile ? 6 : 10), "rgba(191,247,255,.46)", l.mobile ? 4.6 : 6.8);
    }

    drawNode(now) {
      const l = this.layout();
      const specs = l.mobile
        ? [
            [.12, .30, .86], [.38, .20, .96], [.67, .27, .90], [.88, .42, .92],
            [.20, .61, 1.00], [.51, .51, .88], [.80, .68, .94], [.43, .76, .96]
          ]
        : l.compact
          ? [
              [.59, .34, .82], [.70, .25, .90], [.82, .33, .84], [.92, .48, .92],
              [.62, .59, .96], [.75, .51, .82], [.87, .66, .88], [.71, .73, .90]
            ]
          : [
              [.50, .34, .90], [.65, .25, 1.00], [.80, .33, .92], [.90, .48, 1.02],
              [.54, .59, 1.06], [.70, .51, .90], [.84, .66, .96], [.66, .73, 1.00]
            ];
      const baseWidth = l.mobile ? 42 : 58;
      const colors = ["#73ffc5", "#bff7ff", "#c2aaff", "#73ffc5", "#bff7ff", "#73ffc5", "#c2aaff", "#73ffc5"];
      const points = specs.map(([x, y, scale], index) => ({
        x: this.w * x,
        y: this.h * y + Math.sin(now * .00042 + index * 1.73) * (l.mobile ? 1.2 : 2.1),
        width: baseWidth * scale,
        color: colors[index]
      }));
      const edges = [
        [0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [1, 4], [1, 5],
        [2, 5], [2, 3], [3, 6], [4, 5], [4, 7], [5, 6], [5, 7], [6, 7]
      ];

      const ctx = this.ctx;
      const glowX = l.mobile ? this.w * .51 : this.w * (l.compact ? .77 : .71);
      const glowY = this.h * .48;
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, l.mobile ? this.w * .48 : this.w * .27);
      glow.addColorStop(0, "rgba(115,255,197,.055)");
      glow.addColorStop(.55, "rgba(115,255,197,.018)");
      glow.addColorStop(1, "rgba(115,255,197,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.w, this.h);

      edges.forEach(([from, to], index) => {
        const a = points[from];
        const b = points[to];
        const color = colors[index % colors.length];
        const breathe = .11 + (.5 + .5 * Math.sin(now * .001 + index)) * .07;
        this.line([[a.x, a.y], [b.x, b.y]], `rgba(115,255,197,${breathe})`, index % 4 === 0 ? 1.1 : .8);
        this.packetAlong(a.x, a.y, b.x, b.y, now * .00018 + index * .137, color, l.mobile ? 1.25 : 1.7);
        if (index % 4 === 1) {
          this.packetAlong(b.x, b.y, a.x, a.y, now * .000135 + index * .193, "#bff7ff", l.mobile ? 1 : 1.35);
        }
      });

      points.forEach((point, index) => {
        const pulse = .5 + .5 * Math.sin(now * .0014 + index * 1.31);
        this.dot(point.x, point.y, 1.3 + pulse * .8, point.color, l.mobile ? 7 : 10);
        this.drawLaptop(point.x, point.y, point.width, point.color);
      });

    }
  }

  scene = new StateScene(document.querySelector("#state-scene"));
  applyLanguage(language, false);
  goTo(current, { instant: true });
})();
