(() => {
  "use strict";

  const COPY = {
    en: {
      search: "Search projects", placeholder: "Name, author, feature or technology…",
      all: "All projects", platform: "Platform", anyPlatform: "Any platform",
      source: "Source", anySource: "Any source", open: "Open source", closed: "Closed source", service: "Service / resource",
      sort: "Sort by", category: "Category", categorySort: "Category", name: "Name, A–Z", reverse: "Name, Z–A", author: "Maintainer",
      filters: "Filters", reset: "Reset", share: "Copy view link", copied: "Link copied", copyFallback: "Copy this link",
      project: "Project", visit: "Open", details: "Project details", maintainedBy: "Maintained by",
      support: "Support", documentation: "Learn more", announcement: "Announcement", sourceLink: "Source code",
      empty: "No projects match these filters.", emptyHint: "Try another search or reset the filters.",
      count: (shown, total) => `${shown} of ${total} projects`, pinned: "Pinned",
      platforms: { web: "Browser", windows: "Windows", linux: "Linux", macos: "macOS", android: "Android", ios: "iOS", hiveos: "HiveOS" },
      categories: { apps: "Apps & trading", tools: "Developer tools", analytics: "Explorers & analytics", miners: "Miners", pools: "Pools", exchanges: "Exchanges", research: "Research & discussion" }
    },
    ru: {
      search: "Поиск проектов", placeholder: "Название, автор, функция или технология…",
      all: "Все проекты", platform: "Платформа", anyPlatform: "Любая платформа",
      source: "Исходный код", anySource: "Любой тип", open: "Открытый код", closed: "Закрытый код", service: "Сервис / ресурс",
      sort: "Сортировка", category: "Категория", categorySort: "По категории", name: "Название, А–Я", reverse: "Название, Я–А", author: "По автору",
      filters: "Фильтры", reset: "Сбросить", share: "Скопировать ссылку", copied: "Ссылка скопирована", copyFallback: "Скопируйте ссылку",
      project: "Проект", visit: "Открыть", details: "Подробнее о проекте", maintainedBy: "Автор / команда",
      support: "Поддержка", documentation: "Подробнее", announcement: "Анонс", sourceLink: "Исходный код",
      empty: "По этим фильтрам проектов нет.", emptyHint: "Измените запрос или сбросьте фильтры.",
      count: (shown, total) => `Проекты: ${shown} из ${total}`, pinned: "Закреплён",
      platforms: { web: "Браузер", windows: "Windows", linux: "Linux", macos: "macOS", android: "Android", ios: "iOS", hiveos: "HiveOS" },
      categories: { apps: "Приложения и торговля", tools: "Разработчикам", analytics: "Обозреватели и аналитика", miners: "Майнеры", pools: "Пулы", exchanges: "Биржи", research: "Исследования и обсуждения" }
    },
    zh: {
      search: "搜索项目", placeholder: "名称、作者、功能或技术…",
      all: "所有项目", platform: "平台", anyPlatform: "所有平台",
      source: "源代码", anySource: "所有类型", open: "开源", closed: "闭源", service: "服务 / 资源",
      sort: "排序", category: "类别", categorySort: "类别", name: "名称 A–Z", reverse: "名称 Z–A", author: "维护者",
      filters: "筛选", reset: "重置", share: "复制当前视图链接", copied: "链接已复制", copyFallback: "复制此链接",
      project: "项目", visit: "打开", details: "项目详情", maintainedBy: "维护者",
      support: "支持", documentation: "了解更多", announcement: "公告", sourceLink: "源代码",
      empty: "没有符合筛选条件的项目。", emptyHint: "请尝试其他关键词或重置筛选。",
      count: (shown, total) => `${total} 个项目中的 ${shown} 个`, pinned: "置顶",
      platforms: { web: "浏览器", windows: "Windows", linux: "Linux", macos: "macOS", android: "Android", ios: "iOS", hiveos: "HiveOS" },
      categories: { apps: "应用与交易", tools: "开发工具", analytics: "浏览器与分析", miners: "矿工软件", pools: "矿池", exchanges: "交易所", research: "研究与讨论" }
    }
  };
  const DEFAULTS = { query: "", category: "all", platform: "all", source: "all", sort: "category", project: "" };
  const PARAMS = { query: "q", category: "category", platform: "platform", source: "source", sort: "sort", project: "project" };
  const normalize = value => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const compare = (a, b) => String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
  const projectCategories = project => [project.category, ...(project.relatedCategories || [])];

  function projectPlatforms(project) {
    if (project.platforms) return project.platforms;
    const tags = new Set(project.tags.map(tag => tag.toUpperCase()));
    const platforms = ["windows", "linux", "macos", "android", "ios", "hiveos"]
      .filter(platform => tags.has(platform.toUpperCase()));
    if (platforms.length) return platforms;
    return project.category === "miners" ? [] : ["web"];
  }

  function selectProjects(data, state, { ignoreCategory = false } = {}) {
    const terms = normalize(state.query || "").trim().split(/\s+/).filter(Boolean);
    const selected = data.projects.filter(project => {
      if (!ignoreCategory && state.category !== "all" && !projectCategories(project).includes(state.category)) return false;
      if (state.source !== "all" && project.source !== state.source) return false;
      if (state.platform !== "all" && !projectPlatforms(project).includes(state.platform)) return false;
      const categoryWords = projectCategories(project).flatMap(id => [id, ...Object.values(COPY).map(copy => copy.categories[id] || "")]);
      const haystack = normalize([project.name, project.description, project.maintainer, ...project.tags, ...categoryWords, ...projectPlatforms(project)].join(" "));
      return terms.every(term => haystack.includes(term));
    });
    const order = new Map(data.categories.map((category, index) => [category.id, index]));
    return selected.sort((a, b) => {
      if (state.sort === "reverse") return compare(b.name, a.name) || compare(a.id, b.id);
      if (state.sort === "author") return compare(a.maintainer, b.maintainer) || compare(a.name, b.name);
      if (state.sort === "category") {
        const category = state.category === "all" ? order.get(a.category) - order.get(b.category) : 0;
        return category || Number(b.pinned === true) - Number(a.pinned === true) || compare(a.name, b.name);
      }
      return compare(a.name, b.name) || compare(a.id, b.id);
    });
  }

  function element(tag, className = "", text = null) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== null) node.textContent = text;
    return node;
  }

  function externalLink(url, text, className = "") {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new TypeError("Expected a public HTTPS link");
    const link = element("a", className, text);
    link.href = parsed.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  class Controller {
    constructor({ modal, navigation, results }) {
      this.modal = modal;
      this.navigation = navigation;
      this.results = results;
      this.state = { ...DEFAULTS };
      this.data = null;
      this.language = "en";
      this.filtersOpen = false;
      this.toolbar = element("div", "directory-toolbar");
      this.toolbar.hidden = true;
      navigation.before(this.toolbar);
      if (typeof ResizeObserver !== "undefined") {
        this.controlsObserver = new ResizeObserver(() => {
          const height = navigation.parentElement.getBoundingClientRect().height;
          if (height) modal.style.setProperty("--directory-controls-height", `${Math.ceil(height)}px`);
        });
        this.controlsObserver.observe(navigation.parentElement);
      }
      const url = new URL(window.location.href);
      if (url.searchParams.has("community")) {
        for (const [key, parameter] of Object.entries(PARAMS)) {
          this.state[key] = (url.searchParams.get(parameter) || DEFAULTS[key]).slice(0, key === "query" ? 200 : 80);
        }
      }
    }

    setData(data, language) {
      this.data = data;
      this.language = COPY[language] ? language : "en";
      this.copy = COPY[this.language];
      if (!data.categories.some(category => category.id === this.state.category)) this.state.category = "all";
      if (!["all", ...Object.keys(this.copy.platforms)].includes(this.state.platform)) this.state.platform = "all";
      if (!["all", "open", "closed", "not-applicable"].includes(this.state.source)) this.state.source = "all";
      if (!["category", "name", "reverse", "author"].includes(this.state.sort)) this.state.sort = "category";
      this.buildToolbar();
      this.toolbar.hidden = false;
      this.navigation.hidden = false;
      this.update();
    }

    label(category) {
      return this.copy.categories[category.id] || category.label;
    }

    field(label, name, choices) {
      const wrapper = element("label", "directory-field");
      wrapper.append(element("span", "directory-field-label", label));
      const control = element("select", "directory-select");
      control.id = `directory-${name}`;
      for (const [value, text] of choices) {
        const option = element("option", "", text);
        option.value = value;
        control.append(option);
      }
      control.value = this.state[name];
      control.addEventListener("change", () => this.setState({ [name]: control.value, project: "" }));
      wrapper.append(control);
      return wrapper;
    }

    buildToolbar() {
      const copy = this.copy;
      clearTimeout(this.shareTimer);
      this.linkFallback = null;
      this.toolbar.replaceChildren();
      const search = element("label", "directory-search");
      search.append(element("span", "directory-field-label", copy.search));
      this.search = element("input");
      this.search.type = "search";
      this.search.id = "directory-search";
      this.search.maxLength = 200;
      this.search.placeholder = copy.placeholder;
      this.search.autocomplete = "off";
      this.search.value = this.state.query;
      this.search.addEventListener("input", () => this.setState({ query: this.search.value, project: "" }));
      search.append(this.search);
      this.toolbar.append(search);

      this.filterToggle = element("button", "directory-filter-toggle");
      this.filterToggle.type = "button";
      this.filterToggle.setAttribute("aria-controls", "directory-advanced");
      this.filterToggle.addEventListener("click", () => {
        this.filtersOpen = !this.filtersOpen;
        this.syncFilterVisibility();
      });
      this.toolbar.append(this.filterToggle);
      this.advanced = element("div", "directory-advanced");
      this.advanced.id = "directory-advanced";
      const usedPlatforms = new Set(this.data.projects.flatMap(projectPlatforms));
      this.advanced.append(
        this.field(copy.platform, "platform", [["all", copy.anyPlatform], ...Object.entries(copy.platforms).filter(([id]) => usedPlatforms.has(id))]),
        this.field(copy.source, "source", [["all", copy.anySource], ["open", copy.open], ["closed", copy.closed], ["not-applicable", copy.service]]),
        this.field(copy.sort, "sort", [["category", copy.categorySort], ["name", copy.name], ["reverse", copy.reverse], ["author", copy.author]])
      );
      this.toolbar.append(this.advanced);
      const summary = element("div", "directory-summary");
      this.count = element("p", "directory-count");
      this.count.id = "directory-count";
      this.count.setAttribute("role", "status");
      this.count.setAttribute("aria-live", "polite");
      const actions = element("div", "directory-summary-actions");
      this.reset = element("button", "directory-reset", copy.reset);
      this.reset.type = "button";
      this.reset.addEventListener("click", () => {
        this.state = { ...DEFAULTS };
        this.search.value = "";
        this.advanced.querySelectorAll("select").forEach(select => { select.value = this.state[select.id.replace("directory-", "")]; });
        this.update();
        this.search.focus({ preventScroll: true });
      });
      this.share = element("button", "directory-share", copy.share);
      this.share.type = "button";
      this.share.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          this.share.textContent = copy.copied;
          clearTimeout(this.shareTimer);
          this.shareTimer = setTimeout(() => { this.share.textContent = copy.share; }, 1800);
        } catch {
          if (!this.linkFallback) {
            this.linkFallback = element("input", "directory-copy-fallback");
            this.linkFallback.readOnly = true;
            this.linkFallback.setAttribute("aria-label", copy.copyFallback);
            this.toolbar.append(this.linkFallback);
          }
          this.linkFallback.value = window.location.href;
          this.linkFallback.focus();
          this.linkFallback.select();
        }
      });
      actions.append(this.reset, this.share);
      summary.append(this.count, actions);
      this.toolbar.append(summary);
      this.syncFilterVisibility();
    }

    syncFilterVisibility() {
      this.advanced.classList.toggle("is-open", this.filtersOpen);
      this.filterToggle.setAttribute("aria-expanded", String(this.filtersOpen));
      const active = Number(this.state.platform !== "all") + Number(this.state.source !== "all") + Number(this.state.sort !== "category");
      this.filterToggle.textContent = `${this.copy.filters}${active ? ` · ${active}` : ""}`;
    }

    setState(change) {
      Object.assign(this.state, change);
      this.update();
    }

    update() {
      const projects = selectProjects(this.data, this.state);
      if (this.state.project && !projects.some(project => project.id === this.state.project)) this.state.project = "";
      this.count.textContent = this.copy.count(projects.length, this.data.projects.length);
      this.reset.hidden = Object.keys(DEFAULTS).every(key => this.state[key] === DEFAULTS[key]);
      this.syncFilterVisibility();
      this.renderCategories();
      this.renderProjects(projects);
      if (document.body.classList.contains("ecosystem-open")) this.writeUrl();
    }

    renderCategories() {
      const available = selectProjects(this.data, this.state, { ignoreCategory: true });
      const focused = this.navigation.contains(document.activeElement) ? document.activeElement.dataset.category : null;
      this.navigation.replaceChildren();
      const categories = [{ id: "all", label: this.copy.all }, ...this.data.categories];
      for (const category of categories) {
        const count = category.id === "all" ? available.length : available.filter(project => projectCategories(project).includes(category.id)).length;
        const button = element("button", "ecosystem-category-link");
        button.type = "button";
        button.dataset.category = category.id;
        button.setAttribute("aria-controls", this.results.id);
        button.setAttribute("aria-pressed", String(this.state.category === category.id));
        button.classList.toggle("is-active", this.state.category === category.id);
        button.append(element("span", "directory-category-name", category.id === "all" ? this.copy.all : this.label(category)), element("span", "directory-category-count", count));
        button.addEventListener("click", () => this.setState({ category: category.id, project: "" }));
        button.addEventListener("keydown", event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const buttons = [...this.navigation.querySelectorAll("button")];
          const index = buttons.indexOf(button);
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next].click();
          this.navigation.querySelector(`[data-category="${buttons[next].dataset.category}"]`)?.focus({ preventScroll: true });
        });
        this.navigation.append(button);
      }
      if (focused) this.navigation.querySelector(`[data-category="${focused}"]`)?.focus({ preventScroll: true });
    }

    sourceLabel(project) {
      return project.source === "open" ? this.copy.open : project.source === "closed" ? this.copy.closed : this.copy.service;
    }

    renderProjects(projects) {
      this.results.replaceChildren();
      if (!projects.length) {
        const empty = element("div", "directory-empty");
        empty.append(element("h3", "", this.copy.empty), element("p", "", this.copy.emptyHint));
        this.results.append(empty);
        return;
      }
      const table = element("table", "directory-table");
      table.setAttribute("role", "table");
      const caption = element("caption", "directory-sr-only", this.copy.details);
      table.append(caption);
      const head = element("thead");
      const headings = element("tr");
      for (const [name, className] of [[this.copy.project, "directory-project-column"], [this.copy.category, "directory-category-column"], [this.copy.platform, "directory-platform-column"], [this.copy.source, "directory-source-column"], [this.copy.visit, "directory-action-column"]]) {
        const cell = element("th", className, name);
        cell.scope = "col";
        headings.append(cell);
      }
      head.append(headings);
      const body = element("tbody");
      table.append(head, body);
      for (const project of projects) {
        const expanded = this.state.project === project.id;
        const row = element("tr", "directory-project-row");
        row.setAttribute("role", "row");
        row.dataset.project = project.id;
        row.classList.toggle("is-expanded", expanded);
        const titleCell = element("td", "directory-project-column");
        const title = element("button", "directory-project-toggle");
        title.type = "button";
        title.id = `directory-toggle-${project.id}`;
        title.setAttribute("aria-expanded", String(expanded));
        title.setAttribute("aria-controls", `directory-detail-${project.id}`);
        title.append(element("span", "directory-chevron", "›"), element("span", "", project.name));
        title.querySelector(".directory-chevron").setAttribute("aria-hidden", "true");
        title.addEventListener("click", () => {
          this.setState({ project: expanded ? "" : project.id });
          document.getElementById(`directory-toggle-${project.id}`)?.focus({ preventScroll: true });
        });
        const description = element("p", "directory-project-description", project.description);
        titleCell.append(title, description);
        const mobileMeta = element("div", "directory-mobile-meta", `${this.label(this.data.categories.find(category => category.id === project.category))} · ${projectPlatforms(project).map(id => this.copy.platforms[id]).join(" / ") || this.sourceLabel(project)}`);
        titleCell.append(mobileMeta);
        const categoryCell = element("td", "directory-category-column");
        const category = element("button", "directory-category-filter", this.label(this.data.categories.find(category => category.id === project.category)));
        category.type = "button";
        category.addEventListener("click", () => {
          this.setState({ category: project.category, project: "" });
          this.navigation.querySelector(`[data-category="${project.category}"]`)?.focus({ preventScroll: true });
        });
        categoryCell.append(category);
        if (project.pinned) categoryCell.append(element("span", "directory-pinned", this.copy.pinned));
        const platformCell = element("td", "directory-platform-column", projectPlatforms(project).map(id => this.copy.platforms[id]).join(" · ") || "—");
        const sourceCell = element("td", "directory-source-column");
        sourceCell.append(element("span", `directory-source ${project.source}`, this.sourceLabel(project)));
        const action = element("td", "directory-action-column");
        const link = externalLink(project.url, `${this.copy.visit} ↗`, "directory-visit");
        link.setAttribute("aria-label", `${this.copy.visit}: ${project.name}`);
        action.append(link);
        row.append(titleCell, categoryCell, platformCell, sourceCell, action);
        body.append(row);
        const detailRow = element("tr", "directory-detail-row");
        detailRow.id = `directory-detail-${project.id}`;
        detailRow.hidden = !expanded;
        const detailCell = element("td");
        detailCell.colSpan = 5;
        if (expanded) detailCell.append(this.projectDetails(project));
        detailRow.append(detailCell);
        body.append(detailRow);
      }
      this.results.append(table);
    }

    projectDetails(project) {
      const panel = element("div", "directory-project-details");
      panel.append(element("p", "directory-detail-description", project.description));
      if (project.notes) panel.append(element("p", "directory-project-notes", project.notes));
      const facts = element("dl", "directory-detail-facts");
      for (const [label, value] of [[this.copy.maintainedBy, project.maintainer], [this.copy.source, this.sourceLabel(project)], [this.copy.platform, projectPlatforms(project).map(id => this.copy.platforms[id]).join(" · ") || "—"], [this.copy.category, projectCategories(project).map(id => this.label(this.data.categories.find(category => category.id === id))).join(" · ")]]) {
        const pair = element("div");
        pair.append(element("dt", "", label), element("dd", "", value));
        facts.append(pair);
      }
      const tags = element("ul", "directory-detail-tags");
      for (const tag of project.tags) tags.append(element("li", "", tag));
      const links = element("div", "directory-detail-links");
      links.append(externalLink(project.url, `${new URL(project.url).hostname.replace(/^www\./, "")} ↗`));
      const used = new Set([new URL(project.url).href]);
      for (const [key, label] of [["sourceUrl", this.copy.sourceLink], ["detailsUrl", this.copy.documentation], ["supportUrl", this.copy.support], ["announcementUrl", this.copy.announcement]]) {
        if (project[key] && !used.has(new URL(project[key]).href)) {
          links.append(externalLink(project[key], `${label} ↗`));
          used.add(new URL(project[key]).href);
        }
      }
      panel.append(facts, tags, links);
      return panel;
    }

    writeUrl() {
      const url = new URL(window.location.href);
      url.searchParams.set("community", "1");
      for (const [key, parameter] of Object.entries(PARAMS)) {
        if (this.state[key] === DEFAULTS[key]) url.searchParams.delete(parameter);
        else url.searchParams.set(parameter, this.state[key]);
      }
      window.history.replaceState(window.history.state, "", url);
    }

    close() {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("community")) return;
      url.searchParams.delete("community");
      for (const parameter of Object.values(PARAMS)) url.searchParams.delete(parameter);
      window.history.replaceState(window.history.state, "", url);
    }
  }

  const api = { Controller, selectProjects, projectPlatforms, projectCategories };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.Parano1dDirectory = api;
})();
