/* Maridew Holdings Ltd — dynamic behaviour */
(function () {
  "use strict";

  const D = window.SITE_DATA;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  /* ---------- 1. Pillars ---------- */
  $("#pillarGrid").innerHTML = D.pillars
    .map(
      (p) => `
      <article class="pillar-card reveal">
        <span class="num">${esc(p.n)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
      </article>`
    )
    .join("");

  /* ---------- 2. Clients ---------- */
  $("#clientGrid").innerHTML = D.clients
    .map((c, i) => `<div class="client-card reveal"><span>${String(i + 1).padStart(2, "0")}</span>${esc(c)}</div>`)
    .join("");

  /* ---------- 3. Value props ---------- */
  $("#valueGrid").innerHTML = D.valueProps
    .map((v) => `<article class="value-card reveal"><h3>${esc(v.title)}</h3><p>${esc(v.desc)}</p></article>`)
    .join("");

  /* ---------- 4. Subsidiaries ---------- */
  $("#subsidiaryBody").innerHTML = D.subsidiaries
    .map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.focus)}</td></tr>`)
    .join("");

  /* ---------- 5. Divisions: render + phase filter + search + accordion ---------- */
  const listEl = $("#divisionList");
  const emptyEl = $("#emptyState");
  const countEl = $("#resultCount");
  const searchEl = $("#divisionSearch");
  const chipsEl = $("#filterChips");

  const phases = [...new Set(Object.values(D.phases))].sort();
  chipsEl.insertAdjacentHTML(
    "beforeend",
    phases
      .map((p) => `<button class="chip" data-phase="${esc(p)}" role="tab" aria-selected="false">${esc(p)}</button>`)
      .join("")
  );

  let activePhase = "all";
  let query = "";

  const highlight = (text, q) => {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  };

  function renderDivisions() {
    const q = query.trim().toLowerCase();

    const matches = D.divisions.filter((d) => {
      const phaseOk = activePhase === "all" || D.phases[d.n] === activePhase;
      if (!phaseOk) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.items.some((it) => it.toLowerCase().includes(q))
      );
    });

    listEl.innerHTML = matches
      .map((d) => {
        const items = q
          ? d.items.filter((it) => it.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
          : d.items;
        return `
        <article class="division-card" data-n="${esc(d.n)}">
          <button class="division-head" aria-expanded="false">
            <span class="d-num">${esc(d.n)}</span>
            <span class="d-title">
              <strong>${highlight(d.title, q)}</strong>
              <span>${highlight(d.summary, q)}</span>
            </span>
            <span class="d-phase">${esc(D.phases[d.n])}</span>
            <span class="d-toggle" aria-hidden="true">+</span>
          </button>
          <div class="division-body">
            <div class="division-body-inner">
              <ul class="service-grid">
                ${items.map((it) => `<li>${highlight(it, q)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </article>`;
      })
      .join("");

    emptyEl.hidden = matches.length > 0;
    countEl.textContent = `Showing ${matches.length} of ${D.divisions.length} divisions · ${
      matches.reduce((n, d) => n + d.items.length, 0)
    } services`;
  }

  function openCard(card) {
    const body = $(".division-body", card);
    card.classList.add("is-open");
    $(".division-head", card).setAttribute("aria-expanded", "true");
    body.style.maxHeight = body.scrollHeight + "px";
  }
  function closeCard(card) {
    card.classList.remove("is-open");
    $(".division-head", card).setAttribute("aria-expanded", "false");
    $(".division-body", card).style.maxHeight = "0px";
  }

  listEl.addEventListener("click", (e) => {
    const head = e.target.closest(".division-head");
    if (!head) return;
    const card = head.closest(".division-card");
    const isOpen = card.classList.contains("is-open");
    $$(".division-card.is-open", listEl).forEach(closeCard);
    if (!isOpen) openCard(card);
  });

  // keep open cards correctly sized on resize
  window.addEventListener("resize", () => {
    $$(".division-card.is-open", listEl).forEach((c) => {
      const b = $(".division-body", c);
      b.style.maxHeight = b.scrollHeight + "px";
    });
  });

  let searchTimer;
  searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      query = searchEl.value;
      renderDivisions();
    }, 140);
  });

  chipsEl.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    activePhase = chip.dataset.phase;
    $$(".chip", chipsEl).forEach((c) => {
      const on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
    renderDivisions();
  });

  renderDivisions();

  /* ---------- 6. Contact form: division options + validation ---------- */
  const divisionSelect = $("#cfDivision");
  divisionSelect.insertAdjacentHTML(
    "beforeend",
    D.divisions.map((d) => `<option value="${esc(d.n + " — " + d.title)}">${esc(d.n)} — ${esc(d.title)}</option>`).join("")
  );

  const form = $("#contactForm");
  const status = $("#formStatus");

  function setError(input, msg) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", !!msg);
    const small = $(`.error[data-for="${input.id}"]`, field);
    if (small) small.textContent = msg || "";
    return !msg;
  }

  function validate() {
    const name = $("#cfName");
    const email = $("#cfEmail");
    const div = $("#cfDivision");
    const msg = $("#cfMessage");
    let ok = true;
    ok = setError(name, name.value.trim().length < 2 ? "Please enter your full name." : "") && ok;
    ok = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Enter a valid email address.") && ok;
    ok = setError(div, div.value ? "" : "Choose a division of interest.") && ok;
    ok = setError(msg, msg.value.trim().length < 10 ? "Tell us a little more (at least 10 characters)." : "") && ok;
    return ok;
  }

  form.addEventListener("input", (e) => {
    if (e.target.closest(".field.has-error")) validate();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      status.textContent = "Please correct the highlighted fields.";
      return;
    }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.textContent = "";
    // Simulated async submit — swap for a real endpoint when available.
    setTimeout(() => {
      const ref = "MH-" + Date.now().toString(36).toUpperCase().slice(-6);
      form.reset();
      btn.disabled = false;
      btn.textContent = "Send enquiry";
      status.textContent = `Thank you — your enquiry (${ref}) has been received. The right division will respond shortly.`;
    }, 900);
  });

  /* ---------- 7. Tagline rotator ---------- */
  const tText = $("#taglineText");
  const tDots = $("#taglineDots");
  let tIndex = 0;
  let tTimer;

  tDots.innerHTML = D.taglines.map((_, i) => `<i data-i="${i}" class="${i === 0 ? "is-active" : ""}"></i>`).join("");

  function showTagline(i) {
    tIndex = (i + D.taglines.length) % D.taglines.length;
    tText.classList.add("fading");
    setTimeout(() => {
      tText.textContent = D.taglines[tIndex];
      tText.classList.remove("fading");
      $$("i", tDots).forEach((d, k) => d.classList.toggle("is-active", k === tIndex));
    }, 260);
  }
  function restartRotation() {
    clearInterval(tTimer);
    tTimer = setInterval(() => showTagline(tIndex + 1), 5000);
  }
  $("#taglineNext").addEventListener("click", () => { showTagline(tIndex + 1); restartRotation(); });
  $("#taglinePrev").addEventListener("click", () => { showTagline(tIndex - 1); restartRotation(); });
  tDots.addEventListener("click", (e) => {
    if (e.target.dataset.i === undefined) return;
    showTagline(Number(e.target.dataset.i));
    restartRotation();
  });
  restartRotation();

  /* ---------- 8. Header state + mobile nav ---------- */
  const header = $("#siteHeader");
  const nav = $("#mainNav");
  const toggle = $("#navToggle");

  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- 9. Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          setTimeout(() => en.target.classList.add("is-visible"), i * 70);
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- 10. Animated counters ---------- */
  const statIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$(".stat-num", en.target).forEach((el) => {
          const target = Number(el.dataset.count) || 0;
          const start = performance.now();
          const dur = 1400;
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (el.dataset.suffix || "");
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        statIO.unobserve(en.target);
      });
    },
    { threshold: 0.4 }
  );
  const statsEl = $("#heroStats");
  if (statsEl) statIO.observe(statsEl);

  /* ---------- 11. Misc ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
