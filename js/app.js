/* Yaku Energía — comportamiento del sitio (sin dependencias) */
(function () {
  "use strict";
  var Y = window.YAKU, C = Y.CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n, d) { return Number(n).toLocaleString("es-AR", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); };
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------- menú y datos de contacto ---------------- */
  var burger = $("#burger"), menu = $("#menu");
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  $$("a", menu).forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
  $("#year").textContent = new Date().getFullYear();

  var waUrl = "https://wa.me/" + C.WHATSAPP;
  [["#contactTel", "#footTel"]].forEach(function (ids) {
    ids.forEach(function (id) { var a = $(id); a.textContent = C.WHATSAPP_VISIBLE; a.href = waUrl; a.rel = "noopener"; });
  });
  ["#contactMail", "#footMail"].forEach(function (id) { var a = $(id); a.textContent = C.EMAIL; a.href = "mailto:" + C.EMAIL; });
  ["#contactWeb", "#footWeb"].forEach(function (id) { var a = $(id); a.textContent = C.WEB; a.href = "https://" + C.WEB; a.rel = "noopener"; });

  /* ---------------- animaciones: "Próximamente" ---------------- */
  $$("[data-anim]").forEach(function (n) {
    var url = C.ANIM[n.getAttribute("data-anim")];
    if (url) {
      if (n.tagName !== "A") {
        var a = document.createElement("a");
        a.className = "btn btn--ghost"; a.textContent = "Ver cómo funciona"; a.href = url;
        n.replaceWith(a);
      } else { n.href = url; }
    } else if (n.tagName === "A") {
      n.outerHTML = '<span class="btn btn--off" aria-disabled="true">Ver cómo funciona · <em>Próximamente</em></span>';
    }
  });

  /* ---------------- galerías y lightbox ---------------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg");
  var CONTAIN = /render|corte|rueda|rotor|jardin/;
  $$("[data-gallery]").forEach(function (g) {
    var main = $(".gallery__main img", g);
    main.classList.toggle("is-contain", CONTAIN.test(main.getAttribute("src")));
    $$(".gallery__thumbs button", g).forEach(function (b) {
      b.addEventListener("click", function () {
        main.src = b.dataset.src; main.alt = b.dataset.alt;
        main.classList.toggle("is-contain", CONTAIN.test(b.dataset.src));
        $$(".gallery__thumbs button", g).forEach(function (o) { o.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
      });
    });
    $(".gallery__main", g).addEventListener("click", function () {
      lbImg.src = main.src; lbImg.alt = main.alt;
      if (lb.showModal) lb.showModal();
    });
  });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });

  /* ---------------- interpolación en tablas ---------------- */
  function lookup(T, H, Q) {
    var hs = T.h, qs = T.q;
    if (H < hs[0] || H > hs[hs.length - 1] || Q < qs[0] || Q > qs[qs.length - 1]) return { status: "out" };
    function idx(arr, v) { var i = 0; while (i < arr.length - 2 && v > arr[i + 1]) i++; return i; }
    var i = idx(hs, H), j = idx(qs, Q);
    var fh = (H - hs[i]) / (hs[i + 1] - hs[i]), fq = (Q - qs[j]) / (qs[j + 1] - qs[j]);
    var c = [T.p[i][j], T.p[i][j + 1], T.p[i + 1][j], T.p[i + 1][j + 1]];
    if (c.some(function (v) { return v == null; })) return { status: "x" };
    var p = c[0] * (1 - fh) * (1 - fq) + c[1] * (1 - fh) * fq + c[2] * fh * (1 - fq) + c[3] * fh * fq;
    var star = false;
    if (T.star) star = [T.star[i][j], T.star[i][j + 1], T.star[i + 1][j], T.star[i + 1][j + 1]].some(Boolean);
    return { status: "ok", p: p, star: star };
  }
  function nearest(arr, v) { var b = 0; arr.forEach(function (x, i) { if (Math.abs(x - v) < Math.abs(arr[b] - v)) b = i; }); return b; }

  /* ---------------- tablas de potencia ---------------- */
  function renderPTable(id, T, hUnit, name) {
    var t = $(id), q = T.q, mx = 0;
    T.p.forEach(function (r) { r.forEach(function (v) { if (v > mx) mx = v; }); });
    var html = "<caption>Valores en W." + (T.star ? " * = versión con 2 boquillas." : "") + "</caption><thead><tr><th scope=\"col\" rowspan=\"2\">Caída (m)</th><th scope=\"colgroup\" colspan=\"" + q.length + "\">Caudal (L/s)</th></tr><tr>";
    q.forEach(function (v) { html += "<th scope=\"col\">" + fmt(v, 1).replace(",0", "") + "</th>"; });
    html += "</tr></thead><tbody>";
    T.h.slice().reverse().forEach(function (h) {
      var i = T.h.indexOf(h);
      html += "<tr><th scope=\"row\">" + fmt(h, 1).replace(",0", "") + "</th>";
      T.p[i].forEach(function (v, j) {
        if (v == null) html += "<td class=\"na\" aria-label=\"fuera de rango\">—</td>";
        else {
          var lvl = v / mx, cls = lvl > .75 ? "p4" : lvl > .5 ? "p3" : lvl > .25 ? "p2" : "p1";
          html += "<td class=\"" + cls + "\" data-i=\"" + i + "\" data-j=\"" + j + "\">" + v + (T.star && T.star[i][j] ? "*" : "") + "</td>";
        }
      });
      html += "</tr>";
    });
    t.innerHTML = html + "</tbody>";
  }
  renderPTable("#lhTable", Y.LH_TABLE);
  renderPTable("#peTable", Y.PELTON_TABLE);
  function highlight(id, T, H, Q) {
    $$(id + " td.hl").forEach(function (c) { c.classList.remove("hl"); });
    if (H == null) return;
    var i = nearest(T.h, H), j = nearest(T.q, Q);
    var c = $(id + ' td[data-i="' + i + '"][data-j="' + j + '"]');
    if (c) c.classList.add("hl");
  }

  /* ---------------- recomendación ---------------- */
  function recommend(H, Q) {
    var inLH = H >= 1 && H <= 3 && Q >= 15 && Q <= 40;
    var inPE = H >= 5 && H <= 100 && Q >= 0.5 && Q <= 5;
    var r = { model: null, level: "no", title: "", text: "", est: "" };
    if (!(H > 0) || !(Q > 0)) { r.title = "Ingresá caída y caudal"; r.text = "Completá los dos datos para ver qué modelo te conviene."; r.level = "warn"; return r; }
    if (inLH) {
      var a = lookup(Y.LH_TABLE, H, Q); r.model = "LH 140";
      r.title = "LH 140 (axial)";
      r.text = "Tu sitio tiene poca caída y buen caudal: es el terreno de la turbina axial.";
      if (a.status === "ok") { r.level = "ok"; r.est = "Tabla del folleto para este punto: ≈ " + fmt(a.p) + " W."; }
      else { r.level = "warn"; r.text += " Pero en la combinación exacta la tabla del folleto marca fuera de rango (por ejemplo, poco caudal para esa caída). Consultanos para evaluarlo."; }
    } else if (inPE) {
      var b = lookup(Y.PELTON_TABLE, H, Q); r.model = "Pelton Cube 230";
      r.title = "Pelton Cube 230";
      r.text = "Tu sitio tiene mucha caída y poco caudal: es el terreno de la turbina Pelton.";
      if (b.status === "ok") { r.level = "ok"; r.est = "Tabla del folleto (potencia máxima) para este punto: ≈ " + fmt(b.p) + " W" + (b.star ? " con versión de 2 boquillas." : "."); }
      else { r.level = "warn"; r.text += " Está dentro del rango nominal, pero la tabla del folleto no cubre este punto (llega hasta 50 m y 3 L/s, o la celda está fuera de rango). Consultanos para dimensionar boquillas."; }
    } else if (H < 1) {
      r.title = "Caída insuficiente"; r.text = "Con menos de 1 m de caída ninguno de los dos modelos está pensado para tu sitio. Escribinos igual: a veces se puede ganar altura con un canal.";
    } else if (H > 100) {
      r.title = "Caída fuera de rango"; r.text = "La Pelton Cube 230 trabaja hasta 100 m (presión máxima de trabajo 10 kg/cm²). Para más caída, consultanos.";
    } else if (H > 3 && H < 5) {
      r.level = "warn"; r.title = "Caída intermedia"; r.text = "Entre 3 y 5 m cae justo entre los rangos de los dos modelos. Consultanos y lo analizamos caso por caso.";
    } else if (H >= 1 && H <= 3 && Q > 40) {
      r.level = "warn"; r.model = "LH 140"; r.title = "LH 140, con más caudal que la tabla"; r.text = "Tenés más caudal que el máximo de la tabla (40 L/s). Se puede evaluar sumar otra unidad para aprovecharlo.";
    } else if (H >= 1 && H <= 3 && Q < 15) {
      r.title = "Poco caudal para esta caída"; r.text = "Con 1 a 3 m de caída el LH 140 necesita desde 15 L/s en tabla; y la Pelton necesita al menos 5 m. Consultanos para ver alternativas.";
    } else if (H >= 5 && Q < 0.5) {
      r.title = "Caudal insuficiente"; r.text = "La Pelton Cube 230 parte de 0,5 L/s. Con menos caudal la potencia sería muy baja.";
    } else if (H >= 5 && Q > 5) {
      r.level = "warn"; r.model = "Pelton Cube 230"; r.title = "Mucho caudal para una sola Pelton"; r.text = "Superás el máximo de 5 L/s. Para potencias altas se recomienda instalar más de una central; consultanos cómo repartirlo.";
    } else {
      r.level = "warn"; r.title = "Consultanos"; r.text = "Tu combinación está fuera de los rangos de ambos modelos. Escribinos y la evaluamos.";
    }
    return r;
  }

  /* ---------------- guía: inputs, veredicto y mapa ---------------- */
  var gH = $("#gH"), gQ = $("#gQ"), gHr = $("#gHr"), gQr = $("#gQr");
  var HR = [0.5, 150], QR = [0.2, 100];
  function toSlider(v, r) { return 100 * Math.log(v / r[0]) / Math.log(r[1] / r[0]); }
  function fromSlider(t, r) { var v = r[0] * Math.pow(r[1] / r[0], t / 100); return Number(v.toPrecision(2)); }
  function clamp(v, r) { return Math.min(Math.max(v, r[0]), r[1]); }

  var mapEl = $("#rangeMap");
  var M = { w: 480, h: 360, l: 52, r: 14, t: 14, b: 44, qx: [0.3, 60], hy: [0.5, 150] };
  function mx(q) { return M.l + (Math.log(q / M.qx[0]) / Math.log(M.qx[1] / M.qx[0])) * (M.w - M.l - M.r); }
  function my(h) { return M.h - M.b - (Math.log(h / M.hy[0]) / Math.log(M.hy[1] / M.hy[0])) * (M.h - M.t - M.b); }
  function drawMap(H, Q) {
    mapEl.setAttribute("viewBox", "0 0 " + M.w + " " + M.h);
    mapEl.innerHTML = "";
    mapEl.appendChild(el("title", { id: "mapT" }, "Mapa de caída y caudal con los rangos de cada turbina"));
    mapEl.appendChild(el("desc", { id: "mapD" }, "Gráfico logarítmico. La turbina LH 140 cubre caídas de 1 a 3 metros y caudales de 15 a 40 litros por segundo. La Pelton Cube 230 cubre caídas de 5 a 100 metros y caudales de 0,5 a 5 litros por segundo."));
    var g = el("g", {}); mapEl.appendChild(g);
    [0.5, 1, 2, 5, 10, 20, 50].forEach(function (q) {
      g.appendChild(el("line", { x1: mx(q), x2: mx(q), y1: M.t, y2: M.h - M.b, stroke: "rgba(255,255,255,.12)" }));
      g.appendChild(el("text", { x: mx(q), y: M.h - M.b + 18, "text-anchor": "middle", "font-size": 14, fill: "#c3d6da" }, fmt(q, 1).replace(",0", "")));
    });
    [1, 2, 5, 10, 20, 50, 100].forEach(function (h) {
      g.appendChild(el("line", { x1: M.l, x2: M.w - M.r, y1: my(h), y2: my(h), stroke: "rgba(255,255,255,.12)" }));
      g.appendChild(el("text", { x: M.l - 8, y: my(h) + 4, "text-anchor": "end", "font-size": 14, fill: "#c3d6da" }, String(h)));
    });
    g.appendChild(el("text", { x: (M.l + M.w - M.r) / 2, y: M.h - 6, "text-anchor": "middle", "font-size": 13, fill: "#e6f0f1" }, "Caudal (L/s)"));
    var yl = el("text", { x: 14, y: (M.t + M.h - M.b) / 2, "text-anchor": "middle", "font-size": 13, fill: "#e6f0f1", transform: "rotate(-90 14 " + ((M.t + M.h - M.b) / 2) + ")" }, "Caída (m)");
    g.appendChild(yl);
    function box(q1, q2, h1, h2, fill, stroke, dash) {
      return el("rect", { x: mx(q1), y: my(h2), width: mx(q2) - mx(q1), height: my(h1) - my(h2), fill: fill, stroke: stroke, "stroke-width": 2, "stroke-dasharray": dash || "0", rx: 4 });
    }
    // Pelton: nominal (claro) + tabla (sólido)
    g.appendChild(box(0.5, 5, 5, 100, "rgba(240,160,116,.14)", "#f0a074", "5 4"));
    g.appendChild(box(0.5, 3, 5, 50, "rgba(240,160,116,.34)", "#f0a074"));
    // LH: tabla
    g.appendChild(box(15, 40, 1, 3, "rgba(127,211,230,.38)", "#7fd3e6"));
    g.appendChild(el("text", { x: mx(0.5), y: my(100) - 6, "font-size": 14, "font-weight": 600, fill: "#ffd9c2" }, "Pelton Cube 230"));
    g.appendChild(el("text", { x: mx(15), y: my(1) + 18, "font-size": 14, "font-weight": 600, fill: "#d3f3fb" }, "LH 140"));
    if (H > 0 && Q > 0) {
      var cx = mx(clamp(Q, M.qx)), cy = my(clamp(H, M.hy));
      g.appendChild(el("circle", { cx: cx, cy: cy, r: 13, fill: "none", stroke: "#fff", "stroke-width": 2, opacity: .7 }));
      g.appendChild(el("circle", { cx: cx, cy: cy, r: 7, fill: "#b4501c", stroke: "#fff", "stroke-width": 2.5 }));
      var left = cx > M.w - 110;
      g.appendChild(el("text", { x: cx + (left ? -16 : 16), y: cy - 14, "text-anchor": left ? "end" : "start", "font-size": 13, "font-weight": 600, fill: "#fff", stroke: "#0b222b", "stroke-width": 3, "paint-order": "stroke" }, "Tu sitio"));
    }
  }

  var quoteSeed = null;
  function updateGuide(src) {
    var H = parseFloat(gH.value), Q = parseFloat(gQ.value);
    if (src !== "slider") {
      if (H > 0) gHr.value = toSlider(clamp(H, HR), HR);
      if (Q > 0) gQr.value = toSlider(clamp(Q, QR), QR);
    }
    var r = recommend(H, Q), v = $("#verdict");
    v.setAttribute("data-level", r.level);
    var html = '<p class="verdict__k">Recomendación</p><h3>' + r.title + "</h3><p>" + r.text + "</p>";
    if (r.est) html += '<p class="verdict__est">' + r.est + "</p>";
    html += '<div class="verdict__go">';
    if (r.model === "LH 140") html += '<a class="btn btn--ghost" href="#lh140">Ver LH 140</a>';
    if (r.model === "Pelton Cube 230") html += '<a class="btn btn--ghost" href="#pelton">Ver Pelton Cube 230</a>';
    if (H > 0 && Q > 0) html += '<a class="btn btn--ghost" href="#calculadora" data-act="calc">Estimar potencia</a>';
    html += '<a class="btn btn--copper" href="#cotizar" data-act="quote">Cotizar con estos datos</a></div>';
    v.innerHTML = html;
    quoteSeed = { H: H, Q: Q, model: r.model };
    highlight("#lhTable", Y.LH_TABLE, r.model === "LH 140" ? H : null, Q);
    highlight("#peTable", Y.PELTON_TABLE, r.model === "Pelton Cube 230" ? H : null, Q);
    drawMap(H, Q);
  }
  gH.addEventListener("input", function () { updateGuide(); });
  gQ.addEventListener("input", function () { updateGuide(); });
  gHr.addEventListener("input", function () { gH.value = fromSlider(parseFloat(gHr.value), HR); updateGuide("slider"); });
  gQr.addEventListener("input", function () { gQ.value = fromSlider(parseFloat(gQr.value), QR); updateGuide("slider"); });
  $$(".guide__quick .chip").forEach(function (b) {
    b.addEventListener("click", function () { gH.value = b.dataset.h; gQ.value = b.dataset.q; updateGuide(); });
  });
  $("#verdict").addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"); if (!a || !quoteSeed) return;
    if (a.dataset.act === "calc") { $("#cH").value = quoteSeed.H; $("#cQ").value = quoteSeed.Q; calc(); }
    if (a.dataset.act === "quote") { seedQuote(quoteSeed.model, quoteSeed.H, quoteSeed.Q); }
  });

  /* ---------------- gráficos ---------------- */
  function niceStep(max, n) {
    var raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function shapeEl(shape, x, y, color, filled) {
    var s = 6, a = { fill: filled === false ? "#fff" : color, stroke: color, "stroke-width": 2 };
    if (shape === "square") return el("rect", Object.assign({ x: x - s, y: y - s, width: 2 * s, height: 2 * s }, a));
    if (shape === "tri") return el("path", Object.assign({ d: "M" + x + " " + (y - s - 1) + " L" + (x + s + 1) + " " + (y + s) + " L" + (x - s - 1) + " " + (y + s) + "Z" }, a));
    return el("circle", Object.assign({ cx: x, cy: y, r: s }, a));
  }
  function chart(host, cfg) {
    var W = 460, H = 340, m = { l: 52, r: 14, t: 14, b: 46 };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-labelledby": cfg.id + "T " + cfg.id + "D" });
    svg.appendChild(el("title", { id: cfg.id + "T" }, cfg.title));
    svg.appendChild(el("desc", { id: cfg.id + "D" }, cfg.desc));
    var X = function (v) { return m.l + v / cfg.xmax * (W - m.l - m.r); };
    var Yy = function (v) { return H - m.b - v / cfg.ymax * (H - m.t - m.b); };
    var sx = niceStep(cfg.xmax, 5), sy = niceStep(cfg.ymax, 5), v;
    for (v = 0; v <= cfg.xmax + 1e-9; v += sx) {
      svg.appendChild(el("line", { x1: X(v), x2: X(v), y1: m.t, y2: H - m.b, stroke: "#e3e7e3" }));
      svg.appendChild(el("text", { x: X(v), y: H - m.b + 18, "text-anchor": v >= cfg.xmax - 1e-9 ? "end" : "middle", "font-size": 13, fill: "#4a5f67" }, String(v)));
    }
    for (v = 0; v <= cfg.ymax + 1e-9; v += sy) {
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: Yy(v), y2: Yy(v), stroke: "#e3e7e3" }));
      svg.appendChild(el("text", { x: m.l - 8, y: Yy(v) + 4, "text-anchor": "end", "font-size": 13, fill: "#4a5f67" }, String(v)));
    }
    svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, stroke: "#7d8f95" }));
    svg.appendChild(el("line", { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, stroke: "#7d8f95" }));
    svg.appendChild(el("text", { x: (m.l + W - m.r) / 2, y: H - 8, "text-anchor": "middle", "font-size": 13, fill: "#12262e", "font-weight": 600 }, cfg.xlabel));
    svg.appendChild(el("text", { x: 14, y: (m.t + H - m.b) / 2, "text-anchor": "middle", "font-size": 13, fill: "#12262e", "font-weight": 600, transform: "rotate(-90 14 " + ((m.t + H - m.b) / 2) + ")" }, cfg.ylabel));
    cfg.series.forEach(function (s) {
      if (s.line) {
        svg.appendChild(el("polyline", { points: s.pts.map(function (p) { return X(p[0]) + "," + Yy(p[1]); }).join(" "), fill: "none", stroke: s.color, "stroke-width": 2.5, "stroke-dasharray": s.dash || "0", "stroke-linejoin": "round" }));
      }
      if (s.markers !== false) s.pts.forEach(function (p, i) {
        var g = el("g", {});
        g.appendChild(shapeEl(s.shape, X(p[0]), Yy(p[1]), s.color, s.filled));
        g.appendChild(el("title", {}, s.tip ? s.tip(p, i) : s.name + ": " + fmt(p[0], 1) + " / " + fmt(p[1], 1)));
        svg.appendChild(g);
      });
    });
    if (cfg.annot) cfg.annot.forEach(function (a) {
      svg.appendChild(el("text", { x: X(a.x) + (a.dx || 0), y: Yy(a.y) + (a.dy || 0), "text-anchor": a.anchor || "start", "font-size": 13, "font-weight": 600, fill: "#12262e", stroke: "#fff", "stroke-width": 3, "paint-order": "stroke" }, a.t));
    });
    host.innerHTML = ""; host.appendChild(svg);
    var cap = document.createElement("figcaption"); cap.id = cfg.id + "Cap";
    var lg = '<ul class="legend">';
    cfg.series.forEach(function (s) {
      if (s.hideLegend) return;
      lg += '<li><svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">' +
        (s.line || s.dash ? '<line x1="0" y1="7" x2="26" y2="7" stroke="' + s.color + '" stroke-width="2.5" stroke-dasharray="' + (s.dash || "0") + '"/>' : "") +
        (s.markers === false ? "" : s.shape === "square" ? '<rect x="8" y="2" width="10" height="10" fill="' + (s.filled === false ? "#fff" : s.color) + '" stroke="' + s.color + '" stroke-width="2"/>' : s.shape === "tri" ? '<path d="M13 1 L19 13 L7 13Z" fill="' + (s.filled === false ? "#fff" : s.color) + '" stroke="' + s.color + '" stroke-width="2"/>' : '<circle cx="13" cy="7" r="5" fill="' + s.color + '" stroke="' + s.color + '" stroke-width="2"/>') +
        "</svg> " + s.name + "</li>";
    });
    cap.innerHTML = lg + "</ul>";
    host.appendChild(cap);
  }

  /* LH 140 */
  (function () {
    var T = Y.LH_TABLE, t = Y.LH_TESTS;
    var tab1 = [], tab15 = [];
    T.q.forEach(function (q, j) { if (T.p[0][j] != null) tab1.push([q, T.p[0][j]]); if (T.p[1][j] != null) tab15.push([q, T.p[1][j]]); });
    chart($("#lhChart"), {
      id: "lhC", xmax: 40, ymax: 250, xlabel: "Caudal (L/s)", ylabel: "Potencia eléctrica (W)",
      title: "LH 140: potencia medida y de tabla en función del caudal",
      desc: "Mediciones de prototipo a 1,01 m y 1,60 m de caída, comparadas con las curvas de la tabla del folleto para 1 m y 1,5 m. A 1,6 m se midieron hasta 196 W; a 1 m, hasta 79 W.",
      series: [
        { name: "Tabla folleto, 1 m", color: "#1c8da8", dash: "6 5", line: true, markers: false, pts: tab1 },
        { name: "Tabla folleto, 1,5 m", color: "#b4501c", dash: "6 5", line: true, markers: false, pts: tab15 },
        { name: "Medido a 1,01 m (62 Ω)", color: "#176f85", shape: "circle", pts: t[0].pts.map(function (p) { return [p[0], p[3]]; }),
          tip: function (p) { return "Medido a 1,01 m: " + fmt(p[0], 1) + " L/s → " + fmt(p[1], 1) + " W"; } },
        { name: "Medido a 1,60 m (61,6 Ω)", color: "#933f12", shape: "square", pts: t[1].pts.map(function (p) { return [p[0], p[3]]; }),
          tip: function (p) { return "Medido a 1,60 m: " + fmt(p[0], 1) + " L/s → " + fmt(p[1], 1) + " W"; } },
        { name: "Medido a 1,60 m (carga variable)", color: "#933f12", shape: "tri", filled: false, pts: Y.LH_TEST_EXTRA.pts.map(function (p) { return [p[0], p[5]]; }),
          tip: function (p) { return "Medido a 1,60 m, carga variable: " + fmt(p[0], 1) + " L/s → " + fmt(p[1], 1) + " W"; } }
      ]
    });
    // tabla de ensayos con eficiencia
    var rows = "<caption>Mediciones de prototipo. Eficiencia global = P eléctrica ÷ (ρ·g·Q·H).</caption><thead><tr><th scope=\"col\">Ensayo</th><th scope=\"col\">Caída (m)</th><th scope=\"col\">Q (L/s)</th><th scope=\"col\">V</th><th scope=\"col\">I (A)</th><th scope=\"col\">P (W)</th><th scope=\"col\">P hidr. (W)</th><th scope=\"col\">Efic.</th></tr></thead><tbody>";
    function row(lab, H, Q, V, I, P) {
      var ph = Y.RHO * Y.G * (Q / 1000) * H;
      rows += "<tr><td>" + lab + "</td><td>" + fmt(H, 2) + "</td><td>" + fmt(Q, 1) + "</td><td>" + fmt(V) + "</td><td>" + fmt(I, 2) + "</td><td>" + fmt(P, 1) + "</td><td>" + fmt(ph) + "</td><td>" + fmt(P / ph * 100) + " %</td></tr>";
    }
    t.forEach(function (s) { s.pts.forEach(function (p) { row(s.fecha + " · " + s.carga, s.salto, p[0], p[1], p[2], p[3]); }); });
    Y.LH_TEST_EXTRA.pts.forEach(function (p) { row(Y.LH_TEST_EXTRA.fecha + " · " + fmt(p[4], 1) + " Ω", Y.LH_TEST_EXTRA.salto, p[0], p[2], p[3], p[5]); });
    $("#lhTests").innerHTML = rows + "</tbody>";
  })();

  /* Pelton */
  (function () {
    var T = Y.PELTON_TEST, ph = Y.RHO * Y.G * (T.caudal / 1000) * T.salto;
    var pts = T.pts.map(function (p) { return [p[0], p[3]]; }).sort(function (a, b) { return a[0] - b[0]; });
    var tipP = function (p) { var o = T.pts.filter(function (q) { return q[0] === p[0]; })[0]; return fmt(p[0]) + " rpm · " + fmt(o[1], 1) + " V · " + fmt(o[2], 2) + " A → " + fmt(o[3], 1) + " W"; };
    chart($("#peChart"), {
      id: "peC", xmax: 1000, ymax: 80, xlabel: "Velocidad de la turbina (rpm)", ylabel: "Potencia eléctrica (W)",
      title: "Pelton Cube 230: potencia medida en función de la velocidad",
      desc: "Prototipo ensayado a 20 m de salto con boquilla de 9 mm. La potencia máxima medida fue 65 W a 584 rpm; en vacío la turbina llegó a 960 rpm.",
      series: [{ name: "Medido a 20 m, boquilla de 9 mm", color: "#933f12", shape: "square", line: true, pts: pts.filter(function (p) { return p[0] > 500; }), tip: tipP },
        { name: "", hideLegend: true, color: "#933f12", shape: "square", pts: pts.filter(function (p) { return p[0] <= 500; }), tip: tipP }],
      annot: [{ x: 584, y: 65.2, t: "65 W", dx: -10, dy: -12, anchor: "end" }]
    });
    var rows = "<caption>Prototipo, 20 m, boquilla 9 mm, 1,2 L/s (potencia hidráulica ≈ " + fmt(ph) + " W).</caption><thead><tr><th scope=\"col\">rpm</th><th scope=\"col\">V</th><th scope=\"col\">I (A)</th><th scope=\"col\">Carga (Ω)</th><th scope=\"col\">P (W)</th><th scope=\"col\">Efic.</th></tr></thead><tbody>";
    T.pts.forEach(function (p) { rows += "<tr><td>" + fmt(p[0]) + "</td><td>" + fmt(p[1], 1) + "</td><td>" + fmt(p[2], 2) + "</td><td>" + (p[4] == null ? "vacío" : fmt(p[4], 1)) + "</td><td>" + fmt(p[3], 1) + "</td><td>" + fmt(p[3] / ph * 100) + " %</td></tr>"; });
    $("#peTests").innerHTML = rows + "</tbody>";
  })();

  /* ---------------- calculadora ---------------- */
  var cQ = $("#cQ"), cH = $("#cH"), cE = $("#cE"), cD = $("#cD");
  function calc() {
    var Q = parseFloat(cQ.value), H = parseFloat(cH.value), E = parseFloat(cE.value), D = parseFloat(cD.value);
    var ok = Q > 0 && H > 0 && E > 0;
    $$("#calcForm .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(parseFloat(b.dataset.e) === E)); });
    if (!ok) { ["rHid", "rEle", "rDia", "rMes"].forEach(function (i) { $("#" + i).textContent = "—"; }); $("#rModel").textContent = "Ingresá caudal, caída y eficiencia para calcular."; return; }
    var hid = Y.RHO * Y.G * (Q / 1000) * H, ele = hid * Math.min(E, 100) / 100, hrs = isNaN(D) ? 24 : Math.min(Math.max(D, 0), 24);
    var kwh = ele * hrs / 1000;
    $("#rHid").textContent = fmt(hid, hid < 100 ? 1 : 0);
    $("#rEle").textContent = fmt(ele, ele < 100 ? 1 : 0);
    $("#rDia").textContent = fmt(kwh, 2);
    $("#rMes").textContent = fmt(kwh * 30, 1);
    var r = recommend(H, Q), msg = "";
    if (r.model === "LH 140") {
      var a = lookup(Y.LH_TABLE, H, Q);
      msg = "Para este sitio corresponde el LH 140. " + (a.status === "ok" ? "La tabla del folleto indica ≈ " + fmt(a.p) + " W para esta caída y caudal." : "La tabla del folleto no cubre este punto exacto: consultanos.");
      if (ele > 600) msg += " Ojo: el LH 140 declara hasta 600 W; el resto del caudal requeriría otra unidad.";
    } else if (r.model === "Pelton Cube 230") {
      var b = lookup(Y.PELTON_TABLE, H, Q);
      msg = "Para este sitio corresponde la Pelton Cube 230. " + (b.status === "ok" ? "La tabla del folleto (potencia máxima) indica ≈ " + fmt(b.p) + " W." : "La tabla del folleto no cubre este punto exacto: consultanos.");
      if (ele > 800) msg += " Para más de 800 W se recomienda más de una central.";
    } else msg = "Esta combinación queda fuera de los rangos de los dos modelos (" + r.title.toLowerCase() + "). Escribinos para evaluarla.";
    $("#rModel").textContent = msg;
  }
  [cQ, cH, cE, cD].forEach(function (i) { i.addEventListener("input", calc); });
  $$("#calcForm .chip").forEach(function (b) { b.addEventListener("click", function () { cE.value = b.dataset.e; calc(); }); });

  /* ---------------- cotizar ---------------- */
  var qf = $("#quoteForm");
  function val(n) { return (qf.elements[n].value || "").trim(); }
  function buildMsg() {
    var l = ["Hola Yaku Energía, quiero cotizar una turbina hidroeléctrica.", ""];
    if (val("nombre")) l.push("Nombre: " + val("nombre"));
    if (val("lugar")) l.push("Lugar: " + val("lugar"));
    l.push("Modelo de interés: " + qf.elements.modelo.value);
    if (val("caida")) l.push("Caída disponible: " + val("caida").replace(".", ",") + " m");
    if (val("caudal")) l.push("Caudal disponible: " + val("caudal").replace(".", ",") + " L/s");
    l.push("Uso: " + val("uso"));
    if (val("mensaje")) l.push("", val("mensaje"));
    l.push("", "(Consulta enviada desde el sitio web)");
    return l.join("\n");
  }
  function refresh() { $("#qPrev").textContent = buildMsg(); }
  qf.addEventListener("input", refresh); qf.addEventListener("change", refresh);
  function needName() { var bad = !val("nombre"); $("#qErr").hidden = !bad; if (bad) $("#qN").focus(); return !bad; }
  $("#sendWa").addEventListener("click", function () {
    if (!needName()) return;
    window.open(waUrl + "?text=" + encodeURIComponent(buildMsg()), "_blank", "noopener");
  });
  $("#sendMail").addEventListener("click", function () {
    if (!needName()) return;
    var subj = "Consulta por " + (qf.elements.modelo.value === "No sé cuál necesito" ? "turbina hidroeléctrica" : qf.elements.modelo.value) + " — " + val("nombre");
    window.location.href = "mailto:" + C.EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(buildMsg());
  });
  $("#copyMsg").addEventListener("click", function () {
    var b = this, txt = buildMsg();
    function done() { var o = b.textContent; b.textContent = "¡Copiado!"; setTimeout(function () { b.textContent = o; }, 1800); }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {});
  });
  function seedQuote(model, H, Q) {
    if (model) { var r = $$('input[name="modelo"]', qf).filter(function (x) { return x.value === model; })[0]; if (r) r.checked = true; }
    if (H > 0) qf.elements.caida.value = H;
    if (Q > 0) qf.elements.caudal.value = Q;
    refresh();
  }
  $$("[data-model]").forEach(function (a) { a.addEventListener("click", function () { seedQuote(a.dataset.model); }); });

  /* ---------------- init ---------------- */
  calc(); refresh(); updateGuide();
})();
