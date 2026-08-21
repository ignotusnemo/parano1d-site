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
  let viewportSettleFrame = 0;

  // The core repository is public. GitHub links navigate directly.
  const PRIVATE_REPOSITORY_GATE = false;
  let repositoryGateLastFocus = null;
  let repositoryGateCloseTimer = 0;
  let repositoryGateAddedAppInert = false;
  let repositoryGateAddedDownloadsInert = false;

  const launchNoticeStorageKey = "parano1d-mainnet-live-dismissed";
  const downloadsReleaseTag = "v1.0.0";
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
    repositoryGateAddedAppInert = !app.hasAttribute("inert");
    repositoryGateAddedDownloadsInert = Boolean(downloadsModal && !downloadsModal.hidden && !downloadsModal.hasAttribute("inert"));
    if (repositoryGateAddedAppInert) app.setAttribute("inert", "");
    if (repositoryGateAddedDownloadsInert) downloadsModal.setAttribute("inert", "");
    repositoryGate.hidden = false;
    document.body.classList.add("repository-gate-open");
    scene?.syncPlayback();
    requestAnimationFrame(() => {
      repositoryGate.classList.add("is-open");
      repositoryGateClose?.focus({ preventScroll: true });
    });
  }

  function closeRepositoryGate() {
    if (!repositoryGate || repositoryGate.hidden) return;
    repositoryGate.classList.remove("is-open");
    document.body.classList.remove("repository-gate-open");
    if (repositoryGateAddedAppInert) app.removeAttribute("inert");
    if (repositoryGateAddedDownloadsInert) downloadsModal?.removeAttribute("inert");
    repositoryGateAddedAppInert = false;
    repositoryGateAddedDownloadsInert = false;
    repositoryGateCloseTimer = window.setTimeout(() => {
      repositoryGate.hidden = true;
      scene?.syncPlayback();
    }, 220);
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

  function mobileSceneAnchor(chapter) {
    const inner = chapter?.querySelector(".chapter-inner");
    if (!inner) return null;
    const candidates = [...inner.children];
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      const candidate = candidates[index];
      const style = getComputedStyle(candidate);
      if (style.display !== "none" && style.visibility !== "hidden" && candidate.getBoundingClientRect().height > 0) {
        return candidate;
      }
    }
    return inner;
  }

  function applyMobileSceneLayout() {
    chapters.forEach((chapter) => chapter.classList.remove("mobile-copy-compact"));
    if (
      window.innerWidth > 820 ||
      !controlDeck ||
      !sceneElement ||
      getComputedStyle(sceneElement).display === "none"
    ) {
      app.style.removeProperty("--mobile-scene-top");
      app.style.removeProperty("--mobile-scene-bottom");
      return;
    }

    const appRect = app.getBoundingClientRect();
    const deckRect = controlDeck.getBoundingClientRect();
    const deckTop = deckRect.top - appRect.top;
    const sceneBottomInset = appRect.height - deckTop + 2;
    app.style.setProperty("--mobile-scene-bottom", `${Math.max(0, Math.round(sceneBottomInset))}px`);
    const activeStep = Math.max(0, Math.min(chapters.length - 1, Number(app.dataset.currentStep || 0)));
    const activeChapter = chapters[activeStep];
    let anchor = activeStep === 0 ? overviewFacts : mobileSceneAnchor(activeChapter);
    if (!anchor) return;

    const transitionOffset = activeChapterTranslateY(activeChapter);
    let contentBottom = anchor.getBoundingClientRect().bottom - appRect.top - transitionOffset;
    if (activeStep === 0) {
      const minimumSceneHeight = Math.min(190, Math.max(150, appRect.height * .25));
      const sceneTop = Math.min(contentBottom + 5, deckTop - minimumSceneHeight);
      app.style.setProperty("--mobile-scene-top", `${Math.max(0, Math.round(sceneTop))}px`);
      return;
    }

    const sceneBottom = sceneElement.getBoundingClientRect().bottom - appRect.top;
    const gap = Math.min(8, Math.max(4, appRect.height * .009));
    const preferredSceneHeight = Math.min(180, Math.max(120, appRect.height * .20));
    if (sceneBottom - (contentBottom + gap) < preferredSceneHeight && activeChapter.querySelector(".lead")) {
      activeChapter.classList.add("mobile-copy-compact");
      anchor = mobileSceneAnchor(activeChapter);
      if (anchor) contentBottom = anchor.getBoundingClientRect().bottom - appRect.top - transitionOffset;
    }
    const minimumVisibleHeight = Math.min(80, Math.max(72, appRect.height * .10));
    const naturalSceneTop = contentBottom + gap;
    const sceneTop = sceneBottom - naturalSceneTop < minimumVisibleHeight
      ? sceneBottom
      : naturalSceneTop;
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
    cancelAnimationFrame(viewportSettleFrame);
    viewportSettleFrame = requestAnimationFrame(() => {
      viewportSettleFrame = requestAnimationFrame(() => {
        viewportSettleFrame = 0;
        const settledHeight = Math.round(window.visualViewport?.height || window.innerHeight);
        document.documentElement.style.setProperty("--app-height", `${settledHeight}px`);
        syncMobileSceneLayouts({ immediate: true });
      });
    });
  }

  syncViewportHeight();
  window.addEventListener("resize", syncViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportHeight, { passive: true });

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
      "announcement.copyAction": "— скопировать адрес электронной почты",
      "nav.language": "Язык",
      "nav.menu": "Меню",
      "nav.downloads": "Загрузки",
      "nav.docs": "Документация",
      "nav.discuss": "Обсудить",
      "repositoryGate.dialog": "Доступ к исходному коду Parano1d",
      "repositoryGate.close": "Закрыть сообщение",
      "repositoryGate.eyebrow": "Исходный код",
      "repositoryGate.title": "Код откроется перед запуском.",
      "repositoryGate.copy": "Основной репозиторий остаётся закрытым на финальном этапе подготовки. Код будущего релиза будет опубликован перед запуском публичной сети.",
      "repositoryGate.launch": "Запуск публичной сети · 12 августа 2026",
      "repositoryGate.contact": "Связаться с разработчиком",
      "repositoryGate.github": "GitHub",
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
      "downloads.core.builds": "Архивы Core-инструментов",
      "downloads.integrity.title": "Проверяйте каждый файл.",
      "downloads.integrity.copy": "Вместе с установщиками и архивами каждого релиза публикуются контрольные суммы SHA-256.",
      "readout.state": "состояние",
      "readout.history": "история",
      "readout.verify": "проверка",
      "overview.index": "Сеть не повторяет исполнение. Она проверяет.",
      "overview.title": "Proof-native<br><em>Layer 1</em>",
      "overview.security": "Proof of work задаёт канонический порядок. Сквозная постквантовая безопасность доказана на уровне NIST Category 1.",
      "overview.enter": "ПОЧЕМУ? <span>→</span>",
      "overview.fact.sync.value": "ПРОВЕРКА ЗА O(1)",
      "overview.fact.sync.copy": "без повтора с генезиса",
      "overview.fact.signatureless.value": "БЕЗ ПОДПИСЕЙ",
      "overview.fact.signatureless.copy": "владение доказано, а не подписано",
      "overview.fact.pow.value": "СОСТОЯНИЕ",
      "overview.fact.pow.copy": "потраченные выходы освобождают место",
      "dependency.index": "01 / ЗАВИСИМОСТЬ",
      "dependency.title": "Настоящее зависит<br><em>от накопленной истории.</em>",
      "dependency.lead": "Bitcoin, Ethereum, Solana, Zcash, TRON и большинство других блокчейнов определяют текущее состояние по накопленной истории. Одни воспроизводят её напрямую, другие ускоряют первоначальную синхронизацию с помощью снимков состояния или контрольных точек. В любом случае новая нода либо сама восстанавливает путь к текущему состоянию, либо принимает готовую точку отсчёта из снимка состояния или контрольной точки.",
      "dependency.row1.label": "Основа проверки",
      "dependency.row1.value": "<strong>Накопленная история цепочки</strong>",
      "dependency.row2.label": "Новая нода",
      "dependency.row2.value": "Повторяет историю или начинает со снимка состояния либо контрольной точки",
      "present.index": "02 / ИНВЕРСИЯ",
      "present.title": "Настоящее<br>доказывает <em>прошлое.</em>",
      "present.lead": "Parano1d отделяет проверку состояния от повторного исполнения истории. Корректность текущего набора UTXO подтверждает рекурсивное доказательство, охватывающее всю цепочку от генезиса до настоящего момента. Потраченные выходы освобождают слоты, поэтому объём хранения зависит от числа текущих UTXO, а не от возраста цепочки.",
      "present.row1.label": "Рост состояния",
      "present.row1.value": "<strong>Зависит от числа текущих UTXO, а не от всех прошлых транзакций</strong>",
      "present.row2.label": "Потраченные выходы",
      "present.row2.value": "Освобождают слоты, которые можно использовать снова",
      "present.row3.label": "Возраст цепочки",
      "present.row3.value": "Не создаёт накопленной нагрузки при подключении новой ноды",
      "proof.index": "04 / СМЕНА ПАРАДИГМЫ",
      "proof.title": "Доказывай там,<br><em>где уже есть данные.</em>",
      "proof.lead": "В Parano1d доказательство строит тот, у кого уже есть нужные данные. Сеть получает готовый результат, который можно проверить, и не повторяет исходные вычисления.",
      "proof.wallet.label": "Кошелёк",
      "proof.wallet.copy": "Доказывает право потратить средства, не раскрывая секрет.",
      "proof.miner.label": "Майнер",
      "proof.miner.copy": "Доказывает логику транзакций и точный переход состояния.",
      "proof.network.label": "Сеть",
      "proof.network.copy": "Проверяет оба доказательства и PoW, затем применяет подтверждённые изменения.",
      "living.index": "05 / ТЕКУЩЕЕ СОСТОЯНИЕ UTXO",
      "living.title": "Состояние растёт<br>с числом UTXO.<br><em>Не с возрастом сети.</em>",
      "living.lead": "При расходовании UTXO его слот очищается. Перед расширением аллокатор заполняет свободные позиции. Если в сегменте не остаётся ни одного UTXO, такой сегмент снова становится виртуальным.",
      "living.spend.label": "Расходование",
      "living.spend.value": "Освобождает слот потраченного UTXO",
      "living.reuse.label": "Повторное использование",
      "living.reuse.value": "Новый <code>creation_id</code> записывается в свободный слот",
      "living.expand.label": "Расширение",
      "living.expand.value": "При заполнении 75% подключается каноническая пустая половина без остановки сети",
      "ownership.index": "06 / ВЛАДЕНИЕ БЕЗ ПОДПИСЕЙ",
      "ownership.title": "Одного секрета достаточно.<br>Без пары ключей.<br><em>Без подписи.</em>",
      "ownership.lead": "Адрес Parano1d выводится из 256 бит секретной энтропии. Пары открытого и закрытого ключей здесь нет. При каждой трате кошелёк доказывает знание секрета, не раскрывая его, и создаёт новое доказательство с нулевым разглашением, связанное со всей транзакцией.",
      "ownership.secret": "секрет расходования",
      "ownership.address": "адрес o1…",
      "ownership.protocol.label": "Протокол",
      "ownership.protocol.value": "256 бит секрета · без криптосистемы с открытым ключом",
      "ownership.wire.label": "В транзакции",
      "ownership.wire.value": "Нет ни открытого ключа, ни цифровой подписи",
      "ownership.consensus.label": "Владение",
      "ownership.consensus.value": "<strong>Доказывается знанием секрета с нулевым разглашением</strong>",
      "photo.index": "07 / КЛЮЧ ИЗ ФОТОГРАФИИ",
      "photo.title": "Любое фото<br>может стать<br><em>мастер-секретом.</em>",
      "photo.lead": "Кошелёк Parano1d может создать новый мастер-секрет, импортировать существующий или получить его из приватного изображения. Photo Key считывает изображение локально, никуда его не загружает и не сохраняет копию. Те же декодированные пиксели восстанавливают тот же 256-битный секрет и все выведенные из него адреса. Измените пиксели — получите другой кошелёк.",
      "photo.download": "Загрузить кошелёк",
      "paged.index": "08 / PAGEDSPEND",
      "paged.title": "До 1 020 UTXO.<br><em>Одна транзакция.</em>",
      "paged.lead": "Физическая страница <code>Tx8x2</code> вмещает до восьми входов и двух выходов. <code>PagedSpend</code> объединяет до 128 таких страниц в одну логическую транзакцию. Она атомарно тратит до 1 020 UTXO и создаёт до 256 выходов. При этом у неё один txid, одна комиссия, одна капсула авторизации и один чек.",
      "history.index": "09 / РЕКУРСИВНАЯ ИСТОРИЯ",
      "history.title": "История растёт.<br><em>Размер proof не меняется.</em>",
      "history.lead": "Каждый <code>HistoryStep</code> одновременно доказывает новый блок и проверяет терминальное доказательство предыдущего шага. С каждым блоком терминальное доказательство обновляется, но его размер и объём работы при проверке не зависят от высоты цепочки.",
      "history.active.label": "Активная нода",
      "history.active.value": "Текущее состояние + терминальное доказательство + последние 18 полных блоков",
      "history.age.label": "Возраст цепочки",
      "history.age.value": "<strong>Не влияет на размер доказательства и стоимость проверки истории</strong>",
      "privacy.index": "10 / ПРИВАТНОСТЬ БЕЗ ПОСТОЯННОГО АРХИВА",
      "privacy.title": "Приватность<br><em>без секретов.</em>",
      "privacy.lead": "Пока транзакции проходят через консенсус, Parano1d полностью прозрачен: видны суммы, владельцы и сами транзакции. Но консенсус не сохраняет постоянный граф транзакций. Чтобы отслеживать адреса годами, внешний наблюдатель должен непрерывно записывать поток и самостоятельно хранить собранные данные.",
      "privacy.live.label": "Текущее состояние",
      "privacy.live.value": "Публичные суммы · публичные владельцы",
      "privacy.graph.label": "Граф прошлых транзакций",
      "privacy.graph.value": "<strong>Консенсус его не сохраняет</strong>",
      "privacy.tracker.label": "Долгосрочное наблюдение",
      "privacy.tracker.value": "Требует непрерывной внешней записи",
      "receipts.index": "11 / Переносимое доказательство платежа",
      "receipts.title": "История исчезает.<br><em>Чек остаётся.</em>",
      "receipts.lead": "После подтверждения платежа кошелёк отправителя сохраняет экспортируемый Merkle-чек. В нём находятся все публичные данные платежа и путь включения фиксированной глубины. Любая нода проверяет его по каноническому заголовку. Старое тело блока не требуется.",
      "receipts.formula.payment": "платёж",
      "receipts.formula.receipt": "переносимый чек",
      "receipts.formula.verify": "проверено ✓",
      "receipts.auth.label": "Подтверждает",
      "receipts.auth.value": "txid · получателей · суммы · комиссию · время блока",
      "receipts.path.label": "Merkle-путь",
      "receipts.path.value": "Восемь уровней Poseidon2b",
      "receipts.body.label": "Старое тело блока",
      "receipts.body.value": "<strong>Не требуется</strong>",
      "stack.index": "12 / Единый бинарный proof stack",
      "stack.title": "Одна арифметика.<br><em>От начала до конца.</em>",
      "stack.lead": "Адреса, авторизация кошелька, транзакции, state, рекурсивная история и PoW используют один бинарный proof stack. FROST-GKR сворачивает повторяющиеся структуры Poseidon2b в общие булевы гиперкубы, а FRI-Binius замыкает relation без доверенной настройки.",
      "stack.formula.left": "владение + tx",
      "stack.formula.right": "state + история + PoW",
      "stack.field.label": "Поля",
      "stack.field.value": "<span class=\"nowrap\">Трассы: <code>GF(2^128)</code></span> · <span class=\"nowrap\">Вызовы Fiat Shamir: <code>GF(2^256)</code></span>",
      "stack.prover.label": "Prover",
      "stack.prover.value": "<strong>В 10,50 раза быстрее</strong> в сравнении на 59 перестановках",
      "stack.proof.label": "Алгебраический proof",
      "stack.proof.value": "<strong>В 51,67 раза меньше</strong>",
      "soundness.index": "13 / СКВОЗНАЯ ПОСТКВАНТОВАЯ БЕЗОПАСНОСТЬ",
      "soundness.title": "Post-quantum.<br><em>Provable from genesis.</em>",
      "soundness.lead": "Одна теорема охватывает авторизацию кошелька, корректность транзакций, точные переходы состояния, рекурсивную цепочку HistoryStep и конечное состояние, которое принимает нода.",
      "soundness.result.label": "Результат",
      "soundness.result.value": "<strong>NIST PQC Category 1</strong>",
      "soundness.floor.label": "Граница успеха 1/2",
      "soundness.floor.value": "<strong><code>2^173.273866314232</code></strong>",
      "soundness.bound.label": "Полная идеальная оценка",
      "soundness.bound.value": "<strong><code>0.053364140323608411 &lt; 1/2</code></strong>",
      "soundness.proof": "Доказательство",
      "soundness.certificate": "Исполняемый сертификат",
      "pow.index": "14 / Proof-native PoW",
      "pow.title": "Сначала докажи.<br><em>Потом майни.</em>",
      "pow.lead": "PoW только определяет порядок уже доказанных переходов. Майнер завершает не зависящее от nonce доказательство блока, фиксирует неизменяемый шаблон и перебирает лишь 128-битный nonce.",
      "pow.target.label": "Цель блока",
      "pow.target.value": "<strong>В среднем 20 секунд</strong> · сложность ASERT",
      "pow.role.label": "Роль PoW",
      "pow.role.value": "<strong>Канонический порядок доказанных переходов</strong>",
      "pow.boundary.label": "Граница доказательства",
      "pow.boundary.value": "<strong>Не может подделать владение или принять некорректный state</strong>",
      "join.index": "03 / НЕЗАВИСИМАЯ СИНХРОНИЗАЦИЯ",
      "join.title": "Доказательство<br><em>вместо доверия<br>к пирам.</em>",
      "join.lead": "Пиры передают данные, но не решают, каким данным верить. Нода получает текущее состояние UTXO, соответствующее терминальное доказательство и суффикс из последних 18 блоков. Она сама проверяет данные, после чего подключается к сети как независимая полная нода. Порядок действий не меняется ни через год, ни через десять лет.",
      "join.formula.state": "текущее состояние",
      "join.formula.proof": "терминальное доказательство",
      "join.formula.suffix": "18 блоков",
      "join.formula.node": "независимая нода ✓",
      "run.index": "15 / Децентрализация на любом железе",
      "run.title": "Вся L1.<br><em>На твоём ноутбуке.</em>",
      "run.lead": "Обычный ноутбук может хранить всё текущее состояние и самостоятельно проверять всю L1. Майнер выбирает ёмкость блока, которую успевает доказать на своём железе: более быстрая машина справляется с крупными блоками, более медленная выбирает меньшие. Пропускная способность подстраивается под железо, а полная проверка остаётся доступной каждой ноде.",
      "run.capacity.modest": "Твой ноутбук",
      "run.capacity.modest.value": "ниже TPS",
      "run.capacity.fast": "Более быстрое железо",
      "run.capacity.fast.value": "выше TPS",
      "run.capacity.network": "Сеть",
      "run.capacity.network.value": "продолжает работать",
      "run.download": "Загрузить кошелёк",
      "rail.label": "Разделы Parano1d",
      "rail.0": "Обзор Parano1d",
      "rail.1": "Зависимость",
      "rail.2": "Инверсия",
      "rail.3": "Независимая синхронизация",
      "rail.4": "Proof-native архитектура",
      "rail.5": "Текущее состояние UTXO",
      "rail.6": "Владение без подписей",
      "rail.7": "Ключ из фотографии",
      "rail.8": "PagedSpend",
      "rail.9": "Рекурсивная история",
      "rail.10": "Без постоянного архива",
      "rail.11": "Переносимые чеки",
      "rail.12": "Единый бинарный proof stack",
      "rail.13": "Сквозная постквантовая безопасность",
      "rail.14": "Proof-native PoW",
      "rail.15": "Децентрализация на любом железе",
      "deck.previous": "Предыдущее состояние"
    },
    zh: {
      "brand.home": "ParanO(1)d 首页",
      "announcement.copyAction": "— 复制邮箱地址",
      "nav.language": "语言",
      "nav.menu": "菜单",
      "nav.downloads": "下载",
      "nav.docs": "文档",
      "nav.discuss": "讨论",
      "repositoryGate.dialog": "Parano1d 源代码访问说明",
      "repositoryGate.close": "关闭提示",
      "repositoryGate.eyebrow": "源代码",
      "repositoryGate.title": "代码将在网络启动前公开。",
      "repositoryGate.copy": "核心代码仓库将在最终准备阶段保持私有。即将发布版本的代码将在公共网络启动前公开。",
      "repositoryGate.launch": "公共网络启动 · 2026 年 8 月 12 日",
      "repositoryGate.contact": "联系开发者",
      "repositoryGate.github": "GitHub",
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
      "downloads.core.builds": "Core 工具归档包",
      "downloads.integrity.title": "请校验每个文件。",
      "downloads.integrity.copy": "每个版本都会随安装包和归档包一并发布 SHA-256 校验和。",
      "readout.state": "状态",
      "readout.history": "历史",
      "readout.verify": "验证",
      "overview.index": "网络不重复执行，只验证证明。",
      "overview.title": "证明原生<br><em>Layer 1</em>",
      "overview.security": "工作量证明确定规范顺序。端到端后量子可靠性已证明达到 NIST Category 1 水平。",
      "overview.enter": "为什么？ <span>→</span>",
      "overview.fact.sync.value": "O(1) 验证",
      "overview.fact.sync.copy": "无需从创世块重放",
      "overview.fact.signatureless.value": "无签名",
      "overview.fact.signatureless.copy": "所有权由证明建立，而非签名",
      "overview.fact.pow.value": "实时状态",
      "overview.fact.pow.copy": "已花费输出释放容量",
      "dependency.index": "01 / 历史依赖",
      "dependency.title": "当前状态依赖<br><em>不断累积的历史。</em>",
      "dependency.lead": "Bitcoin、Ethereum、Solana、Zcash、TRON 以及大多数其他区块链，都需要根据不断累积的历史来确定当前状态。有些直接重放历史，有些借助状态快照或检查点来缩短初始同步。无论采用哪种方式，新验证节点都必须自行重建当前状态的来路，或从状态快照或检查点继承已有的验证路径。",
      "dependency.row1.label": "有效性依据",
      "dependency.row1.value": "<strong>不断累积的链历史</strong>",
      "dependency.row2.label": "新验证节点",
      "dependency.row2.value": "重放历史，或从状态快照或检查点开始验证",
      "present.index": "02 / 逻辑反转",
      "present.title": "当前状态<br>证明<em>过去。</em>",
      "present.lead": "Parano1d 将状态有效性与历史重放分离。当前 UTXO 状态的有效性由一份从创世块递归延伸至今的证明保证。UTXO 一旦花费，对应槽位便可释放，因此存储规模取决于当前仍然存在的 UTXO，而不是链龄。",
      "present.row1.label": "状态增长",
      "present.row1.value": "<strong>取决于当前 UTXO 数量，而不是历史交易总量</strong>",
      "present.row2.label": "已花费输出",
      "present.row2.value": "清空槽位，之后可再次使用",
      "present.row3.label": "链龄",
      "present.row3.value": "不会让新节点背上越来越重的历史重放负担",
      "proof.index": "04 / 证明方式的改变",
      "proof.title": "数据在哪里，<br><em>就在哪里证明。</em>",
      "proof.lead": "在 Parano1d 中，谁掌握证明所需的信息，谁就在本地生成证明。网络只接收可验证的结果，不再重复同一套计算。",
      "proof.wallet.label": "钱包",
      "proof.wallet.copy": "证明自己有权花费，但不泄露花费秘密。",
      "proof.miner.label": "矿工",
      "proof.miner.copy": "证明交易逻辑和准确的状态转移。",
      "proof.network.label": "网络",
      "proof.network.copy": "验证两份证明和 PoW，再应用证明中确认的状态变更。",
      "living.index": "05 / 当前 UTXO 状态",
      "living.title": "状态规模取决于<br>当前 UTXO。<br><em>不取决于链龄。</em>",
      "living.lead": "UTXO 花费后，对应槽位立即清空。分配器会先利用空位，只有不够时才扩展状态。某个分段内不再有 UTXO 时，它会重新变成虚拟分段。",
      "living.spend.label": "花费",
      "living.spend.value": "清空已花费 UTXO 对应的槽位",
      "living.reuse.label": "复用",
      "living.reuse.value": "把新的 <code>creation_id</code> 写入空位",
      "living.expand.label": "扩展",
      "living.expand.value": "占用率达到 75% 时接入规范空白半区，过程不停顿",
      "ownership.index": "06 / 无签名所有权",
      "ownership.title": "一个秘密就够了。<br>无需密钥对。<br><em>无需签名。</em>",
      "ownership.lead": "Parano1d 地址由一个 256 位秘密导出，不需要公私钥对。钱包可以在不泄露秘密的前提下证明自己知道它。每次花费都会生成一份新的零知识证明，并与整笔交易绑定。",
      "ownership.secret": "花费秘密",
      "ownership.address": "o1… 地址",
      "ownership.protocol.label": "协议",
      "ownership.protocol.value": "256 位秘密 · 不采用公钥密码体制",
      "ownership.wire.label": "网络传输",
      "ownership.wire.value": "不传输公钥，也没有交易签名",
      "ownership.consensus.label": "所有权",
      "ownership.consensus.value": "<strong>以零知识方式证明知道该秘密</strong>",
      "photo.index": "07 / 照片派生密钥",
      "photo.title": "任何照片<br>都可以成为<br><em>主密钥。</em>",
      "photo.lead": "Parano1d 钱包可以生成新的主密钥、导入现有主密钥，也可以从私有图像中派生主密钥。Photo Key 只在本机读取图像，不会上传，也不会保留副本。相同的解码像素会恢复相同的 256 位主密钥及其派生的全部地址；像素一旦改变，就会得到另一个钱包。",
      "photo.download": "下载钱包",
      "paged.index": "08 / PAGEDSPEND",
      "paged.title": "1,020 个 UTXO。<br><em>仍是一笔交易。</em>",
      "paged.lead": "一个 <code>Tx8x2</code> 物理页最多容纳八个输入和两个输出。<code>PagedSpend</code> 可将最多 128 页合并为一笔逻辑交易，一次性花费最多 1,020 个 UTXO、创建最多 256 个输出，同时只使用一个 txid、一次手续费、一个授权胶囊和一张回执。",
      "history.index": "09 / 递归历史",
      "history.title": "历史继续增长。<br><em>证明大小不变。</em>",
      "history.lead": "每个 <code>HistoryStep</code> 在证明新区块的同时，也会验证上一步的终端证明。终端证明会随新区块更新，但其大小和验证工作量始终不受链高影响。",
      "history.active.label": "全节点保存",
      "history.active.value": "当前状态 + 终端证明 + 最近 18 个完整区块",
      "history.age.label": "链高",
      "history.age.value": "<strong>不影响证明大小和历史验证成本</strong>",
      "privacy.index": "10 / 不永久留存的隐私",
      "privacy.title": "不靠保密，<br><em>也有隐私。</em>",
      "privacy.lead": "交易通过共识时，Parano1d 完全透明：金额、所有者和交易内容均为公开信息。但共识不会永久保存交易关系图。若要长期追踪地址，外部观察者必须持续记录交易流，并独立保存这些数据。",
      "privacy.live.label": "当前状态",
      "privacy.live.value": "金额公开 · 所有者公开",
      "privacy.graph.label": "历史关系图",
      "privacy.graph.value": "<strong>共识不予留存</strong>",
      "privacy.tracker.label": "长期追踪",
      "privacy.tracker.value": "需要外部持续记录",
      "receipts.index": "11 / 可携带的付款证明",
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
      "stack.index": "12 / 单一二进制证明栈",
      "stack.title": "同一种算术。<br><em>贯穿始终。</em>",
      "stack.lead": "地址、钱包授权、交易、状态、递归历史与 PoW 共用同一套二进制证明栈。FROST-GKR 把重复的 Poseidon2b 结构折叠进共享布尔超立方体，FRI-Binius 则在无需可信设置的前提下闭合整个关系。",
      "stack.formula.left": "所有权 + 交易",
      "stack.formula.right": "状态 + 历史 + PoW",
      "stack.field.label": "域",
      "stack.field.value": "<span class=\"nowrap\">轨迹：<code>GF(2^128)</code></span> · <span class=\"nowrap\">Fiat Shamir 挑战值：<code>GF(2^256)</code></span>",
      "stack.prover.label": "Prover",
      "stack.prover.value": "在 59 次置换对比中<strong>快 10.50 倍</strong>",
      "stack.proof.label": "代数证明",
      "stack.proof.value": "<strong>缩小 51.67 倍</strong>",
      "soundness.index": "13 / 端到端后量子可靠性",
      "soundness.title": "Post-quantum.<br><em>Provable from genesis.</em>",
      "soundness.lead": "同一定理覆盖钱包授权、交易有效性、精确状态转换、递归 HistoryStep，以及节点最终接受的终端状态。",
      "soundness.result.label": "结论",
      "soundness.result.value": "<strong>NIST PQC Category 1</strong>",
      "soundness.floor.label": "半成功门深积下界",
      "soundness.floor.value": "<strong><code>2^173.273866314232</code></strong>",
      "soundness.bound.label": "完整理想模型上界",
      "soundness.bound.value": "<strong><code>0.053364140323608411 &lt; 1/2</code></strong>",
      "soundness.proof": "证明",
      "soundness.certificate": "可执行证书",
      "pow.index": "14 / Proof-native PoW",
      "pow.title": "先证明。<br><em>再挖矿。</em>",
      "pow.lead": "PoW 只负责排列已被证明有效的状态转移。矿工先完成与 nonce 无关的区块证明，冻结不可变模板，然后只搜索 128 位 nonce。",
      "pow.target.label": "出块目标",
      "pow.target.value": "<strong>平均 20 秒</strong> · ASERT 难度",
      "pow.role.label": "PoW 的作用",
      "pow.role.value": "<strong>确定已证明状态转移的规范顺序</strong>",
      "pow.boundary.label": "证明边界",
      "pow.boundary.value": "<strong>无法伪造所有权，也无法让无效状态通过验证</strong>",
      "join.index": "03 / 独立同步",
      "join.title": "用证明完成同步。<br><em>无需信任对端。</em>",
      "join.lead": "对等节点负责传输数据，却无权决定哪些数据可信。节点取得当前 UTXO 状态、对应的终端证明和最近 18 个区块组成的重组后缀，在本地完成验证后，便以独立全节点身份加入网络。无论网络运行一年还是十年，这套流程都不变。",
      "join.formula.state": "当前状态",
      "join.formula.proof": "终端证明",
      "join.formula.suffix": "18 个区块",
      "join.formula.node": "独立节点 ✓",
      "run.index": "15 / 适应不同硬件的去中心化",
      "run.title": "完整 L1。<br><em>就在你的笔记本上。</em>",
      "run.lead": "一台笔记本就能保存完整的当前状态，并独立验证整个 L1。矿工根据自身的证明能力选择区块容量：更快的硬件证明更大的区块，较慢的硬件证明较小的区块。吞吐量随硬件调整，而每个节点始终都能完成完整验证。",
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
      "rail.2": "逻辑反转",
      "rail.3": "独立同步",
      "rail.4": "证明原生架构",
      "rail.5": "当前 UTXO 状态",
      "rail.6": "无签名所有权",
      "rail.7": "照片派生密钥",
      "rail.8": "PagedSpend",
      "rail.9": "递归历史",
      "rail.10": "不永久留存",
      "rail.11": "可携带回执",
      "rail.12": "单一二进制证明栈",
      "rail.13": "端到端后量子可靠性",
      "rail.14": "Proof-native PoW",
      "rail.15": "适应不同硬件的去中心化",
      "deck.previous": "上一个状态"
    }
  };

  const states = [
    {
      title: "PARANO1D · PROOF-NATIVE LAYER 1",
      proof: "prove locally · prove the transition · verify everywhere",
      state: ["WALLET + MINER", "prove where the information lives"],
      proofLabel: ["PROVEN TRANSITION", "crosses the consensus boundary"],
      tail: ["EVERY NODE", "verifies · never re-executes"],
      read: ["local proofs", "proven transition", "verify"]
    },
    {
      title: "STATE 01 · THE DEPENDENCY",
      proof: "GENESIS → ACCUMULATED HISTORY → NOW",
      state: ["STATE", "derived from history"],
      proofLabel: ["HISTORY DEPENDENCY", "persists with network age"],
      tail: ["ACCUMULATED HISTORY", "every past transition"],
      read: ["replay", "snapshot", "checkpoint"]
    },
    {
      title: "STATE 02 · THE INVERSION",
      proof: "LIVE STATE + HISTORY PROOF",
      state: ["PARANO1D", "live state + recursive history proof"],
      proofLabel: ["SPENT SLOTS CLEAR", "new outputs reuse them"],
      tail: ["STORAGE", "tracks live UTXOs, not chain age"],
      read: ["live state", "history proof", "present"]
    },
    {
      title: "STATE 04 · PROOF-NATIVE",
      proof: "wallet proves · miner proves · network verifies",
      state: ["NETWORK", "applies verified writes"],
      proofLabel: ["PROOF FLOW", "witnesses stay local"],
      tail: ["CONSENSUS", "verification, not re-execution"],
      read: ["authorized writes", "two proofs", "one transition"]
    },
    {
      title: "STATE 05 · LIVING STATE",
      proof: "spent → clear → reuse before growth",
      state: ["LIVE STATE", "clear · reuse · expand"],
      proofLabel: ["NEW ROOT", "exact indexed writes"],
      tail: ["OCCUPANCY", "growth follows live use"],
      read: ["46.8% live", "root_h", "writes"]
    },
    {
      title: "STATE 06 · OWNERSHIP",
      proof: "secret → Poseidon2b → address",
      state: ["SPENDING SECRET", "never enters consensus"],
      proofLabel: ["ZK CAPSULE", "fresh · transaction-bound"],
      tail: ["ADDRESS", "signatureless ownership"],
      read: ["o1 address", "zk capsule", "preimage"]
    },
    {
      title: "STATE 08 · PAGEDSPEND",
      proof: "up to 128 Tx8x2 pages · one logical transaction",
      state: ["TX8X2 PAGES", "up to 8 inputs + 2 outputs each"],
      proofLabel: ["ONE TXID", "atomic acceptance"],
      tail: ["LOGICAL PAGEDSPEND", "1 fee · 1 capsule · 1 receipt"],
      read: ["1,020 inputs", "256 outputs", "one txid"]
    },
    {
      title: "STATE 09 · HISTORYSTEP",
      proof: "π_H−1 + BLOCK_H + STATE_H → π_H",
      state: ["NEW TRANSITION", "BLOCK_H + STATE_H"],
      proofLabel: ["π_H", "same terminal size"],
      tail: ["RECENT SUFFIX", "18 complete blocks"],
      read: ["STATE_H", "π_H", "fixed work"]
    },
    {
      title: "STATE 14 · PROOF-NATIVE POW",
      proof: "prove transition · freeze template · scan nonce",
      state: ["PROVEN BLOCK", "immutable template"],
      proofLabel: ["128-BIT NONCE", "ordering already-valid work"],
      tail: ["ASERT", "complete block interval · 20-second mean"],
      read: ["B25 · m22", "template locked", "pow"]
    },
    {
      title: "STATE 03 · INDEPENDENT BOOTSTRAP",
      proof: "peer data → local verification → independent node",
      state: ["PEER DATA", "live state · terminal proof · 18-block reorg suffix"],
      proofLabel: ["VERIFY LOCALLY", "authenticate state + suffix"],
      tail: ["INDEPENDENT FULL NODE", "same procedure in year one and year ten"],
      read: ["peer data", "local verify", "independent"]
    },
    {
      title: "STATE 15 · HARDWARE-ADAPTIVE L1",
      proof: "hardware changes TPS · every node verifies everything",
      state: ["NODES ON ANY DEVICE", "each holds + verifies the entire L1"],
      proofLabel: ["ADAPTIVE TPS", "block capacity follows proving power"],
      tail: ["LIVE NETWORK", "throughput changes · consensus advances"],
      read: ["entire L1", "adaptive TPS", "decentralized"]
    },
    {
      title: "STATE 10 · NON-RETENTION",
      proof: "public present · no consensus-retained transaction graph",
      state: ["LIVE STATE", "public values · public owners"],
      proofLabel: ["CONSENSUS", "does not retain the past graph"],
      tail: ["EXTERNAL ARCHIVER", "records and stores the stream independently"],
      read: ["public now", "no retained graph", "external archive"]
    },
    {
      title: "STATE 11 · PORTABLE RECEIPT",
      proof: "payment + Merkle path + canonical header",
      state: ["PAYMENT DATA", "txid · recipients · amounts"],
      proofLabel: ["POSEIDON2b PATH", "eight fixed levels"],
      tail: ["VERIFIED", "no historical block body"],
      read: ["payment", "8-level path", "canonical"]
    },
    {
      title: "STATE 12 · FROST-GKR",
      proof: "one binary arithmetic · end to end",
      state: ["GF(2^128) + GF(2^256)", "trace arithmetic · Fiat Shamir challenges"],
      proofLabel: ["FROST-GKR", "shared Boolean hypercubes"],
      tail: ["FRI-BINIUS", "no trusted setup"],
      read: ["binary tower", "10.50×", "51.67×"]
    },
    {
      title: "STATE 13 · END TO END POST QUANTUM",
      proof: "wallet · transaction · state · recursive history · one security game",
      state: ["NIST PQC CATEGORY 1", "complete State validation"],
      proofLabel: ["2^173.273866314232", "half-success gate-depth floor"],
      tail: ["0.053364140323608411", "complete ideal bound < 1/2"],
      read: ["end to end", "Category 1", "proved"]
    },
    {
      title: "STATE 07 · PHOTO-DERIVED KEY",
      proof: "generate · import · or derive locally from pixels",
      state: ["PRIVATE IMAGE", "decoded locally · never uploaded"],
      proofLabel: ["256-BIT MASTER SECRET", "same pixels · same wallet"],
      tail: ["KEY ID", "fingerprint before import"],
      read: ["RGBA8 pixels", "BLAKE3 derive-key", "o1 address"]
    }
  ];

  const stateTranslations = {
    ru: [
      {
        title: "PARANO1D · PROOF-NATIVE LAYER 1",
        proof: "кошелёк и майнер доказывают · сеть проверяет",
        state: ["КОШЕЛЁК + МАЙНЕР", "строят доказательства там, где находятся данные"],
        proofLabel: ["ДОКАЗАННЫЙ ПЕРЕХОД", "пересекает границу консенсуса"],
        tail: ["КАЖДАЯ НОДА", "проверяет · не исполняет заново"],
        read: ["локальные доказательства", "доказанный переход", "проверка"]
      },
      {
        title: "СОСТОЯНИЕ 01 · ЗАВИСИМОСТЬ",
        proof: "ГЕНЕЗИС → НАКОПЛЕННАЯ ИСТОРИЯ → СЕЙЧАС",
        state: ["СОСТОЯНИЕ", "выведено из истории"],
        proofLabel: ["ЗАВИСИМОСТЬ ОТ ИСТОРИИ", "сохраняется с возрастом сети"],
        tail: ["НАКОПЛЕННАЯ ИСТОРИЯ", "каждый прошлый переход"],
        read: ["повтор", "снимок", "контрольная точка"]
      },
      {
        title: "СОСТОЯНИЕ 02 · ИНВЕРСИЯ",
        proof: "ТЕКУЩЕЕ СОСТОЯНИЕ + ДОКАЗАТЕЛЬСТВО ИСТОРИИ",
        state: ["PARANO1D", "текущее состояние + рекурсивное доказательство истории"],
        proofLabel: ["ПОТРАЧЕННЫЕ СЛОТЫ ОСВОБОЖДАЮТСЯ", "новые выходы занимают их снова"],
        tail: ["ХРАНЕНИЕ", "зависит от текущих UTXO, а не от возраста цепочки"],
        read: ["текущее состояние", "доказательство истории", "настоящее"]
      },
      {
        title: "СОСТОЯНИЕ 04 · PROOF-NATIVE",
        proof: "кошелёк доказывает авторизацию · майнер доказывает переход · сеть проверяет",
        state: ["СЕТЬ", "применяет только проверенные изменения"],
        proofLabel: ["ПОТОК ДОКАЗАТЕЛЬСТВ", "свидетели остаются у владельцев данных"],
        tail: ["КОНСЕНСУС", "проверяет результат вместо повторного исполнения"],
        read: ["разрешённые изменения", "два доказательства", "один переход"]
      },
      {
        title: "СОСТОЯНИЕ 05 · ТЕКУЩИЕ UTXO",
        proof: "потратить → освободить слот → использовать его снова",
        state: ["ТЕКУЩЕЕ СОСТОЯНИЕ", "очистка · повторное использование · расширение"],
        proofLabel: ["НОВЫЙ КОРЕНЬ", "точно фиксирует изменённые слоты"],
        tail: ["ЗАПОЛНЕННОСТЬ", "рост зависит только от текущих UTXO"],
        read: ["46.8% занято", "root_h", "изменённые слоты"]
      },
      {
        title: "СОСТОЯНИЕ 06 · ВЛАДЕНИЕ БЕЗ ПОДПИСЕЙ",
        proof: "секрет → Poseidon2b → адрес",
        state: ["СЕКРЕТ РАСХОДОВАНИЯ", "никогда не передаётся в консенсус"],
        proofLabel: ["КАПСУЛА АВТОРИЗАЦИИ", "создаётся заново · связана со всей транзакцией"],
        tail: ["АДРЕС", "владение без подписей"],
        read: ["адрес o1", "ZK доказательство", "знание прообраза"]
      },
      {
        title: "СОСТОЯНИЕ 08 · PAGEDSPEND",
        proof: "до 128 страниц Tx8x2 · одна логическая транзакция",
        state: ["СТРАНИЦЫ TX8X2", "до 8 входов и 2 выходов на каждой"],
        proofLabel: ["ОДИН TXID", "транзакция принимается целиком"],
        tail: ["ЛОГИЧЕСКИЙ PAGEDSPEND", "1 комиссия · 1 капсула · 1 чек"],
        read: ["1 020 входов", "256 выходов", "один txid"]
      },
      {
        title: "СОСТОЯНИЕ 09 · HISTORYSTEP",
        proof: "π_H−1 + BLOCK_H + STATE_H → π_H",
        state: ["НОВЫЙ ПЕРЕХОД", "BLOCK_H + STATE_H"],
        proofLabel: ["π_H", "размер доказательства не меняется"],
        tail: ["ПОСЛЕДНИЙ УЧАСТОК ЦЕПОЧКИ", "18 полных блоков"],
        read: ["STATE_H", "π_H", "постоянная стоимость"]
      },
      {
        title: "СОСТОЯНИЕ 14 · PROOF-NATIVE POW",
        proof: "доказать переход · зафиксировать шаблон · искать nonce",
        state: ["ДОКАЗАННЫЙ БЛОК", "неизменяемый шаблон"],
        proofLabel: ["128-БИТНЫЙ NONCE", "порядок уже корректных переходов"],
        tail: ["ASERT", "полный интервал блока · средняя цель 20 секунд"],
        read: ["B25 · m22", "шаблон зафиксирован", "PoW"]
      },
      {
        title: "СОСТОЯНИЕ 03 · НЕЗАВИСИМАЯ СИНХРОНИЗАЦИЯ",
        proof: "данные от пира → локальная проверка → независимая нода",
        state: ["ДАННЫЕ ОТ ЛЮБОГО ПИРА", "состояние · терминальное доказательство · 18 блоков"],
        proofLabel: ["ЛОКАЛЬНАЯ ПРОВЕРКА", "проверить состояние и суффикс"],
        tail: ["НЕЗАВИСИМАЯ ПОЛНАЯ НОДА", "тот же порядок через год и через десять лет"],
        read: ["данные пира", "локальная проверка", "независимая нода"]
      },
      {
        title: "СОСТОЯНИЕ 15 · АДАПТИВНАЯ L1",
        proof: "TPS зависит от железа · каждая нода проверяет всё",
        state: ["НОДЫ НА ЛЮБОМ УСТРОЙСТВЕ", "каждая хранит и проверяет всю L1"],
        proofLabel: ["АДАПТИВНЫЙ TPS", "ёмкость блока соответствует мощности железа"],
        tail: ["РАБОТАЮЩАЯ СЕТЬ", "пропускная способность меняется · блоки продолжают выходить"],
        read: ["вся L1", "адаптивный TPS", "децентрализована"]
      },
      {
        title: "СОСТОЯНИЕ 10 · БЕЗ ПОСТОЯННОГО ХРАНЕНИЯ",
        proof: "публичное настоящее · консенсус не хранит граф транзакций",
        state: ["ТЕКУЩЕЕ СОСТОЯНИЕ", "публичные суммы · публичные владельцы"],
        proofLabel: ["КОНСЕНСУС", "не сохраняет граф прошлых транзакций"],
        tail: ["ВНЕШНИЙ АРХИВАТОР", "сам записывает и хранит поток"],
        read: ["публично сейчас", "граф не хранится", "внешний архив"]
      },
      {
        title: "СОСТОЯНИЕ 11 · ПЕРЕНОСИМЫЙ ЧЕК",
        proof: "платёж + Merkle-путь + канонический заголовок",
        state: ["ДАННЫЕ ПЛАТЕЖА", "txid · получатели · суммы"],
        proofLabel: ["ПУТЬ POSEIDON2b", "восемь фиксированных уровней"],
        tail: ["ПРОВЕРЕНО", "без исторического тела блока"],
        read: ["платёж", "путь ×8", "канонический"]
      },
      {
        title: "СОСТОЯНИЕ 12 · FROST-GKR",
        proof: "одна бинарная арифметика · от начала до конца",
        state: ["GF(2^128) + GF(2^256)", "арифметика трасс · вызовы Fiat Shamir"],
        proofLabel: ["FROST-GKR", "общие булевы гиперкубы"],
        tail: ["FRI-BINIUS", "без доверенной настройки"],
        read: ["бинарная башня", "10,50×", "51,67×"]
      },
      {
        title: "СОСТОЯНИЕ 13 · СКВОЗНАЯ ПОСТКВАНТОВАЯ БЕЗОПАСНОСТЬ",
        proof: "кошелёк · транзакции · состояние · рекурсивная история · единая игра",
        state: ["NIST PQC CATEGORY 1", "полная проверка состояния"],
        proofLabel: ["2^173.273866314232", "граница gate-depth при вероятности успеха 1/2"],
        tail: ["0,053364140323608411", "полная идеальная оценка < 1/2"],
        read: ["от начала до конца", "Category 1", "доказано"]
      },
      {
        title: "СОСТОЯНИЕ 07 · КЛЮЧ ИЗ ФОТОГРАФИИ",
        proof: "создать · импортировать · или получить локально из пикселей",
        state: ["ПРИВАТНОЕ ИЗОБРАЖЕНИЕ", "декодируется локально · не загружается"],
        proofLabel: ["256-БИТНЫЙ МАСТЕР-СЕКРЕТ", "те же пиксели · тот же кошелёк"],
        tail: ["KEY ID", "отпечаток перед импортом"],
        read: ["пиксели RGBA8", "BLAKE3 derive-key", "адрес o1"]
      }
    ],
    zh: [
      {
        title: "PARANO1D · 证明原生 LAYER 1",
        proof: "钱包与矿工生成证明 · 全网负责验证",
        state: ["钱包 + 矿工", "在信息所在处生成证明"],
        proofLabel: ["已证明状态转移", "跨越共识边界"],
        tail: ["每个节点", "只验证 · 不重复执行"],
        read: ["本地证明", "已证明状态转移", "验证"]
      },
      {
        title: "状态 01 · 历史依赖",
        proof: "创世块 → 累积历史 → 当前",
        state: ["状态", "由历史推导"],
        proofLabel: ["历史依赖", "随网络运行时间持续存在"],
        tail: ["累积历史", "过去的每次状态转移"],
        read: ["重放", "快照", "检查点"]
      },
      {
        title: "状态 02 · 逻辑反转",
        proof: "当前状态 + 历史证明",
        state: ["PARANO1D", "当前状态 + 递归历史证明"],
        proofLabel: ["已花费槽位立即释放", "新输出随后复用"],
        tail: ["存储规模", "取决于当前 UTXO，而不是链龄"],
        read: ["当前状态", "历史证明", "此刻"]
      },
      {
        title: "状态 04 · 证明原生架构",
        proof: "钱包证明授权 · 矿工证明转移 · 网络负责验证",
        state: ["网络", "只应用验证通过的写入"],
        proofLabel: ["证明流", "见证留在掌握数据的一方"],
        tail: ["共识", "验证结果，不重复执行"],
        read: ["授权写入", "两份证明", "一次状态转移"]
      },
      {
        title: "状态 05 · 当前 UTXO 状态",
        proof: "花费 → 清空 → 扩展前优先复用",
        state: ["当前状态", "清空 · 复用 · 按需扩展"],
        proofLabel: ["新状态根", "准确绑定发生变化的槽位"],
        tail: ["占用率", "只随当前 UTXO 数量增长"],
        read: ["46.8% 已占用", "root_h", "槽位写入"]
      },
      {
        title: "状态 06 · 无签名所有权",
        proof: "秘密 → Poseidon2b → 地址",
        state: ["花费秘密", "不会进入共识数据"],
        proofLabel: ["授权胶囊", "每笔交易重新生成并与整笔交易绑定"],
        tail: ["地址", "无签名所有权"],
        read: ["o1 地址", "ZK capsule", "原像知识"]
      },
      {
        title: "状态 08 · PAGEDSPEND",
        proof: "最多 128 个 Tx8x2 页 · 一笔逻辑交易",
        state: ["TX8X2 物理页", "每页最多 8 个输入和 2 个输出"],
        proofLabel: ["同一 TXID", "整笔交易一次接受"],
        tail: ["逻辑 PAGEDSPEND", "1 次手续费 · 1 个授权胶囊 · 1 张回执"],
        read: ["1,020 个输入", "256 个输出", "同一 txid"]
      },
      {
        title: "状态 09 · HISTORYSTEP",
        proof: "π_H−1 + BLOCK_H + STATE_H → π_H",
        state: ["新状态转移", "BLOCK_H + STATE_H"],
        proofLabel: ["π_H", "终端证明大小不变"],
        tail: ["链的最新部分", "18 个完整区块"],
        read: ["STATE_H", "π_H", "固定验证成本"]
      },
      {
        title: "状态 14 · PROOF-NATIVE POW",
        proof: "证明转移 · 冻结模板 · 搜索 nonce",
        state: ["已证明区块", "不可变模板"],
        proofLabel: ["128 位 NONCE", "只排列已有效工作"],
        tail: ["ASERT", "完整区块间隔 · 平均目标 20 秒"],
        read: ["B25 · m22", "模板已锁定", "pow"]
      },
      {
        title: "状态 03 · 独立同步",
        proof: "对等节点传输数据 → 本地验证 → 独立全节点",
        state: ["任意对等节点的数据", "当前状态 · 终端证明 · 18 个区块"],
        proofLabel: ["本地验证", "验证状态和重组后缀"],
        tail: ["独立全节点", "运行一年或十年，流程都相同"],
        read: ["对等节点数据", "本地验证", "独立全节点"]
      },
      {
        title: "状态 15 · 硬件自适应 L1",
        proof: "TPS 随硬件调整 · 每个节点都完成完整验证",
        state: ["任意设备上的节点", "每个节点都保存并验证完整 L1"],
        proofLabel: ["自适应 TPS", "区块容量随证明能力调整"],
        tail: ["持续运行的网络", "吞吐量动态调整 · 共识持续推进"],
        read: ["完整 L1", "自适应 TPS", "去中心化"]
      },
      {
        title: "状态 10 · 不永久留存",
        proof: "当前公开 · 共识不保存永久交易图",
        state: ["当前状态", "金额公开 · 所有者公开"],
        proofLabel: ["共识", "不保留历史交易关系图"],
        tail: ["外部归档方", "独立记录并保存交易流"],
        read: ["此刻公开", "不留存交易图", "外部归档"]
      },
      {
        title: "状态 11 · 可携带回执",
        proof: "付款 + Merkle 路径 + 规范区块头",
        state: ["付款数据", "txid · 收款地址 · 金额"],
        proofLabel: ["POSEIDON2b 路径", "固定八层"],
        tail: ["验证通过", "无需历史区块正文"],
        read: ["付款", "八层路径", "规范链"]
      },
      {
        title: "状态 12 · FROST-GKR",
        proof: "同一种二进制算术 · 贯穿始终",
        state: ["GF(2^128) + GF(2^256)", "轨迹算术 · Fiat Shamir 挑战值"],
        proofLabel: ["FROST-GKR", "共享布尔超立方体"],
        tail: ["FRI-BINIUS", "无需可信设置"],
        read: ["二进制塔域", "10.50×", "51.67×"]
      },
      {
        title: "状态 13 · 端到端后量子可靠性",
        proof: "钱包 · 交易 · 状态 · 递归历史 · 同一安全性游戏",
        state: ["NIST PQC CATEGORY 1", "完整状态验证"],
        proofLabel: ["2^173.273866314232", "半成功门深积下界"],
        tail: ["0.053364140323608411", "完整理想模型上界 < 1/2"],
        read: ["端到端", "Category 1", "已证明"]
      },
      {
        title: "状态 07 · 照片派生密钥",
        proof: "生成 · 导入 · 或从像素在本地派生",
        state: ["私有图像", "仅在本机解码 · 不会上传"],
        proofLabel: ["256 位主密钥", "相同像素 · 相同钱包"],
        tail: ["KEY ID", "导入前的密钥指纹"],
        read: ["RGBA8 像素", "BLAKE3 derive-key", "o1 地址"]
      }
    ]
  };

  const stateSequence = [0, 1, 2, 9, 3, 4, 5, 15, 6, 7, 11, 12, 13, 14, 8, 10];

  const interfaceCopy = {
    en: { next: "NEXT", current: "CURRENT STATE ✓", copied: "COPIED" },
    ru: { next: "ДАЛЬШЕ", current: "ТЕКУЩЕЕ ✓", copied: "СКОПИРОВАНО" },
    zh: { next: "下一步", current: "当前状态 ✓", copied: "已复制" }
  };

  const metaCopy = {
    en: {
      title: "Parano1d. Proof-native Layer 1",
      description: "Parano1d is a proof-native Layer 1 ordered by proof of work. State is validated from genesis in O(1), with provable end-to-end post-quantum soundness at NIST PQC Category 1.",
      locale: "en_US"
    },
    ru: {
      title: "Parano1d. Proof-native Layer 1",
      description: "Proof of work задаёт канонический порядок. Состояние сети проверяется от генезиса за O(1). Сквозная постквантовая безопасность доказана на уровне NIST PQC Category 1.",
      locale: "ru_RU"
    },
    zh: {
      title: "Parano1d. Proof-native Layer 1",
      description: "工作量证明确定规范顺序。网络状态自创世块起以 O(1) 复杂度完成验证。端到端后量子可靠性已证明达到 NIST PQC Category 1 水平。",
      locale: "zh_CN"
    }
  };

  const canvasTranslations = {
    ru: {
      proveLocally: "ДОКАЗАТЬ ЛОКАЛЬНО",
      proofBoundary: "ГРАНИЦА ДОКАЗАТЕЛЬСТВА",
      verifyEverywhere: "ПРОВЕРЯЕТ ВСЯ СЕТЬ",
      proveTransition: "ДОКАЗАТЬ ПЕРЕХОД",
      liveStateAdvances: "СОСТОЯНИЕ ОБНОВЛЕНО",
      provenBlock: "ДОКАЗАННЫЙ БЛОК",
      snapshot: "СОСТОЯНИЕ · БЛОК",
      genesis: "ГЕНЕЗИС",
      now: "СЕЙЧАС",
      privateWitness: "ПРИВАТНЫЙ СВИДЕТЕЛЬ",
      publicTransition: "ПУБЛИЧНЫЙ ПЕРЕХОД",
      verifyAndApply: "ПРОВЕРИТЬ И ПРИМЕНИТЬ",
      walletRole: "КОШЕЛЁК",
      minerRole: "МАЙНЕР",
      networkRole: "СЕТЬ",
      proofActionProves: "ДОКАЗЫВАЕТ",
      proofActionAuthorization: "АВТОРИЗАЦИЮ",
      proofActionTransition: "ПЕРЕХОД",
      proofActionVerifies: "ПРОВЕРЯЕТ",
      proofActionApplies: "ПРИМЕНЯЕТ",
      authorizationProof: "ДОКАЗАТЕЛЬСТВО АВТОРИЗАЦИИ",
      stateTransitionProof: "ДОКАЗАТЕЛЬСТВО ТОЧНОГО ПЕРЕХОДА",
      virtualHalf: "ВИРТУАЛЬНАЯ ПУСТАЯ ПОЛОВИНА",
      emptyHalfShort: "ПУСТАЯ ПОЛОВИНА",
      secret: "СЕКРЕТ",
      zeroKnowledgeProof: "ДОКАЗАТЕЛЬСТВО С НУЛЕВЫМ РАЗГЛАШЕНИЕМ",
      o1Address: "АДРЕС O1",
      pagedCapacity: "1 020 ВХОДОВ · 256 ВЫХОДОВ",
      pagedCapacityShort: "1 020 ВХ · 256 ВЫХ",
      oneAtomicPagedSpend: "ЕДИНЫЙ АТОМАРНЫЙ PAGEDSPEND",
      pagedSpendShort: "ОДИН PAGEDSPEND",
      blockState: "BLOCK_H + STATE_H",
      sameSize: "РАЗМЕР НЕ МЕНЯЕТСЯ",
      sameSizeShort: "РАЗМЕР ТОТ ЖЕ",
      proven: "ДОКАЗАН",
      template: "ШАБЛОН",
      nonceOnly: "ИЩЕМ ТОЛЬКО NONCE",
      asert: "20 с · ASERT",
      liveState: "ТЕКУЩЕЕ СОСТОЯНИЕ",
      liveStateShort: "СОСТОЯНИЕ",
      terminalProof: "ТЕРМИНАЛЬНОЕ ДОКАЗАТЕЛЬСТВО",
      terminalProofShort: "PROOF",
      reorgSuffix18: "18 БЛОКОВ ДЛЯ РЕОРГАНИЗАЦИИ",
      reorgSuffixShort: "18 БЛОКОВ",
      independentNode: "НЕЗАВИСИМАЯ НОДА",
      fullVerification: "ПОЛНАЯ ПРОВЕРКА",
      livePercent: "слотов занято",
      presentDerived: "НАСТОЯЩЕЕ ВЫВОДИТСЯ ИЗ ПРОШЛОГО",
      historyDependency: "ЗАВИСИМОСТЬ ОТ ИСТОРИИ",
      persistsWithAge: "СОХРАНЯЕТСЯ С ВОЗРАСТОМ СЕТИ",
      accumulatedHistory: "НАКОПЛЕННАЯ ИСТОРИЯ",
      everyPastTransition: "КАЖДЫЙ ПРОШЛЫЙ ПЕРЕХОД",
      stateLabel: "СОСТОЯНИЕ",
      derived: "ВЫВЕДЕНО",
      fromHistory: "ИЗ ИСТОРИИ",
      replay: "ПОВТОР",
      historySnapshot: "СНИМОК",
      checkpoint: "КОНТРОЛЬНАЯ ТОЧКА",
      historyBasedValidation: "ПРОВЕРКА ПО ИСТОРИИ",
      bootstrapBurdenAccumulates: "НАГРУЗКА ПРИ ПЕРВОМ ЗАПУСКЕ НАКАПЛИВАЕТСЯ",
      bootstrapBurdenGrows: "ЧЕМ ДЛИННЕЕ ИСТОРИЯ, ТЕМ ВЫШЕ НАГРУЗКА",
      parano1d: "PARANO1D",
      liveStateRecursiveProof: "ТЕКУЩЕЕ СОСТОЯНИЕ + РЕКУРСИВНОЕ ДОКАЗАТЕЛЬСТВО ИСТОРИИ",
      slotsReused: "ПОТРАЧЕННЫЕ СЛОТЫ ОСВОБОЖДАЮТСЯ · НОВЫЕ ВЫХОДЫ ЗАНИМАЮТ ИХ СНОВА",
      storageTracksLive: "ХРАНЕНИЕ ЗАВИСИТ ОТ ТЕКУЩИХ UTXO, А НЕ ОТ ВОЗРАСТА ЦЕПОЧКИ",
      today: "СЕГОДНЯ",
      tenYears: "+10 ЛЕТ",
      peerData: "ДАННЫЕ ОТ ЛЮБОГО ПИРА",
      verifyLocally: "ПРОВЕРИТЬ ЛОКАЛЬНО",
      verifyShort: "ПРОВЕРКА",
      authenticated: "ПРОВЕРЕНО",
      independentFullNode: "НЕЗАВИСИМАЯ ПОЛНАЯ НОДА",
      fullNodeShort: "ПОЛНАЯ НОДА",
      sameProcedure: "ТОТ ЖЕ ПОРЯДОК · ЧЕРЕЗ ГОД → ЧЕРЕЗ 10 ЛЕТ",
      transparentNow: "ПРОЗРАЧНО СЕЙЧАС",
      externalArchiver: "ВНЕШНИЙ АРХИВАТОР",
      externalArchiveShort: "ВНЕШНИЙ АРХИВ",
      recordStream: "НЕПРЕРЫВНО ЗАПИСЫВАЕТ ПОТОК",
      permanentGraph: "ПОСТОЯННЫЙ ГРАФ",
      externalRetention: "ТРЕБУЕТ ВНЕШНЕГО ХРАНЕНИЯ",
      payment: "ПЛАТЁЖ",
      portableReceipt: "ПЕРЕНОСИМЫЙ ЧЕК",
      receiptShort: "ЧЕК",
      canonicalHeader: "КАНОНИЧЕСКИЙ ЗАГОЛОВОК",
      headerShort: "ЗАГОЛОВОК",
      noBlockBody: "СТАРОЕ ТЕЛО БЛОКА НЕ НУЖНО",
      merklePath8: "MERKLE-ПУТЬ ×8",
      verifiedCanonical: "ПРОВЕРЕНО · КАНОНИЧЕСКАЯ ЦЕПЬ",
      verifiedShort: "ПРОВЕРЕНО",
      ownershipLane: "ВЛАДЕНИЕ",
      transactionLane: "ТРАНЗАКЦИЯ",
      stateLane: "STATE",
      historyLane: "ИСТОРИЯ",
      powLane: "POW",
      oneBinaryTower: "ЕДИНАЯ БИНАРНАЯ БАШНЯ",
      oneProofStack: "ЕДИНЫЙ PROOF STACK",
      oneProofShort: "ОДИН PROOF",
      noTrustedSetup: "БЕЗ ДОВЕРЕННОЙ НАСТРОЙКИ",
      validityLocked: "КОРРЕКТНОСТЬ ЗАФИКСИРОВАНА ДО ХЕШРЕЙТА",
      photoGenerate: "СОЗДАТЬ",
      photoImport: "ИМПОРТ",
      photoOption: "PHOTO KEY",
      photoScan: "СКАНИРОВАНИЕ ПИКСЕЛЕЙ",
      photoCanonical: "КАНОНИЧЕСКИЙ RGBA8",
      photoDerive: "BLAKE3 · DERIVE KEY",
      photoSecret: "МАСТЕР-СЕКРЕТ · 256 БИТ",
      photoSame: "ТЕ ЖЕ ПИКСЕЛИ · ТОТ ЖЕ КОШЕЛЁК",
      photoAddress: "АДРЕС O1",
      photoLocal: "ЛОКАЛЬНО · БЕЗ ЗАГРУЗКИ"
    },
    zh: {
      proveLocally: "本地生成证明",
      proofBoundary: "证明边界",
      verifyEverywhere: "全网验证",
      proveTransition: "证明状态转移",
      liveStateAdvances: "当前状态已更新",
      provenBlock: "已证明区块",
      snapshot: "状态快照 :: 区块",
      genesis: "创世块",
      now: "当前",
      privateWitness: "私有见证",
      publicTransition: "公开状态转移",
      verifyAndApply: "验证并应用",
      walletRole: "钱包",
      minerRole: "矿工",
      networkRole: "网络",
      proofActionProves: "生成证明",
      proofActionAuthorization: "授权",
      proofActionTransition: "状态转移",
      proofActionVerifies: "验证",
      proofActionApplies: "应用",
      authorizationProof: "授权证明",
      stateTransitionProof: "精确状态转移证明",
      virtualHalf: "虚拟空白半区",
      emptyHalfShort: "空白半区",
      secret: "秘密",
      zeroKnowledgeProof: "零知识证明",
      o1Address: "O1 地址",
      pagedCapacity: "1,020 个输入 · 256 个输出",
      pagedCapacityShort: "1,020 入 · 256 出",
      oneAtomicPagedSpend: "一笔原子 PAGEDSPEND",
      pagedSpendShort: "一笔 PAGEDSPEND",
      blockState: "BLOCK_H + STATE_H",
      sameSize: "证明大小不变",
      sameSizeShort: "大小不变",
      proven: "已证明",
      template: "模板",
      nonceOnly: "仅搜索 NONCE",
      asert: "20 秒 · ASERT",
      liveState: "当前状态",
      liveStateShort: "状态",
      terminalProof: "终端证明",
      terminalProofShort: "证明",
      reorgSuffix18: "18 个区块的重组后缀",
      reorgSuffixShort: "18 个区块",
      independentNode: "独立节点",
      fullVerification: "完整验证",
      livePercent: "当前 UTXO",
      presentDerived: "当前状态由过去推导",
      historyDependency: "历史依赖",
      persistsWithAge: "随网络运行时间持续存在",
      accumulatedHistory: "累积历史",
      everyPastTransition: "过去的每次状态转移",
      stateLabel: "状态",
      derived: "由历史",
      fromHistory: "推导",
      replay: "重放",
      historySnapshot: "快照",
      checkpoint: "检查点",
      historyBasedValidation: "基于历史的验证",
      bootstrapBurdenAccumulates: "初始验证负担不断累积",
      bootstrapBurdenGrows: "历史越长，初始验证负担越重",
      parano1d: "PARANO1D",
      liveStateRecursiveProof: "当前状态 + 递归历史证明",
      slotsReused: "已花费槽位立即释放 · 新输出随后复用",
      storageTracksLive: "存储规模取决于当前 UTXO，而不是链龄",
      today: "现在",
      tenYears: "+10 年",
      peerData: "来自任意对等节点的数据",
      verifyLocally: "本地验证",
      verifyShort: "验证",
      authenticated: "验证通过",
      independentFullNode: "独立全节点",
      fullNodeShort: "全节点",
      sameProcedure: "运行一年或十年 · 验证流程完全相同",
      transparentNow: "当前透明",
      externalArchiver: "外部归档方",
      externalArchiveShort: "外部归档",
      recordStream: "持续记录交易流",
      permanentGraph: "永久交易图",
      externalRetention: "需要外部自行保存",
      payment: "付款",
      portableReceipt: "可携带回执",
      receiptShort: "回执",
      canonicalHeader: "规范区块头",
      headerShort: "区块头",
      noBlockBody: "无需旧区块正文",
      merklePath8: "MERKLE 路径 ×8",
      verifiedCanonical: "验证通过 · 规范链",
      verifiedShort: "验证通过",
      ownershipLane: "所有权",
      transactionLane: "交易",
      stateLane: "状态",
      historyLane: "历史",
      powLane: "POW",
      oneBinaryTower: "同一二进制塔域",
      oneProofStack: "单一证明栈",
      oneProofShort: "单一证明",
      noTrustedSetup: "无需可信设置",
      validityLocked: "有效性在算力介入前已经锁定",
      photoGenerate: "生成",
      photoImport: "导入",
      photoOption: "PHOTO KEY",
      photoScan: "扫描像素",
      photoCanonical: "规范 RGBA8",
      photoDerive: "BLAKE3 · DERIVE KEY",
      photoSecret: "主密钥 · 256 位",
      photoSame: "相同像素 · 相同钱包",
      photoAddress: "O1 地址",
      photoLocal: "本地处理 · 不上传"
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
  const PHOTO_KEY_STEP = 7;
  const SOUNDNESS_STEP = 13;
  const PHOTO_KEY_DURATION = 2350;
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
  let wheelScrollingChapter = false;
  const wheelGestureGapMs = 240;
  const wheelStepCooldownMs = 320;
  const wheelTriggerDistance = 34;
  let touchStart = null;
  let scene = null;
  let wheelAudioContext = null;
  let wheelAudioOutput = null;
  let wheelAudioResume = null;

  function activeChapterScroller() {
    return chapters[current] || null;
  }

  function chapterCanScroll(direction, chapter = activeChapterScroller()) {
    if (!chapter || !direction) return false;
    const maxScroll = chapter.scrollHeight - chapter.clientHeight;
    if (maxScroll <= 2) return false;
    return direction > 0
      ? chapter.scrollTop < maxScroll - 2
      : chapter.scrollTop > 2;
  }

  function scrollActiveChapter(direction, distance) {
    const chapter = activeChapterScroller();
    if (!chapterCanScroll(direction, chapter)) return false;
    chapter.scrollBy({
      top: direction * Math.max(44, distance),
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
    return true;
  }

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

  window.addEventListener("pointerdown", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-go], [data-next], #prev, #next")) unlockWheelAudio();
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("a, button, summary") && !target.closest("[data-go], [data-next], #prev, #next")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", "ArrowLeft", "ArrowUp", "PageUp", "Home", "End", " "].includes(event.key)) {
      unlockWheelAudio();
    }
  });

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
      scene.syncPlayback({ render: true });
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

  const emailCopyTimers = new WeakMap();
  const emailCopyOriginalText = new WeakMap();

  async function copyToClipboard(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.readOnly = true;
      input.style.position = "fixed";
      input.style.opacity = "0";
      input.style.pointerEvents = "none";
      document.body.append(input);
      input.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch {}
      input.remove();
      return copied;
    }
  }

  document.querySelectorAll("[data-copy-email]").forEach((control) => {
    const feedback = control.querySelector("[data-copy-feedback]") || control;
    emailCopyOriginalText.set(control, feedback.textContent || "");
    control.addEventListener("click", async () => {
      const address = control.dataset.copyEmail;
      if (!address || !await copyToClipboard(address)) return;

      const oldTimer = emailCopyTimers.get(control);
      if (oldTimer) clearTimeout(oldTimer);
      control.classList.add("is-copied");
      feedback.textContent = control.dataset.copySuccess || interfaceCopy[language].copied;

      const timer = window.setTimeout(() => {
        const restoreKey = feedback.dataset.copyRestoreKey;
        const translated = restoreKey
          ? (language === "en" ? sourceCopy.get(restoreKey) : translations[language]?.[restoreKey])
          : null;
        feedback.textContent = translated || emailCopyOriginalText.get(control) || address;
        control.classList.remove("is-copied");
        emailCopyTimers.delete(control);
      }, 1500);
      emailCopyTimers.set(control, timer);
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
        if (tag !== downloadsReleaseTag || release.draft || release.prerelease || !Array.isArray(release.assets)) return;

        const assets = new Map(release.assets.map((asset) => [asset.name, asset.browser_download_url]));
        const releaseLinks = [...document.querySelectorAll("[data-release-pattern]")];
        const resolvedAssets = releaseLinks.map((link) => {
          const expectedName = link.dataset.releasePattern.replace("{tag}", tag);
          return [link, assets.get(expectedName)];
        });
        if (resolvedAssets.some(([, downloadUrl]) => !downloadUrl)) return;

        resolvedAssets.forEach(([link, downloadUrl]) => { link.href = downloadUrl; });
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
    scene?.syncPlayback();
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
    downloadsCloseTimer = window.setTimeout(() => {
      downloadsModal.hidden = true;
      scene?.syncPlayback();
    }, 260);
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
    const visibleDistance = 2.15;

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
      dot.tabIndex = dotIndex === index ? 0 : -1;
      if (visible) dot.removeAttribute("aria-hidden");
      else dot.setAttribute("aria-hidden", "true");
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
    chapter.addEventListener("scroll", () => {
      if (chapter.classList.contains("active")) syncMobileSceneLayouts();
    }, { passive: true });
  });

  function goTo(next, { instant = false } = {}) {
    next = Math.max(0, Math.min(chapters.length - 1, Number(next)));
    if (!Number.isFinite(next) || (next === current && !instant)) return;

    const old = current;
    const direction = next > old ? 1 : -1;
    if (!instant) playWheelTicks(old, next);
    current = next;
    app.dataset.currentStep = String(next);
    chapters[next].scrollTop = 0;

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

    prevButton.disabled = next === 0;
    nextButton.disabled = next === chapters.length - 1;
    nextButton.textContent = next === chapters.length - 1 ? interfaceCopy[language].current : interfaceCopy[language].next;
    updateLabels(next);
    syncMobileSceneLayouts({ immediate: true });

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
      window.setTimeout(() => {
        syncMobileSceneLayouts({ immediate: true });
        scene.resize();
        scene.syncPlayback({ render: true });
      }, 160);
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
    const eventTarget = event.target instanceof Element ? event.target : null;
    if (eventTarget?.closest('input, textarea, select, [contenteditable="true"]')) return;
    const interactiveTarget = eventTarget?.closest('a, button, summary, [role="button"]');
    if (interactiveTarget && !["Home", "End"].includes(event.key)) return;

    const scrollForward = ["ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !event.shiftKey);
    const scrollBackward = ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey);
    if (scrollForward || scrollBackward) {
      const chapter = activeChapterScroller();
      const pageDistance = ["PageDown", "PageUp", " "].includes(event.key)
        ? (chapter?.clientHeight || window.innerHeight) * .72
        : 72;
      if (scrollActiveChapter(scrollForward ? 1 : -1, pageDistance)) {
        event.preventDefault();
        return;
      }
    }

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
    if (reversed || newGesture) {
      wheelAccumulator = 0;
      wheelScrollingChapter = false;
    }
    wheelDirection = direction;
    wheelLastEventAt = now;

    const activeScroller = activeChapterScroller();
    const overActiveChapter = activeScroller && event.composedPath().includes(activeScroller);
    if (overActiveChapter && chapterCanScroll(direction, activeScroller)) {
      wheelAccumulator = 0;
      wheelScrollingChapter = true;
      return;
    }
    if (wheelScrollingChapter) return;

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
    const scroller = activeChapterScroller();
    const overActiveChapter = scroller && event.composedPath().includes(scroller);
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
      scroller: overActiveChapter ? scroller : null,
      scrollTop: overActiveChapter ? scroller.scrollTop : 0
    };
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    if (downloadsModal && !downloadsModal.hidden) return;
    if (!touchStart) return;
    const gesture = touchStart;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    const elapsed = performance.now() - gesture.time;
    touchStart = null;
    if (elapsed > 800 || Math.abs(dy) < 52 || Math.abs(dy) < Math.abs(dx) * .8) return;
    const direction = dy < 0 ? 1 : -1;
    if (gesture.scroller) {
      const scrolled = Math.abs(gesture.scroller.scrollTop - gesture.scrollTop) > 2;
      if (scrolled || chapterCanScroll(direction, gesture.scroller)) return;
    }
    advance(direction);
  }, { passive: true });

  class StateScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      this.w = 1;
      this.h = 1;
      this.dpr = 1;
      this.step = current;
      this.fromStep = current;
      this.transitionAt = performance.now() - 1000;
      this.lastFrame = 0;
      this.animationFrame = 0;
      this.staticStepRendered = false;
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
      this.photoKeyStartedAt = reducedMotion.matches ? startedAt - PHOTO_KEY_DURATION : startedAt;
      this.photoKeyImageReady = false;
      this.photoKeyImage = new Image();
      this.photoKeyImage.decoding = "async";
      this.photoKeyImage.addEventListener("load", () => {
        this.photoKeyImageReady = true;
        if (this.step === PHOTO_KEY_STEP) {
          this.staticStepRendered = false;
          this.syncPlayback({ render: true });
        }
      });
      this.photoKeyImage.src = "assets/photo-key-demo.webp";
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
      this.starPaths = [];
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
      this.frame = this.frame.bind(this);
      this.resizeObserver = new ResizeObserver(() => {
        const resized = this.resize();
        if (resized && !this.animationFrame && !this.playbackBlocked()) this.draw(performance.now());
        this.syncPlayback();
      });
      this.resizeObserver.observe(canvas);
      this.resize();
      this.handlePlaybackChange = () => this.syncPlayback({ render: true });
      document.addEventListener("visibilitychange", this.handlePlaybackChange);
      reducedMotion.addEventListener?.("change", this.handlePlaybackChange);
      this.syncPlayback({ render: true });
    }

    random(n) {
      let x = (this.seed + n * 0x6d2b79f5) >>> 0;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const mobile = window.innerWidth <= 820;
      const preferredDpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.4);
      const pixelBudget = mobile ? 1500000 : 2400000;
      const budgetDpr = Math.sqrt(pixelBudget / Math.max(1, nextW * nextH));
      const nextDpr = Math.round(Math.max(.75, Math.min(preferredDpr, budgetDpr)) * 1000) / 1000;
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
      this.prepareAtmosphere();
      this.invalidateLayout();
      this.staticStepRendered = false;
      return true;
    }

    prepareAtmosphere() {
      const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (const star of this.stars) {
        const group = Math.min(3, Math.floor((star.a - .08) / .075));
        const x = star.x * this.w;
        const y = star.y * this.h;
        paths[group].moveTo(x + star.r, y);
        paths[group].arc(x, y, star.r, 0, Math.PI * 2);
      }
      this.starPaths = paths;
    }

    invalidateLayout() {
      this.contentRightCache.clear();
    }

    setStep(step, fromStep = this.step) {
      const now = performance.now();
      this.fromStep = reducedMotion.matches ? step : fromStep;
      this.step = step;
      this.transitionAt = reducedMotion.matches ? now - 720 : now;
      if (step === PHOTO_KEY_STEP) {
        this.photoKeyStartedAt = reducedMotion.matches ? now - PHOTO_KEY_DURATION : now;
      }
      this.staticStepRendered = false;
      this.syncPlayback({ render: true });
    }

    playbackBlocked() {
      return document.hidden ||
        this.w <= 2 ||
        this.h <= 2 ||
        (downloadsModal && !downloadsModal.hidden) ||
        (repositoryGate && !repositoryGate.hidden);
    }

    transitioning(now = performance.now()) {
      return this.fromStep !== this.step && now - this.transitionAt < 720;
    }

    shouldAnimate(now = performance.now()) {
      if (reducedMotion.matches || this.playbackBlocked()) return false;
      if (this.step === SOUNDNESS_STEP) return this.transitioning(now);
      if (this.step === PHOTO_KEY_STEP) {
        return this.transitioning(now) || now - this.photoKeyStartedAt < PHOTO_KEY_DURATION;
      }
      return true;
    }

    start() {
      if (this.animationFrame || !this.shouldAnimate()) return;
      this.lastFrame = 0;
      this.animationFrame = requestAnimationFrame(this.frame);
    }

    stop() {
      if (!this.animationFrame) return;
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }

    syncPlayback({ render = false } = {}) {
      if (this.shouldAnimate()) {
        this.start();
        return;
      }
      this.stop();
      if (render && !this.playbackBlocked()) {
        this.draw(performance.now());
        this.staticStepRendered = this.step === SOUNDNESS_STEP || this.step === PHOTO_KEY_STEP;
      }
    }

    frame(now) {
      this.animationFrame = 0;
      if (this.playbackBlocked()) return;

      const transitioning = this.transitioning(now);
      const photoKeyComplete = this.step === PHOTO_KEY_STEP && now - this.photoKeyStartedAt >= PHOTO_KEY_DURATION;
      if ((this.step === SOUNDNESS_STEP || photoKeyComplete) && !transitioning) {
        if (!this.staticStepRendered) this.draw(now);
        this.staticStepRendered = true;
        return;
      }

      if (reducedMotion.matches) {
        this.draw(now);
        return;
      }

      this.staticStepRendered = false;
      const interval = 1000 / 24;
      const elapsed = now - this.lastFrame;
      if (elapsed >= interval) {
        this.lastFrame = now - (elapsed % interval);
        this.draw(now);
      }
      if (this.shouldAnimate(now)) this.animationFrame = requestAnimationFrame(this.frame);
    }

    draw(now) {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      this.drawAtmosphere();

      const raw = Math.min(1, (now - this.transitionAt) / 720);
      const mix = raw < .5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      if (this.fromStep !== this.step && mix < 1) {
        this.drawScene(this.fromStep, 1 - mix, now);
        this.drawScene(this.step, mix, now);
      } else {
        this.drawScene(this.step, 1, now);
      }
    }

    drawAtmosphere() {
      const ctx = this.ctx;
      this.starPaths.forEach((path, group) => {
        ctx.fillStyle = `rgba(191,247,255,${.115 + group * .075})`;
        ctx.fill(path);
      });
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
        this.drawPhotoKey,
        this.drawPagedSpend,
        this.drawHistoryStep,
        this.drawPrivacy,
        this.drawReceipt,
        this.drawProofStack,
        this.drawSoundness,
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

    fittedText(text, x, y, maxWidth, color = "rgba(239,255,248,.72)", size = 9, align = "center", minSize = 5.5) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `650 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      const measured = ctx.measureText(text).width;
      ctx.restore();
      const fittedSize = measured > maxWidth ? Math.max(minSize, size * maxWidth / measured) : size;
      this.text(text, x, y, color, fittedSize, align);
    }

    roundedRect(x, y, width, height, radius, stroke, fill = null, lineWidth = 1) {
      const ctx = this.ctx;
      if (width <= 0 || height <= 0) return;
      const r = Math.max(0, Math.min(radius, width / 2, height / 2));
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
      const bottom = l.mobile ? this.h * .94 : stage.center + sceneHeight / 2;
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
      const labelSize = l.mobile ? 7 : l.compact ? 8.4 : 11;

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
      this.text("π", proverX, centerY, "#effff8", l.mobile ? 8 : l.compact ? 9 : 11);

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

      this.text(canvasText("proveLocally", "PROVE LOCALLY"), proverX, top + labelSize, "rgba(255,255,255,.88)", labelSize);
      this.text(canvasText("verifyEverywhere", "VERIFY EVERYWHERE"), left + width * .82, top + labelSize, "rgba(115,255,197,.90)", labelSize);
      if (!l.mobile && !l.compact) this.text(canvasText("proofBoundary", "PROOF BOUNDARY"), boundaryX, top + labelSize * 3.4, "rgba(191,247,255,.34)", labelSize * .78);
      if (!l.mobile) {
        this.text(canvasText("proveTransition", "PROVE THE TRANSITION"), (proverX + boundaryX) / 2, centerY + proverRadius + 29, "rgba(194,170,255,.86)", labelSize);
        this.text(canvasText("liveStateAdvances", "LIVE STATE ADVANCES"), (stripLeft + stripRight) / 2, bottom - 7, stateProgress > .5 ? "rgba(115,255,197,.72)" : "rgba(115,255,197,.38)", labelSize * .82);
      }

      ctx.restore();
    }

    drawPresent(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const right = this.w * (l.mobile ? .95 : .93);
      const baselineLeft = this.w * (l.mobile ? .05 : l.compact ? .56 : .45);
      let left = baselineLeft;
      if (!l.mobile && presentDetails) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const contentRect = presentDetails.getBoundingClientRect();
        const contentBoundary = contentRect.right - canvasRect.left;
        const proportionalGap = this.w * .018;
        left = Math.min(right - this.w * .30, Math.max(baselineLeft, contentBoundary + proportionalGap));
      }
      const top = this.h * (l.mobile ? .045 : .25);
      const bottom = this.h * (l.mobile ? .93 : .72);
      const width = right - left;
      const height = bottom - top;
      const labelSize = l.mobile ? 8 : l.compact ? 10.2 : 12;
      const annotationSize = l.mobile ? 6.1 : labelSize * .73;
      const columns = l.mobile ? 26 : l.compact ? 34 : 40;
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
      const axisLabelY = l.mobile ? axisY - 8 : axisY + 12;
      this.text(canvasText("today", "TODAY"), left, axisLabelY, "rgba(191,247,255,.52)", annotationSize, "left");
      this.text(canvasText("tenYears", "+10 YEARS"), right, axisLabelY, "rgba(191,247,255,.72)", annotationSize, "right");

      this.fittedText(
        canvasText("historyBasedValidation", "HISTORY-BASED VALIDATION"),
        left,
        top,
        width * .66,
        "rgba(255,149,125,.95)",
        labelSize,
        "left"
      );
      this.fittedText(
        canvasText("bootstrapBurdenAccumulates", "BOOTSTRAP BURDEN ACCUMULATES"),
        left,
        top + labelSize * 1.55,
        width * .82,
        "rgba(255,149,125,.56)",
        annotationSize,
        "left"
      );

      const historyBase = top + height * .36;
      const historyMax = height * .20;

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
      this.fittedText(
        canvasText("bootstrapBurdenGrows", "BOOTSTRAP BURDEN GROWS WITH HISTORY"),
        right,
        historyBase + labelSize * 1.45,
        width,
        "rgba(255,149,125,.72)",
        annotationSize,
        "right"
      );

      const stateTop = top + height * .57;
      const stateRows = l.mobile ? 3 : 4;
      const stateHeight = height * (l.mobile ? .12 : .13);
      const stateCellHeight = (stateHeight - gap * (stateRows - 1)) / stateRows;
      this.text(
        canvasText("parano1d", "PARANO1D"),
        left,
        stateTop,
        "rgba(115,255,197,.96)",
        labelSize,
        "left"
      );
      this.fittedText(
        canvasText("liveStateRecursiveProof", "LIVE STATE + RECURSIVE HISTORY PROOF"),
        right,
        stateTop,
        width * .73,
        "rgba(194,170,255,.78)",
        annotationSize,
        "right"
      );
      this.fittedText(
        canvasText("slotsReused", "SPENT SLOTS CLEAR · NEW OUTPUTS REUSE THEM"),
        left,
        stateTop + labelSize * 1.65,
        width,
        "rgba(115,255,197,.57)",
        annotationSize,
        "left"
      );

      const gridTop = stateTop + labelSize * 3;
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

      this.fittedText(
        canvasText("storageTracksLive", "STORAGE TRACKS LIVE UTXOs, NOT CHAIN AGE"),
        right,
        gridTop + stateHeight + labelSize * 1.25,
        width,
        "rgba(115,255,197,.76)",
        annotationSize,
        "right"
      );
    }

    drawReplay(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const right = this.w * (l.mobile ? .95 : .93);
      const fallbackLeft = this.w * (l.compact ? .56 : .45);
      const contentEdge = this.contentRight("#dependency h2, #dependency .lead, #dependency .ledger");
      const left = l.mobile ? this.w * .05 : Math.max(fallbackLeft, contentEdge + this.w * .018);
      const top = this.h * (l.mobile ? .06 : .255);
      const bottom = this.h * (l.mobile ? .91 : .72);
      const width = right - left;
      const height = bottom - top;
      const labelSize = l.mobile ? 8 : l.compact ? 10.2 : 12;
      const annotationSize = l.mobile ? 6.1 : labelSize * .74;
      const flowY = top + height * .47;
      const stateWidth = width * (l.mobile ? .235 : .225);
      const stateHeight = height * (l.mobile ? .31 : .29);
      const stateX = right - stateWidth;
      const stateY = flowY - stateHeight * .5;
      const genesisX = left + width * .025;
      const historyStart = left + width * .13;
      const historyEnd = stateX - width * .065;
      const historyWidth = historyEnd - historyStart;

      this.fittedText(
        canvasText("presentDerived", "THE PRESENT IS DERIVED FROM THE PAST"),
        left + width * .5,
        top,
        width,
        "rgba(239,255,248,.90)",
        labelSize
      );
      this.fittedText(
        canvasText("historyDependency", "HISTORY DEPENDENCY"),
        left,
        top + labelSize * 2.35,
        width * .55,
        "rgba(255,149,125,.92)",
        labelSize * .9,
        "left"
      );
      this.fittedText(
        canvasText("persistsWithAge", "PERSISTS WITH NETWORK AGE"),
        left,
        top + labelSize * 3.7,
        width * .68,
        "rgba(255,149,125,.52)",
        annotationSize,
        "left"
      );

      this.line([[genesisX, flowY], [stateX, flowY]], "rgba(255,149,125,.27)", 1);
      this.dot(genesisX, flowY, l.mobile ? 1.7 : 2.1, "#ff957d", l.mobile ? 4 : 7);
      this.text(canvasText("genesis", "GENESIS"), genesisX, flowY + stateHeight * .69, "rgba(255,149,125,.66)", annotationSize);

      const count = l.mobile ? 13 : 19;
      const gap = l.mobile ? 2 : 3;
      const cellWidth = (historyWidth - gap * (count - 1)) / count;
      const phase = (now * .000075) % 1;
      const activeCell = Math.min(count - 1, Math.floor(phase * count));
      for (let i = 0; i < count; i += 1) {
        const t = i / Math.max(1, count - 1);
        const x = historyStart + i * (cellWidth + gap);
        const cellHeight = stateHeight * (.22 + t * .23);
        const y = flowY - cellHeight * .5;
        const active = i === activeCell;
        ctx.fillStyle = active ? "rgba(255,149,125,.34)" : `rgba(255,149,125,${.045 + t * .095})`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.strokeStyle = active ? "rgba(255,205,190,.82)" : `rgba(255,149,125,${.19 + t * .20})`;
        ctx.lineWidth = active ? .9 : .55;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
      const pulseX = historyStart + historyWidth * phase;
      this.dot(pulseX, flowY, l.mobile ? 1.3 : 1.8, "#ff957d", l.mobile ? 3 : 6);

      this.fittedText(
        canvasText("accumulatedHistory", "ACCUMULATED HISTORY"),
        historyStart + historyWidth * .5,
        flowY - stateHeight * .43,
        historyWidth,
        "rgba(255,149,125,.88)",
        labelSize * .82
      );
      this.fittedText(
        canvasText("everyPastTransition", "EVERY PAST TRANSITION"),
        historyStart + historyWidth * .5,
        flowY + stateHeight * .43,
        historyWidth,
        "rgba(255,149,125,.48)",
        annotationSize
      );

      this.text(canvasText("now", "NOW"), historyEnd, flowY - stateHeight * .36, "rgba(191,247,255,.76)", annotationSize);
      this.line([[historyEnd, flowY], [stateX, flowY]], "rgba(191,247,255,.45)", 1.05, 4);
      this.dot(historyEnd, flowY, l.mobile ? 1.6 : 2.1, "#bff7ff", l.mobile ? 3 : 6);

      this.roundedRect(stateX, stateY, stateWidth, stateHeight, l.mobile ? 7 : 10, "rgba(191,247,255,.34)", "rgba(9,27,27,.58)", .9);
      this.text(canvasText("stateLabel", "STATE"), stateX + stateWidth * .5, stateY + stateHeight * .30, "rgba(191,247,255,.92)", labelSize * .88);
      this.text(canvasText("derived", "DERIVED"), stateX + stateWidth * .5, stateY + stateHeight * .53, "rgba(239,255,248,.72)", annotationSize);
      this.text(canvasText("fromHistory", "FROM HISTORY"), stateX + stateWidth * .5, stateY + stateHeight * .69, "rgba(239,255,248,.72)", annotationSize);

      const modes = [
        canvasText("replay", "REPLAY"),
        canvasText("historySnapshot", "SNAPSHOT"),
        canvasText("checkpoint", "CHECKPOINT")
      ];
      const modesTop = top + height * .79;
      const modesWidth = width * (l.mobile ? .78 : .72);
      const modesLeft = left + (width - modesWidth) * .5;
      const modeGap = width * .018;
      const modeWidth = (modesWidth - modeGap * 2) / 3;
      const modeHeight = l.mobile ? 20 : 27;
      modes.forEach((mode, i) => {
        const x = modesLeft + i * (modeWidth + modeGap);
        const selected = Math.floor((now * .00022) % 3) === i;
        const sourceX = historyStart + historyWidth * (.18 + i * .32);
        this.line([[sourceX, flowY + stateHeight * .25], [x + modeWidth * .5, modesTop]], selected ? "rgba(191,247,255,.34)" : "rgba(191,247,255,.10)", .65);
        this.roundedRect(x, modesTop, modeWidth, modeHeight, l.mobile ? 5 : 7, selected ? "rgba(191,247,255,.58)" : "rgba(191,247,255,.18)", selected ? "rgba(191,247,255,.055)" : "rgba(7,20,20,.40)", .75);
        this.fittedText(mode, x + modeWidth * .5, modesTop + modeHeight * .52, modeWidth - 8, selected ? "rgba(191,247,255,.92)" : "rgba(191,247,255,.52)", annotationSize, "center", 4.8);
      });
    }

    drawProofFlow(now) {
      const l = this.layout();
      const right = l.mobile ? this.w * .87 : this.w * (l.compact ? .92 : .88);
      const radius = l.mobile ? 25 : 31;
      const fallbackLeft = this.w * (l.compact ? .59 : .48);
      const contentEdge = this.contentRight("#proof-native h2, #proof-native .lead, #proof-native .role-list");
      const left = l.mobile
        ? this.w * .13
        : Math.max(fallbackLeft, contentEdge + radius + this.w * (l.compact ? .018 : .022));
      const y = this.h * .48;
      const positions = [left, (left + right) / 2, right];
      const labels = ["W", "M", "N"];
      const colors = ["#ff957d", "#bff7ff", "#73ffc5"];
      const technicalLabels = l.mobile ? null : [
        canvasText("privateWitness", "PRIVATE WITNESS"),
        canvasText("publicTransition", "PUBLIC TRANSITION"),
        canvasText("verifyAndApply", "VERIFY AND APPLY")
      ];
      const mobileActionLabels = l.mobile ? [
        [canvasText("proofActionProves", "PROVES"), canvasText("proofActionAuthorization", "AUTHORIZATION")],
        [canvasText("proofActionProves", "PROVES"), canvasText("proofActionTransition", "TRANSITION")],
        [canvasText("proofActionVerifies", "VERIFIES"), canvasText("proofActionApplies", "APPLIES")]
      ] : null;
      const roleLabels = [
        canvasText("walletRole", "WALLET"),
        canvasText("minerRole", "MINER"),
        canvasText("networkRole", "NETWORK")
      ];
      const technicalSize = l.mobile ? 7 : 8.2;
      const roleSize = l.mobile ? 6.2 : 7.5;

      this.line([[left, y], [right, y]], "rgba(115,255,197,.14)", 1);
      positions.forEach((x, i) => {
        this.node(x, y, radius, labels[i], colors[i], now);
        if (technicalLabels) this.text(technicalLabels[i], x, y - radius - 20, `${colors[i]}cc`, technicalSize);
        if (mobileActionLabels) {
          this.text(mobileActionLabels[i][0], x, y - radius - 24, `${colors[i]}c2`, technicalSize * .88);
          this.text(mobileActionLabels[i][1], x, y - radius - 14, `${colors[i]}f2`, technicalSize);
        }
        this.text(roleLabels[i], x, y + radius + (l.mobile ? 14 : 20), `${colors[i]}c2`, roleSize);
      });
      for (let lane = 0; lane < 3; lane += 1) {
        this.packetAlong(left + radius, y, positions[1] - radius, y, now * .00018 + lane * .33, "#c2aaff", 1.8);
        this.packetAlong(positions[1] + radius, y, right - radius, y, now * .00018 + .16 + lane * .33, "#73ffc5", 1.8);
      }
      if (!l.mobile) {
        this.text(canvasText("authorizationProof", "PROOF OF AUTHORIZATION"), (positions[0] + positions[1]) / 2, y - 22, "rgba(194,170,255,.72)", 7.5);
        this.text(canvasText("stateTransitionProof", "PROOF OF EXACT STATE TRANSITION"), (positions[1] + positions[2]) / 2, y - 22, "rgba(115,255,197,.72)", 7.5);
      }
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
      this.text(
        canvasText(l.mobile ? "emptyHalfShort" : "virtualHalf", l.mobile ? "EMPTY HALF" : "VIRTUAL EMPTY HALF"),
        l.mobile ? this.w * .94 : segmentX + segmentW / 2,
        bottom + 18,
        "rgba(115,255,197,.43)",
        l.mobile ? 5.8 : 7,
        l.mobile ? "right" : "center"
      );
      this.line([[board.x + board.w, (top + bottom) / 2], [segmentX, (top + bottom) / 2]], "rgba(115,255,197,.18)", 1);
    }

    drawOwnership(now) {
      const l = this.layout();
      const fallbackLeft = this.w * (l.compact ? .59 : .48);
      const contentEdge = this.contentRight("#ownership h2, #ownership .lead, #ownership .ledger");
      const left = l.mobile ? this.w * .13 : Math.max(fallbackLeft, contentEdge + 42);
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
      if (l.mobile) {
        if (this.h >= 120) {
          const labelY = y + radius + 13;
          this.text(canvasText("secret", "SECRET"), left, labelY, "rgba(255,149,125,.58)", 5.8);
          this.text(canvasText("o1Address", "O1 ADDRESS"), right, labelY, "rgba(115,255,197,.58)", 5.8);
        }
      } else if (!compactMobile) {
        const labelSize = 7.5;
        this.text(canvasText("secret", "SECRET"), left, y + radius + 23, "rgba(255,149,125,.58)", labelSize);
        this.text("POSEIDON2B", mid, y + radius + 23, "rgba(194,170,255,.62)", labelSize);
        this.text(canvasText("o1Address", "O1 ADDRESS"), right, y + radius + 23, "rgba(115,255,197,.58)", labelSize);
        this.text(canvasText("zeroKnowledgeProof", "ZERO-KNOWLEDGE PROOF"), right, y - radius - 23, "rgba(194,170,255,.72)", labelSize);
      }
    }

    drawPhotoKey(now) {
      const l = this.layout();
      const ctx = this.ctx;
      if (this.w < 40 || this.h < 48) return;
      const elapsed = reducedMotion.matches
        ? PHOTO_KEY_DURATION
        : Math.max(0, now - this.photoKeyStartedAt);
      const progress = Math.max(0, Math.min(1, elapsed / PHOTO_KEY_DURATION));
      const scanProgress = this.ease((progress - .06) / .62);
      const coreProgress = this.ease((progress - .31) / .30);
      const secretProgress = this.ease((progress - .50) / .38);
      const finalProgress = this.ease((progress - .76) / .18);

      let left;
      let right;
      let top;
      let bottom;
      if (l.mobile) {
        left = this.w * .06;
        right = this.w * .94;
        top = this.h * .04;
        bottom = this.h * .94;
      } else {
        const stage = this.desktopStageBounds();
        const contentEdge = this.contentRight("#photo-key h2, #photo-key .lead, #photo-key .chapter-actions .action");
        left = Math.max(this.w * (l.compact ? .565 : .475), contentEdge + (l.compact ? 22 : 38));
        right = this.w * (l.compact ? .94 : .91);
        top = stage.top + Math.max(15, (stage.bottom - stage.top) * .07);
        bottom = stage.bottom - Math.max(17, (stage.bottom - stage.top) * .06);
      }

      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);
      const optionHeight = l.mobile ? Math.max(19, Math.min(24, height * .13)) : 32;
      const optionGap = l.mobile ? 5 : 8;
      const optionRowGap = l.mobile ? Math.max(9, Math.min(12, height * .055)) : 18;
      const optionWidth = Math.min(width, l.mobile ? 260 : 330);
      const generateWidth = optionWidth * .28;
      const importWidth = optionWidth * .25;
      const photoWidth = optionWidth - generateWidth - importWidth - optionGap * 2;
      const visualBottom = bottom - (l.mobile ? 1 : 28);
      const visualHeight = Math.max(24, visualBottom - top - optionHeight - optionRowGap);
      const photoFrameWidth = Math.max(
        30,
        Math.min(
          l.mobile ? 72 : (l.compact ? 108 : 142),
          width * (l.mobile ? .25 : .29),
          visualHeight * .75
        )
      );
      const photoFrameHeight = photoFrameWidth * 4 / 3;
      const groupHeight = optionHeight + optionRowGap + photoFrameHeight;
      const groupTop = top + Math.max(0, (visualBottom - top - groupHeight) / 2);
      const optionLift = l.mobile
        ? Math.max(6, Math.min(10, height * .04))
        : (l.compact ? 14 : 18);
      const optionY = Math.max(top, groupTop - optionLift);
      const photoX = left;
      const photoY = groupTop + optionHeight + optionRowGap;
      const centerY = photoY + photoFrameHeight / 2;
      const scanY = photoY + photoFrameHeight * scanProgress;
      let optionX = left + (width - optionWidth) / 2;
      const optionTextSize = l.mobile ? Math.max(5.4, Math.min(7, optionHeight * .31)) : 8.8;
      const options = [
        [canvasText("photoGenerate", "GENERATE"), generateWidth, false],
        [canvasText("photoImport", "IMPORT"), importWidth, false],
        [canvasText("photoOption", "PHOTO KEY"), photoWidth, true]
      ];
      options.forEach(([label, optionCellWidth, active]) => {
        this.roundedRect(
          optionX,
          optionY,
          optionCellWidth,
          optionHeight,
          optionHeight / 2,
          active ? "rgba(194,170,255,.72)" : "rgba(115,255,197,.16)",
          active ? "rgba(194,170,255,.12)" : "rgba(4,18,14,.42)",
          active ? 1.1 : .8
        );
        this.text(
          label,
          optionX + optionCellWidth / 2,
          optionY + optionHeight / 2 + .3,
          active ? "rgba(223,213,255,.95)" : "rgba(154,177,167,.55)",
          optionTextSize
        );
        optionX += optionCellWidth + optionGap;
      });

      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoFrameWidth, photoFrameHeight);
      ctx.clip();
      ctx.fillStyle = "rgba(4,13,12,.88)";
      ctx.fillRect(photoX, photoY, photoFrameWidth, photoFrameHeight);
      if (this.photoKeyImageReady) {
        ctx.globalAlpha *= .38;
        ctx.drawImage(this.photoKeyImage, photoX, photoY, photoFrameWidth, photoFrameHeight);
        ctx.globalAlpha /= .38;
        ctx.fillStyle = "rgba(2,11,9,.38)";
        ctx.fillRect(photoX, photoY, photoFrameWidth, photoFrameHeight);
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoFrameWidth, photoFrameHeight * scanProgress);
        ctx.clip();
        ctx.globalAlpha *= .92;
        ctx.drawImage(this.photoKeyImage, photoX, photoY, photoFrameWidth, photoFrameHeight);
        ctx.globalAlpha /= .92;
        ctx.fillStyle = "rgba(115,255,197,.045)";
        ctx.fillRect(photoX, photoY, photoFrameWidth, photoFrameHeight * scanProgress);
        ctx.restore();
      } else {
        const placeholder = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoFrameHeight);
        placeholder.addColorStop(0, "rgba(194,170,255,.12)");
        placeholder.addColorStop(1, "rgba(115,255,197,.05)");
        ctx.fillStyle = placeholder;
        ctx.fillRect(photoX, photoY, photoFrameWidth, photoFrameHeight);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoFrameWidth, Math.max(0, photoFrameHeight * scanProgress));
      ctx.clip();
      ctx.strokeStyle = "rgba(191,247,255,.12)";
      ctx.lineWidth = .55;
      const gridStep = Math.max(7, photoFrameWidth / 7);
      for (let x = photoX + gridStep; x < photoX + photoFrameWidth; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, photoY);
        ctx.lineTo(x, photoY + photoFrameHeight);
        ctx.stroke();
      }
      for (let y = photoY + gridStep; y < photoY + photoFrameHeight; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(photoX, y);
        ctx.lineTo(photoX + photoFrameWidth, y);
        ctx.stroke();
      }
      ctx.restore();

      const statusHeight = Math.max(10, Math.min(l.mobile ? 14 : 18, photoFrameHeight * .14));
      ctx.fillStyle = "rgba(1,8,7,.78)";
      ctx.fillRect(photoX, photoY + photoFrameHeight - statusHeight, photoFrameWidth, statusHeight);
      ctx.restore();

      this.roundedRect(
        photoX,
        photoY,
        photoFrameWidth,
        photoFrameHeight,
        l.mobile ? 4 : 6,
        "rgba(115,255,197,.42)",
        null,
        1
      );

      const scanLineAlpha = 1 - this.ease((progress - .78) / .13);
      if (scanLineAlpha > .01) {
        ctx.save();
        ctx.globalAlpha *= scanLineAlpha;
        const scanGlow = ctx.createLinearGradient(photoX, scanY - 10, photoX, scanY + 7);
        scanGlow.addColorStop(0, "rgba(115,255,197,0)");
        scanGlow.addColorStop(.72, "rgba(115,255,197,.20)");
        scanGlow.addColorStop(1, "rgba(115,255,197,0)");
        ctx.fillStyle = scanGlow;
        ctx.fillRect(photoX, scanY - 10, photoFrameWidth, 17);
        this.line([[photoX, scanY], [photoX + photoFrameWidth, scanY]], "rgba(115,255,197,.95)", 1, 9);
        ctx.restore();
      }

      const corner = l.mobile ? 5 : 8;
      const bracket = "rgba(191,247,255,.78)";
      this.line([[photoX, photoY + corner], [photoX, photoY], [photoX + corner, photoY]], bracket, 1);
      this.line([[photoX + photoFrameWidth - corner, photoY], [photoX + photoFrameWidth, photoY], [photoX + photoFrameWidth, photoY + corner]], bracket, 1);
      this.line([[photoX, photoY + photoFrameHeight - corner], [photoX, photoY + photoFrameHeight], [photoX + corner, photoY + photoFrameHeight]], bracket, 1);
      this.line([[photoX + photoFrameWidth - corner, photoY + photoFrameHeight], [photoX + photoFrameWidth, photoY + photoFrameHeight], [photoX + photoFrameWidth, photoY + photoFrameHeight - corner]], bracket, 1);

      const scanLabel = scanProgress < 1
        ? `${canvasText("photoScan", "SCANNING PIXELS")} · ${Math.round(scanProgress * 100)}%`
        : canvasText("photoCanonical", "CANONICAL RGBA8");
      this.text(
        scanLabel,
        photoX + photoFrameWidth / 2,
        photoY + photoFrameHeight - statusHeight / 2,
        "rgba(191,247,255,.88)",
        l.mobile ? Math.max(3.7, Math.min(5, photoFrameWidth / 15)) : 6.2
      );

      if (!l.mobile || this.h >= 132) {
        this.text(
          canvasText("photoLocal", "LOCAL · NO UPLOAD"),
          photoX + photoFrameWidth / 2,
          photoY - (l.mobile ? 6 : 12),
          "rgba(115,255,197,.58)",
          l.mobile ? 4.6 : 6.6
        );
      }

      const coreX = left + width * (l.mobile ? .52 : .54);
      const coreSize = Math.max(18, Math.min(l.mobile ? 36 : 54, width * .14, visualHeight * .30));
      const photoEdge = photoX + photoFrameWidth;
      const coreEdge = coreX - coreSize / 2;
      this.line([[photoEdge, centerY], [coreEdge, centerY]], "rgba(115,255,197,.16)", .9);
      if (coreProgress > .01) {
        const relayX = photoEdge + (coreEdge - photoEdge) * coreProgress;
        this.dot(relayX, centerY, l.mobile ? 1.2 : 1.8, "#73ffc5", l.mobile ? 4 : 8);
      }

      ctx.save();
      ctx.translate(coreX, centerY);
      ctx.rotate((progress - .5) * .5);
      ctx.globalAlpha *= .25 + coreProgress * .75;
      for (let ring = 0; ring < 3; ring += 1) {
        const inset = ring * coreSize * .16;
        ctx.strokeStyle = ring === 0 ? "rgba(194,170,255,.82)" : `rgba(194,170,255,${.46 - ring * .10})`;
        ctx.lineWidth = ring === 0 ? 1.1 : .7;
        ctx.strokeRect(-coreSize / 2 + inset, -coreSize / 2 + inset, coreSize - inset * 2, coreSize - inset * 2);
      }
      ctx.restore();
      this.text("B3", coreX, centerY, "rgba(223,213,255,.92)", l.mobile ? 6 : 8.5);
      if (!l.mobile || this.h >= 145) {
        this.text(
          canvasText("photoDerive", "BLAKE3 · DERIVE KEY"),
          coreX,
          centerY + coreSize / 2 + (l.mobile ? 7 : 13),
          "rgba(194,170,255,.62)",
          l.mobile ? 4.2 : 6.4
        );
      }

      const gridColumns = 8;
      const gridRows = 4;
      const cellGap = l.mobile ? 1.1 : 1.8;
      const secretAreaLeft = left + width * (l.mobile ? .68 : .70);
      const secretAreaWidth = Math.max(20, right - secretAreaLeft);
      const cellSize = Math.max(
        2.8,
        Math.min(
          l.mobile ? 8 : 11,
          (secretAreaWidth - cellGap * (gridColumns - 1)) / gridColumns,
          (visualHeight * .47 - cellGap * (gridRows - 1)) / gridRows
        )
      );
      const secretWidth = cellSize * gridColumns + cellGap * (gridColumns - 1);
      const secretHeight = cellSize * gridRows + cellGap * (gridRows - 1);
      const secretX = right - secretWidth;
      const secretY = centerY - secretHeight / 2;
      const secretEdge = secretX;
      this.line([[coreX + coreSize / 2, centerY], [secretEdge, centerY]], "rgba(194,170,255,.17)", .9);
      if (secretProgress > .01) {
        const relayX = coreX + coreSize / 2 + (secretEdge - coreX - coreSize / 2) * secretProgress;
        this.dot(relayX, centerY, l.mobile ? 1.2 : 1.8, "#c2aaff", l.mobile ? 4 : 8);
      }

      for (let index = 0; index < gridColumns * gridRows; index += 1) {
        const col = index % gridColumns;
        const row = Math.floor(index / gridColumns);
        const x = secretX + col * (cellSize + cellGap);
        const y = secretY + row * (cellSize + cellGap);
        const threshold = (index + 1) / (gridColumns * gridRows);
        const revealed = secretProgress >= threshold;
        const violet = this.random(4700 + index * 17) > .72;
        ctx.fillStyle = revealed
          ? (violet ? "rgba(194,170,255,.56)" : "rgba(115,255,197,.50)")
          : "rgba(115,255,197,.018)";
        ctx.strokeStyle = revealed ? "rgba(191,247,255,.40)" : "rgba(115,255,197,.11)";
        ctx.lineWidth = .65;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeRect(x, y, cellSize, cellSize);
      }

      this.text(
        canvasText("photoSecret", "MASTER SECRET · 256 BIT"),
        secretX + secretWidth / 2,
        secretY - (l.mobile ? 6 : 13),
        secretProgress > .05 ? "rgba(115,255,197,.82)" : "rgba(115,255,197,.22)",
        l.mobile ? 4.4 : 6.8
      );

      if (!l.mobile || this.h >= 128) {
        this.text(
          canvasText("photoSame", "SAME PIXELS · SAME WALLET"),
          secretX + secretWidth / 2,
          secretY + secretHeight + (l.mobile ? 7 : 13),
          `rgba(191,247,255,${.18 + finalProgress * .55})`,
          l.mobile ? 4.1 : 6.5
        );
      }

      if (!l.mobile) {
        const footerY = bottom - 5;
        this.text("KEY ID · 9797·9fd6·57ba·9ad9", left, footerY, `rgba(194,170,255,${.18 + finalProgress * .62})`, 7, "left");
        this.text(canvasText("photoAddress", "O1 ADDRESS"), right, footerY, `rgba(115,255,197,${.18 + finalProgress * .56})`, 7, "right");
      }
    }

    drawPagedSpend(now) {
      const l = this.layout();
      const txX = l.mobile ? this.w * .71 : this.w * (l.compact ? .83 : .80);
      const txW = l.mobile ? Math.min(112, this.w * .31) : (l.compact ? 132 : 168);
      const txH = l.mobile ? Math.min(72, this.h * .52) : 88;
      const ingressX = txX - txW / 2;
      const fallbackLeft = this.w * (l.compact ? .58 : .47);
      const contentEdge = this.contentRight("#paged-spend h2, #paged-spend .lead");
      const preferredLeft = Math.max(fallbackLeft, contentEdge + 42);
      const left = l.mobile ? this.w * .10 : Math.min(preferredLeft, ingressX - 44);
      const cy = this.h * .48;
      const pageCount = 6;
      const pagesPerSide = pageCount / 2;
      const spread = this.h * (l.mobile ? .34 : .28);
      for (let i = 0; i < pageCount; i += 1) {
        const slot = i < pagesPerSide ? i : i + 2;
        const lane = slot / (pageCount + 1) - .5;
        const x = left;
        const y = cy + lane * spread;
        const w = l.mobile ? 18 : 24;
        const h = l.mobile ? 9 : 12;
        this.roundedRect(x, y - h / 2, w, h, 2, "rgba(115,255,197,.35)", "rgba(115,255,197,.07)");
        this.path((p) => {
          p.moveTo(x + w, y);
          p.bezierCurveTo(x + (ingressX - x) * .46, y, ingressX - 24, cy, ingressX, cy);
        }, "rgba(115,255,197,.12)", .8);
        if (i % 4 === 0) {
          const phase = (now * .00013 + i / pageCount) % 1;
          const px = x + w + (ingressX - x - w) * phase;
          const py = y + (cy - y) * phase * phase;
          this.dot(px, py, 1.4, "#73ffc5", 6);
        }
      }
      for (const offset of [-7, 0, 7]) {
        this.dot(left + (l.mobile ? 9 : 12), cy + offset, 1.05, "rgba(115,255,197,.6)", 3);
      }
      this.roundedRect(txX - txW / 2, cy - txH / 2, txW, txH, 13, "rgba(194,170,255,.72)", "rgba(194,170,255,.08)", 1.2);
      this.text(
        canvasText(l.mobile ? "pagedCapacityShort" : "pagedCapacity", l.mobile ? "1,020 IN · 256 OUT" : "1,020 INPUTS · 256 OUTPUTS"),
        txX,
        cy - 11,
        "rgba(239,255,248,.62)",
        l.mobile ? 5.3 : (l.compact ? 6.5 : 7.5)
      );
      this.text(
        canvasText(l.mobile ? "pagedSpendShort" : "oneAtomicPagedSpend", l.mobile ? "ONE PAGEDSPEND" : "ONE ATOMIC PAGEDSPEND"),
        txX,
        cy + 11,
        "#c2aaff",
        l.mobile ? 5.8 : (l.compact ? 7 : 8.2)
      );
      const acceptanceX = this.w * (l.mobile ? .93 : (l.compact ? .95 : .91));
      this.node(acceptanceX, cy, l.mobile ? 14 : 18, "✓", "#73ffc5", now);

    }

    drawHistoryStep(now) {
      const l = this.layout();
      const mobileScale = l.mobile ? Math.min(1, Math.max(.55, this.h / 128)) : 1;
      const showPrimaryLabel = !l.mobile || this.h >= 110;
      const mid = l.mobile ? this.w * .52 : this.w * (l.compact ? .75 : .69);
      const right = l.mobile ? this.w * .87 : this.w * (l.compact ? .92 : .88);
      const y = this.h * (l.mobile && this.h < 110 ? .38 : l.mobile ? .40 : .45);
      const r = l.mobile ? 21 * mobileScale : 28;
      const gridSize = l.mobile ? 48 * mobileScale : 62;
      const fallbackLeft = this.w * (l.compact ? .59 : .49);
      const contentEdge = this.contentRight("#history-step h2, #history-step .lead, #history-step .formula, #history-step .ledger");
      const preferredLeft = Math.max(fallbackLeft, contentEdge + 42);
      const left = l.mobile ? this.w * .14 : Math.min(preferredLeft, mid - gridSize / 2 - r - 24);
      this.node(left, y, r, "πₕ₋₁", "#c2aaff", now);

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
      if (!l.mobile) {
        this.text(canvasText("blockState", "BLOCK_H + STATE_H"), mid, y + gridSize / 2 + 22, "rgba(115,255,197,.58)", 7.5);
      }

      this.node(right, y, r + 4, "πₕ", "#c2aaff", now);
      this.line([[left + r, y], [mid - gridSize / 2, y]], "rgba(194,170,255,.28)", 1);
      this.line([[mid + gridSize / 2, y], [right - r - 4, y]], "rgba(194,170,255,.34)", 1.2, 7);
      for (let i = 0; i < 3; i += 1) {
        this.packetAlong(left + r, y, mid - gridSize / 2, y, now * .0002 + i / 3, "#c2aaff", 1.8);
        this.packetAlong(mid + gridSize / 2, y, right - r - 4, y, now * .0002 + .2 + i / 3, "#c2aaff", 1.8);
      }
      if (showPrimaryLabel) {
        const sameSizeKey = l.mobile ? "sameSizeShort" : "sameSize";
        const sameSizeText = l.mobile ? "SAME SIZE" : "SAME TERMINAL SIZE";
        const sameSizeY = l.mobile ? Math.max(8, y - r - 15) : y + r + 26;
        this.text(canvasText(sameSizeKey, sameSizeText), right, sameSizeY, "rgba(194,170,255,.64)", l.mobile ? 5.8 : 8);
      }
      const tailY = this.h * (l.mobile ? (showPrimaryLabel ? .84 : .82) : .77);
      this.drawTail(left, right, tailY, now);
    }

    drawPrivacy(now) {
      const l = this.layout();
      const ctx = this.ctx;
      const stage = l.mobile ? null : this.desktopStageBounds();
      const left = l.mobile ? this.w * .055 : this.w * (l.compact ? .575 : .465);
      const right = l.mobile ? this.w * .945 : this.w * (l.compact ? .93 : .91);
      const width = right - left;
      const streamY = this.h * .34;
      const trackerY = this.h * .72;
      const stateW = Math.min(l.mobile ? 76 : 104, width * (l.mobile ? .24 : .22));
      const stateH = Math.min(l.mobile ? 56 : 68, this.h * (l.mobile ? .38 : .34));
      const stateX = right - stateW * .55;
      const streamEnd = stateX - stateW * .58;
      const tapX = left + width * .39;
      const trackerX = left + width * .28;
      const labelSize = l.mobile ? Math.max(4.4, Math.min(6.2, this.h * .034)) : 7.4;
      const headerY = l.mobile
        ? this.h * .10
        : stage.top + (app.classList.contains("launch-notice-visible") ? 48 : 20);

      if (!l.mobile) {
        this.text(canvasText("transparentNow", "TRANSPARENT NOW"), right, headerY, "rgba(191,247,255,.52)", labelSize, "right");
      }
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
      this.node(trackerX, trackerY, l.mobile ? 15 : 19, "T", "#ff957d", now);
      this.text(
        canvasText(l.mobile ? "externalArchiveShort" : "externalArchiver", l.mobile ? "EXTERNAL ARCHIVE" : "EXTERNAL ARCHIVER"),
        trackerX,
        trackerY + (l.mobile ? 24 : 31),
        "rgba(255,149,125,.72)",
        labelSize
      );
      if (!l.mobile) {
        this.text(canvasText("recordStream", "RECORDS THE STREAM"), trackerX, trackerY + 43, "rgba(255,149,125,.43)", labelSize * .74);
      }

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
      if (!l.mobile) {
        this.text(canvasText("permanentGraph", "PERMANENT GRAPH"), archiveRight, this.h * .88, "rgba(255,149,125,.68)", labelSize * .88, "right");
        this.text(canvasText("externalRetention", "REQUIRES EXTERNAL RETENTION"), archiveRight, this.h * .93, "rgba(255,149,125,.48)", labelSize * .74, "right");
      }
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
        const preferredLeft = Math.max(left, contentRight + this.w * (l.compact ? .016 : .022));
        left = Math.min(right - this.w * .30, preferredLeft);
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
      this.text(
        canvasText(l.mobile ? "receiptShort" : "portableReceipt", l.mobile ? "RECEIPT" : "PORTABLE RECEIPT"),
        receiptX,
        y - cardH * .39,
        "rgba(194,170,255,.88)",
        labelSize * .86
      );
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
      if (!l.mobile) {
        this.text(canvasText("merklePath8", "MERKLE PATH ×8"), (pathStart + pathEnd) / 2, pathY + 20, "rgba(191,247,255,.48)", labelSize * .78);
      }

      const verifyRadius = l.mobile ? 15 : 22;
      this.node(verifyX, y, verifyRadius, "✓", "#73ffc5", now);
      const headerY = Math.max(this.h * .12, y - cardH * .48);
      const headerW = l.mobile ? 54 : 82;
      this.roundedRect(verifyX - headerW / 2, headerY - (l.mobile ? 8 : 11), headerW, l.mobile ? 16 : 22, 5, "rgba(115,255,197,.30)", "rgba(6,25,19,.52)", .8);
      this.text(
        canvasText(l.mobile ? "headerShort" : "canonicalHeader", l.mobile ? "HEADER" : "CANONICAL HEADER"),
        verifyX,
        headerY,
        "rgba(115,255,197,.66)",
        labelSize * .68
      );
      this.line([[verifyX, headerY + (l.mobile ? 8 : 11)], [verifyX, y - verifyRadius]], "rgba(115,255,197,.24)", .8);
      this.text(
        canvasText(l.mobile ? "verifiedShort" : "verifiedCanonical", l.mobile ? "VERIFIED" : "VERIFIED · CANONICAL"),
        verifyX,
        y + verifyRadius + (l.mobile ? 14 : 21),
        "rgba(115,255,197,.70)",
        labelSize * .78
      );
      if (!l.mobile) {
        this.text(canvasText("noBlockBody", "NO HISTORICAL BLOCK BODY"), (left + right) / 2, this.h * .92, "rgba(239,255,248,.44)", labelSize * .82);
      }
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
      if (!l.mobile) {
        this.text(canvasText("oneBinaryTower", "ONE BINARY TOWER"), cubeX, centerY - cubeSize * .68, "rgba(115,255,197,.62)", labelSize * .82);
      }
      this.line([[cubeX + cubeSize / 2, centerY], [outputX, centerY]], "rgba(191,247,255,.38)", 1.2, l.mobile ? 0 : 6);
      for (let packet = 0; packet < 3; packet += 1) {
        this.packetAlong(cubeX + cubeSize / 2, centerY, outputX, centerY, now * .00017 + packet / 3, packet === 1 ? "#c2aaff" : "#bff7ff", l.mobile ? 1.1 : 1.6);
      }
      this.node(outputX, centerY, l.mobile ? 13 : 18, "π", "#bff7ff", now);
      this.text(
        canvasText(l.mobile ? "oneProofShort" : "oneProofStack", l.mobile ? "ONE PROOF" : "ONE PROOF STACK"),
        outputX,
        centerY + (l.mobile ? 24 : 31),
        "rgba(191,247,255,.65)",
        labelSize * .78
      );
      const footerY = l.mobile ? this.h * .92 : Math.min(stageBottom - labelSize * 2.4, centerY + laneSpan * .66);
      if (!l.mobile) {
        this.text(canvasText("noTrustedSetup", "NO TRUSTED SETUP"), (left + right) / 2, footerY, "rgba(194,170,255,.52)", labelSize * .84);
      }
    }

    drawSoundness(now) {
      const l = this.layout();
      const ctx = this.ctx;
      let centerX;
      let centerY;
      let radius;

      if (l.mobile) {
        centerX = this.w * .50;
        centerY = this.h * .50;
        radius = Math.min(this.w * .205, 82, this.h * .39);
      } else {
        const stage = this.desktopStageBounds();
        const contentEdge = this.contentRight("#soundness h2, #soundness .lead, #soundness .ledger, #soundness .chapter-actions .action");
        const left = l.compact
          ? Math.max(Math.min(contentEdge + 18, this.w * .66), this.w * .59)
          : Math.max(contentEdge + 30, this.w * .50);
        const right = this.w * (l.compact ? .925 : .91);
        centerX = (left + right) / 2;
        centerY = stage.center;
        radius = Math.min((right - left) * (l.compact ? .36 : .31), (stage.bottom - stage.top) * .285, l.compact ? 142 : 178);
      }

      const yaw = -.55;
      const pitch = -.24;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      // The rotation preserves Bloch-vector norm. Orthographic projection keeps every unit vector inside the sphere silhouette.
      const project = ([x, y, z]) => {
        const rotatedX = x * cosYaw - y * sinYaw;
        const rotatedY = x * sinYaw + y * cosYaw;
        const cameraDepth = rotatedY * cosPitch - z * sinPitch;
        const screenZ = rotatedY * sinPitch + z * cosPitch;
        return [
          centerX + radius * rotatedX,
          centerY - radius * screenZ,
          cameraDepth
        ];
      };
      const spherePoint = (plane, angle) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        if (plane === "xy") return [c, s, 0];
        if (plane === "xz") return [c, 0, s];
        return [0, c, s];
      };
      const drawGreatCircle = (plane, rgb) => {
        const segments = 64;
        const back = new Path2D();
        const front = new Path2D();
        for (let index = 0; index < segments; index += 1) {
          const a = project(spherePoint(plane, index * Math.PI * 2 / segments));
          const b = project(spherePoint(plane, (index + 1) * Math.PI * 2 / segments));
          const depth = (a[2] + b[2]) / 2;
          const path = depth < 0 ? back : front;
          path.moveTo(a[0], a[1]);
          path.lineTo(b[0], b[1]);
        }
        ctx.save();
        ctx.strokeStyle = `rgba(${rgb},.10)`;
        ctx.lineWidth = .65;
        ctx.stroke(back);
        ctx.strokeStyle = `rgba(${rgb},.34)`;
        ctx.lineWidth = 1.05;
        ctx.stroke(front);
        ctx.restore();
      };

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.38);
      halo.addColorStop(0, "rgba(115,255,197,.085)");
      halo.addColorStop(.44, "rgba(115,255,197,.026)");
      halo.addColorStop(1, "rgba(2,8,7,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(centerX - radius * 1.45, centerY - radius * 1.45, radius * 2.9, radius * 2.9);

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.015, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(191,247,255,.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      drawGreatCircle("xy", "115,255,197");
      drawGreatCircle("xz", "191,247,255");
      drawGreatCircle("yz", "194,170,255");

      const axes = [
        [[-1, 0, 0], [1, 0, 0], "rgba(191,247,255,.20)"],
        [[0, -1, 0], [0, 1, 0], "rgba(194,170,255,.18)"],
        [[0, 0, -1], [0, 0, 1], "rgba(115,255,197,.24)"]
      ];
      axes.forEach(([from, to, color]) => {
        const a = project(from);
        const b = project(to);
        this.line([[a[0], a[1]], [b[0], b[1]]], color, .8);
      });

      const coldSurface = new Path2D();
      const warmSurface = new Path2D();
      for (let index = 0; index < 18; index += 1) {
        const u = this.random(29000 + index * 19);
        const v = this.random(31000 + index * 23);
        const theta = Math.acos(1 - 2 * u);
        const phi = v * Math.PI * 2 + now * .000055;
        const point = [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
        const [x, y, depth] = project(point);
        if (depth > -.15) {
          const pointRadius = l.mobile ? .65 : .95;
          const path = depth > .25 ? warmSurface : coldSurface;
          path.moveTo(x + pointRadius, y);
          path.arc(x, y, pointRadius, 0, Math.PI * 2);
        }
      }
      ctx.save();
      ctx.fillStyle = "rgba(191,247,255,.72)";
      ctx.fill(coldSurface);
      ctx.fillStyle = "rgba(115,255,197,.84)";
      ctx.fill(warmSurface);
      ctx.restore();

      ["xy", "xz", "yz"].forEach((plane, index) => {
        const point = project(spherePoint(plane, now * (.00018 + index * .000035) + index * 1.9));
        this.dot(point[0], point[1], l.mobile ? 1.25 : 1.8, index === 1 ? "#c2aaff" : "#73ffc5", l.mobile ? 5 : 9);
      });

      const theta = 1.0 + Math.sin(now * .00042) * .28;
      const phi = now * .00034;
      const state = [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
      const statePoint = project(state);
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.01, 0, Math.PI * 2);
      ctx.clip();
      this.line([[centerX, centerY], [statePoint[0], statePoint[1]]], "rgba(115,255,197,.82)", l.mobile ? 1.15 : 1.6, l.mobile ? 5 : 9);
      this.dot(statePoint[0], statePoint[1], l.mobile ? 2.2 : 3.2, "#73ffc5", l.mobile ? 10 : 16);
      ctx.restore();
      this.text("|ψ⟩", statePoint[0] + (statePoint[0] >= centerX ? 9 : -9), statePoint[1] - 9, "#73ffc5", l.mobile ? 7 : 10, statePoint[0] >= centerX ? "left" : "right");

      this.dot(centerX, centerY, l.mobile ? 1.1 : 1.5, "#73ffc5", l.mobile ? 4 : 7);

      const labelSize = l.mobile ? 7 : 10.5;
      const endpoints = [
        [[0, 0, 1], "|0⟩", 0, -13, "center", "#bff7ff"],
        [[0, 0, -1], "|1⟩", 0, 14, "center", "#c2aaff"],
        [[1, 0, 0], "|+⟩", 13, 0, "left", "#bff7ff"],
        [[-1, 0, 0], "|−⟩", -13, 0, "right", "#bff7ff"],
        [[0, 1, 0], "|+i⟩", 11, 9, "left", "#73ffc5"],
        [[0, -1, 0], "|−i⟩", -11, -9, "right", "#73ffc5"]
      ];
      endpoints.forEach(([point, label, dx, dy, align, color], index) => {
        const [x, y] = project(point);
        this.dot(x, y, l.mobile ? 1.65 : 2.25, color, l.mobile ? 6 : 10);
        if (!l.mobile || this.h >= 150 || index < 2) {
          this.text(label, x + dx, y + dy, color, labelSize, align);
        }
      });
    }

    drawPow(now) {
      const l = this.layout();
      const blockX = l.mobile ? this.w * .32 : this.w * (l.compact ? .67 : .60);
      const nonceX = l.mobile ? this.w * .76 : this.w * (l.compact ? .88 : .84);
      const y = this.h * .48;
      const size = l.mobile ? Math.min(90, this.h * .52) : 108;
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
      if (!l.mobile) this.text(canvasText("proven", "PROVEN"), blockX, y - 10, "rgba(191,247,255,.65)", 8);
      this.text(canvasText("template", "TEMPLATE"), blockX, y + (l.mobile ? 0 : 9), "#bff7ff", 10);
      this.line([[blockX + size / 2, y], [nonceX - 31, y]], "rgba(191,247,255,.25)", 1);
      this.node(nonceX, y, l.mobile ? 28 : 34, "128", "#73ffc5", now);
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
      this.text(canvasText("nonceOnly", "NONCE ONLY"), nonceX, y + (l.mobile ? 64 : 82), "rgba(115,255,197,.58)", l.mobile ? 7 : 8);
      if (!l.mobile) {
        this.text(canvasText("asert", "20 s ASERT"), (blockX + nonceX) / 2, this.h * .78, "rgba(239,255,248,.48)", 8);
      }
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
      const span = this.h * (l.mobile ? .31 : .145);
      const verifierX = left + width * (l.mobile ? .60 : .59);
      const laptopX = left + width * .90;
      const laptopWidth = l.mobile ? Math.min(48, width * .17) : Math.min(88, width * .15);
      const gateSize = l.mobile ? Math.min(42, this.h * .29) : Math.min(66, this.h * .095);
      const inputRadius = l.mobile ? Math.min(10, this.h * .067) : 16;
      const labelSize = l.mobile ? 6.1 : 8.6;
      const inputs = [
        {
          y: y - span,
          label: canvasText(l.mobile ? "liveStateShort" : "liveState", l.mobile ? "STATE" : "LIVE STATE"),
          symbol: "S",
          color: "#73ffc5"
        },
        {
          y,
          label: canvasText(l.mobile ? "terminalProofShort" : "terminalProof", l.mobile ? "PROOF" : "TERMINAL PROOF"),
          color: "#c2aaff"
        },
        {
          y: y + span,
          label: canvasText(l.mobile ? "reorgSuffixShort" : "reorgSuffix18", l.mobile ? "18 BLOCKS" : "18-BLOCK REORG SUFFIX"),
          symbol: "18",
          color: "#bff7ff"
        }
      ];

      const inputHeaderY = Math.max(labelSize, y - span - inputRadius - (l.mobile ? 15 : 24));
      if (!l.mobile) {
        this.text(canvasText("peerData", "DATA FROM ANY PEER"), left, inputHeaderY, "rgba(255,149,125,.68)", labelSize, "left");
      }

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
        this.text(
          input.label,
          left + inputRadius + (l.mobile ? 6 : 10),
          input.y - labelSize * 1.15,
          `${input.color}a8`,
          labelSize,
          "left"
        );

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
      this.text(
        canvasText(l.mobile ? "verifyShort" : "verifyLocally", l.mobile ? "VERIFY" : "VERIFY LOCALLY"),
        verifierX,
        y + gateSize * .18,
        "rgba(115,255,197,.78)",
        l.mobile ? 4.8 : 7.2
      );

      const outputStart = verifierX + gateSize * .52;
      const outputEnd = laptopX - laptopWidth * .58;
      this.line([[outputStart, y], [outputEnd, y]], "rgba(115,255,197,.34)", 1.1, l.mobile ? 0 : 5);
      for (let packet = 0; packet < 3; packet += 1) {
        this.packetAlong(outputStart, y, outputEnd, y, now * .00016 + packet / 3, "#73ffc5", l.mobile ? 1.15 : 1.7);
      }
      if (!l.mobile) {
        this.text(canvasText("authenticated", "AUTHENTICATED"), (outputStart + outputEnd) / 2, y - 15, "rgba(115,255,197,.68)", 7.4);
      }

      this.drawLaptop(laptopX, y, laptopWidth);
      this.dot(laptopX, y, l.mobile ? 1.5 : 2.2, "#73ffc5", l.mobile ? 5 : 10);
      this.text(
        canvasText(l.mobile ? "fullNodeShort" : "independentFullNode", l.mobile ? "FULL NODE" : "INDEPENDENT FULL NODE"),
        laptopX,
        y + laptopWidth * .48,
        "rgba(115,255,197,.72)",
        labelSize
      );

      const timelineY = y + span + inputRadius + (l.mobile ? 14 : 27);
      if (!l.mobile) {
        this.line([[left, timelineY], [right, timelineY]], "rgba(191,247,255,.13)", .7);
        this.text(canvasText("sameProcedure", "SAME PROCEDURE · YEAR 1 → YEAR 10"), (left + right) / 2, timelineY + 10, "rgba(191,247,255,.58)", 7.5);
      }
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
