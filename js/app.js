(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
  };
  let favs = store.get("cc_favs", []);
  let tickets = store.get("cc_tickets", []);
  let booking = null;

  const money = n => (n ? n.toLocaleString("es-ES") + " €" : "Gratis");
  const dateOf = e => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + e.d); return d; };
  const part = (d, o) => d.toLocaleDateString("es-ES", o).replace(".", "");
  const longDate = e => { const s = part(dateOf(e), { weekday: "long", day: "numeric", month: "long" }); return s[0].toUpperCase() + s.slice(1); };
  const byId = id => EVENTS.find(e => e.id === Number(id));
  const ico = n => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const kmText = e => e.km.toString().replace(".", ",");

  /* ---------- Avisos ---------- */
  let tt;
  function toast(msg, undo) {
    const t = $("#toast");
    t.innerHTML = `<span>${msg}</span>` + (undo ? `<button type="button">Deshacer</button>` : "");
    if (undo) $("button", t).onclick = () => { undo(); t.innerHTML = ""; };
    clearTimeout(tt); tt = setTimeout(() => (t.innerHTML = ""), 6000);
  }

  /* ---------- Favoritos ---------- */
  function toggleFav(id) {
    const had = favs.includes(id);
    favs = had ? favs.filter(x => x !== id) : [...favs, id];
    store.set("cc_favs", favs);
    const e = byId(id);
    toast(`«${e.t}» ${had ? "quitado de" : "añadido a"} tu lista`, () => toggleFav(id));
    refresh();
  }
  const favBtn = (e, extra = "") => {
    const on = favs.includes(e.id);
    return `<button type="button" class="ib ${extra}" data-fav="${e.id}" aria-pressed="${on}" aria-label="${on ? "Quitar" : "Añadir"} «${e.t}» ${on ? "de" : "a"} mi lista">${ico("heart")}</button>`;
  };

  /* ---------- Listado y filtros ---------- */
  const form = $("#f");
  function filtered() {
    const fd = new FormData(form), cats = fd.getAll("cat"), when = fd.get("when"), km = +fd.get("km");
    const q = $("#q").value.trim().toLowerCase();
    return EVENTS.filter(e => {
      const day = dateOf(e).getDay();
      return (!cats.length || cats.includes(e.c)) && e.km <= km &&
        (when === "all" || (when === "today" && e.d === 0) || (when === "tomorrow" && e.d === 1) || (when === "weekend" && (day === 0 || day === 6))) &&
        (!fd.get("free") || e.p === 0) && (!fd.get("acc") || e.acc) &&
        (!q || (e.t + e.v + e.c).toLowerCase().includes(q));
    }).sort((a, b) => a.d - b.d || a.h.localeCompare(b.h));
  }
  const dateBox = e => { const d = dateOf(e); return `<div class="date"><small>${part(d, { weekday: "short" })}</small><b>${d.getDate()}</b><small>${part(d, { month: "short" })}</small></div>`; };
  const card = e => `<li><article class="card">${dateBox(e)}
      <div class="info"><span class="tag">${e.c}</span><h3><a href="#/evento/${e.id}">${e.t}</a></h3>
      <p class="meta">${e.v} · ${e.h} · ${kmText(e)} km</p>
      <p class="price ${e.p ? "" : "free"}">${e.p ? "Desde " : ""}${money(e.p)}</p></div>${favBtn(e)}</article></li>`;
  function renderHome() {
    const list = filtered();
    $("#cards").innerHTML = list.map(card).join("");
    $("#count").textContent = list.length ? `${list.length} ${list.length === 1 ? "evento" : "eventos"} cerca de ti` : "No hay eventos con estos filtros. Prueba a ampliar la distancia o pulsa «Limpiar».";
    $("#apply").textContent = `Ver ${list.length} ${list.length === 1 ? "evento" : "eventos"}`;
    $("#kmo").textContent = form.km.value + " km";
  }
  $("#cats").innerHTML = CATS.map(c => `<label class="chip"><input type="checkbox" name="cat" value="${c}"><span>${c}</span></label>`).join("");
  form.addEventListener("input", renderHome);
  form.addEventListener("reset", () => setTimeout(renderHome));
  $("#q").addEventListener("input", renderHome);
  form.addEventListener("submit", e => e.preventDefault());

  /* Hoja de filtros (móvil/tablet) */
  const openBtn = $("#open-f");
  function filters(open) {
    document.body.classList.toggle("f-open", open);
    $("#scrim").hidden = !open;
    openBtn.setAttribute("aria-expanded", open);
    if (open) $("#close-f").focus(); else openBtn.focus();
  }
  openBtn.onclick = () => filters(true);
  $("#close-f").onclick = $("#apply").onclick = $("#scrim").onclick = () => filters(false);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("f-open")) filters(false); });

  /* Delegación: favoritos */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-fav]");
    if (b) toggleFav(Number(b.dataset.fav));
  });

  /* ---------- Vistas ---------- */
  function renderEvent(e) {
    return `<a class="back" href="#/">${ico("back")} Volver al listado</a>
      <div class="hero" role="img" aria-label="Ilustración decorativa de la categoría ${e.c}"><span class="tag">${e.c}</span></div>
      <h1 tabindex="-1">${e.t}</h1><p class="mut">${e.v}</p>
      <div class="facts">
        <div class="fact">${ico("cal")}<div><b>${longDate(e)}</b><span class="mut">${e.h} h · ${e.dur}</span></div></div>
        <div class="fact">${ico("pin")}<div><b>${e.v}, ${e.a}</b><span class="mut">A ${kmText(e)} km de ti</span></div></div>
        <div class="fact">${ico("ticket")}<div><b>${e.p ? "Desde " + money(e.p) : "Entrada gratuita (con inscripción)"}</b><span class="mut">Quedan ${e.s} plazas</span></div></div>
        <div class="fact">${ico("access")}<div><b>Accesibilidad</b><span class="mut">${e.acc ? "Acceso para silla de ruedas" : "Sin acceso para silla de ruedas confirmado"}</span></div></div>
      </div>
      <h2>Sobre el evento</h2><p class="mut">${e.x}</p>
      <div class="actions">${favBtn(e, "big")}
        <a class="btn" href="#/reserva/${e.id}">${ico("ticket")} ${e.p ? "Reservar entradas" : "Inscribirme"}</a></div>`;
  }
  function renderList() {
    const items = favs.map(byId).filter(Boolean).sort((a, b) => a.d - b.d);
    if (!items.length) return `<h1 tabindex="-1">Mi lista</h1><div class="empty"><p>Aún no has guardado ningún evento.</p><p><a class="btn" href="#/">Explorar eventos</a></p></div>`;
    return `<h1 tabindex="-1">Mi lista (${items.length})</h1><ul class="cards">${items.map(e => {
      const has = tickets.some(t => t.id === e.id);
      return `<li><article class="card">${dateBox(e)}
        <div class="info"><span class="tag">${e.c}</span><h3><a href="#/evento/${e.id}">${e.t}</a></h3><p class="meta">${e.v} · ${e.h}</p>
        ${has ? `<span class="badge">Entradas reservadas</span>` : `<a class="btn small" href="#/reserva/${e.id}">Reservar</a>`}
        <button type="button" class="link" data-fav="${e.id}" aria-label="Quitar «${e.t}» de mi lista">Quitar</button></div></article></li>`;
    }).join("")}</ul>`;
  }
  function renderTickets() {
    if (!tickets.length) return `<h1 tabindex="-1">Mis entradas</h1><div class="empty"><p>Todavía no tienes reservas.</p><p><a class="btn" href="#/">Buscar eventos</a></p></div>`;
    return `<h1 tabindex="-1">Mis entradas (${tickets.length})</h1><ul class="cards">${tickets.map(t => {
      const e = byId(t.id);
      return `<li><article class="card"><div class="info"><span class="tag">${e.c}</span><h3><a href="#/evento/${e.id}">${e.t}</a></h3>
        <p class="meta">${longDate(e)} · ${e.h} · ${e.v}</p><p class="price">${t.qty} ${t.qty === 1 ? "entrada" : "entradas"} · ${t.total ? money(t.total) : "Gratis"}</p>
        <p>Código: <span class="code" style="font-size:1rem">${t.code}</span></p></div></article></li>`;
    }).join("")}</ul>`;
  }

  /* ---------- Reserva en 3 pasos ---------- */
  const STEPS = ["Entradas", "Tus datos", "Confirmación"];
  const stepper = n => `<ol class="steps" aria-label="Progreso de la reserva">${STEPS.map((s, i) =>
    `<li ${i + 1 === n ? 'aria-current="step"' : ""} class="${i + 1 < n ? "done" : ""}">${i + 1}. ${s}</li>`).join("")}</ol>`;
  function renderBooking(e, focusErr) {
    const b = booking, max = Math.min(6, e.s), total = b.qty * e.p, sec = $('[data-view="reserva"]');
    let h = `<a class="back" href="#/evento/${e.id}">${ico("back")} Volver al evento</a><h1 tabindex="-1">${e.p ? "Reservar entradas" : "Inscripción"}</h1>${stepper(b.step)}
      <div class="panel"><b>${e.t}</b><p class="meta">${longDate(e)} · ${e.h} · ${e.v}</p></div>`;
    if (b.step === 1) {
      h += `<div class="panel"><h2>¿Cuántas ${e.p ? "entradas" : "plazas"}?</h2><p class="meta">Máximo ${max} por reserva · ${e.p ? money(e.p) + " cada una" : "Gratuito"}</p>
        <div class="qty"><button type="button" class="ib" data-q="-1" aria-label="Quitar una entrada" ${b.qty <= 1 ? "disabled" : ""}>−</button>
        <output aria-live="polite" aria-label="Cantidad">${b.qty}</output>
        <button type="button" class="ib" data-q="1" aria-label="Añadir una entrada" ${b.qty >= max ? "disabled" : ""}>+</button></div>
        <div class="total"><span>Total</span><span>${total ? money(total) : "Gratis"}</span></div></div>
        <button type="button" class="btn" data-go="2">Continuar</button>`;
    } else if (b.step === 2) {
      h += `<form class="panel" id="bf" novalidate><h2>Tus datos</h2><p class="meta">Los campos marcados con * son obligatorios.</p>
        <div class="field"><label for="nm">Nombre y apellidos *</label><input id="nm" name="name" autocomplete="name" value="${b.name}" aria-describedby="e-nm" ${b.err?.name ? 'aria-invalid="true"' : ""}>${b.err?.name ? `<p class="err" id="e-nm">${b.err.name}</p>` : ""}</div>
        <div class="field"><label for="em">Correo electrónico *</label><input id="em" name="email" type="email" autocomplete="email" value="${b.email}" aria-describedby="e-em" ${b.err?.email ? 'aria-invalid="true"' : ""}>${b.err?.email ? `<p class="err" id="e-em">${b.err.email}</p>` : ""}</div>
        ${e.p ? `<p class="meta">Pago: simulado en este prototipo; no se solicitan datos bancarios.</p>` : ""}
        <div class="total"><span>${b.qty} × ${e.t}</span><span>${total ? money(total) : "Gratis"}</span></div>
        <div class="row2"><button type="button" class="btn sec" data-go="1">Atrás</button><button type="submit" class="btn">${e.p ? "Confirmar reserva" : "Confirmar inscripción"}</button></div></form>`;
    } else {
      h += `<div class="panel"><div class="ok">${ico("check")}</div><h2>¡Reserva confirmada!</h2>
        <p>Hemos enviado la confirmación a <b>${b.email}</b> (simulado).</p>
        <p>${b.qty} ${b.qty === 1 ? "entrada" : "entradas"} · ${total ? money(total) : "Gratis"}</p><p>Tu código: <span class="code">${b.code}</span></p></div>
        <div class="row2"><a class="btn sec" href="#/">Seguir explorando</a><a class="btn" href="#/entradas">Ver mis entradas</a></div>`;
    }
    sec.innerHTML = h;
    if (focusErr) { const bad = $('[aria-invalid="true"]', sec); if (bad) bad.focus(); }
  }
  function bookingEvents() {
    const sec = $('[data-view="reserva"]');
    sec.addEventListener("click", ev => {
      const e = byId(booking.id), q = ev.target.closest("[data-q]"), g = ev.target.closest("[data-go]");
      if (q) { booking.qty = Math.max(1, Math.min(Math.min(6, e.s), booking.qty + Number(q.dataset.q))); renderBooking(e); $(`[data-q="${q.dataset.q}"]:not([disabled])`, sec)?.focus(); }
      if (g) { booking.step = Number(g.dataset.go); renderBooking(e); $("h1", sec).focus(); }
    });
    sec.addEventListener("submit", ev => {
      ev.preventDefault();
      const e = byId(booking.id), fd = new FormData(ev.target);
      booking.name = fd.get("name").trim(); booking.email = fd.get("email").trim();
      booking.err = {};
      if (!booking.name) booking.err.name = "Escribe tu nombre y apellidos.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) booking.err.email = "Escribe un correo válido, por ejemplo nombre@correo.es.";
      if (Object.keys(booking.err).length) return renderBooking(e, true);
      booking.err = null;
      booking.code = "CC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      tickets = [...tickets, { id: e.id, qty: booking.qty, total: booking.qty * e.p, code: booking.code, name: booking.name, email: booking.email }];
      store.set("cc_tickets", tickets);
      booking.step = 3; renderBooking(e); $("h1", sec).focus();
    });
  }

  /* ---------- Enrutado por hash ---------- */
  const titles = { home: "Inicio", evento: "Evento", reserva: "Reserva", lista: "Mi lista", entradas: "Mis entradas" };
  function show(name) {
    $$("[data-view]").forEach(s => (s.hidden = s.dataset.view !== name));
    $$("#nav a").forEach(a => {
      const on = a.dataset.r === name || ((name === "evento" || name === "reserva") && a.dataset.r === "home");
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.body.classList.remove("f-open"); $("#scrim").hidden = true;
  }
  function route(first) {
    const [, r = "", id] = location.hash.slice(1).split("/");
    let name = r || "home";
    const e = id && byId(id);
    if ((name === "evento" || name === "reserva") && !e) name = "home";
    const sec = $(`[data-view="${name}"]`);
    if (name === "evento") sec.innerHTML = renderEvent(e);
    if (name === "lista") sec.innerHTML = renderList();
    if (name === "entradas") sec.innerHTML = renderTickets();
    if (name === "reserva") { if (!booking || booking.id !== e.id || booking.step === 3) booking = { id: e.id, step: 1, qty: 1, name: "", email: "" }; renderBooking(e); }
    if (name === "home") renderHome();
    show(name);
    document.title = (name === "evento" || name === "reserva" ? e.t + " · " : "") + titles[name] + " · CulturaCerca";
    if (!first) { window.scrollTo(0, 0); $("h1", sec).focus(); }
  }
  function refresh() { // redibuja la vista actual sin mover el foco
    const active = document.activeElement?.dataset?.fav, [, r = "", id] = location.hash.slice(1).split("/");
    if (!r) renderHome(); else if (r === "evento") $('[data-view="evento"]').innerHTML = renderEvent(byId(id)); else if (r === "lista") $('[data-view="lista"]').innerHTML = renderList();
    if (active) $(`[data-view]:not([hidden]) [data-fav="${active}"]`)?.focus();
  }
  bookingEvents();
  window.addEventListener("hashchange", () => route(false));
  route(true);
})();
