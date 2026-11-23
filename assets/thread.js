/*
  Red thread: one path that morphs between the desktop and the mobile shape.
  Both Figma threads have the same points (M + 26 curves), so every point
  slides from its desktop position to its mobile one when the layout switches.
  Coordinates are kept in "page widths" (x / frame width), so the thread
  stays attached to the page while it stretches.
*/
(function () {
  var canvas = document.querySelector('.canvas');
  var dEl = document.querySelector('.thread.d');
  var mEl = document.querySelector('.thread.m');
  if (!canvas || !dEl || !mEl || !window.requestAnimationFrame) return;

  // frame width and where each thread sits on its frame (from Figma)
  // a page can override these (window.THREAD_CFG), e.g. the Russian page has its own ribbon
  var CFG = window.THREAD_CFG || {};
  var D = CFG.D || { frame: 1280, x: -1205.59, y: -12.27, stroke: 42 };
  var M = CFG.M || { frame: 393, x: -502.03, y: -101.32, stroke: 20 };

  function points(el, cfg) {
    var d = el.querySelector('path').getAttribute('d');
    var nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi).map(Number);
    for (var i = 0; i < nums.length; i++) {
      nums[i] = (nums[i] + (i % 2 ? cfg.y : cfg.x)) / cfg.frame;
    }
    return nums;
  }
  var dp = points(dEl, D), mp = points(mEl, M);
  if (dp.length !== mp.length) return; // shapes don't match: keep the static threads

  var NS = 'http://www.w3.org/2000/svg';
  var box = document.createElement('div');
  box.className = 'thread-morph';
  box.setAttribute('aria-hidden', 'true');
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('focusable', 'false');
  var path = document.createElementNS(NS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#A02311');
  svg.appendChild(path);
  box.appendChild(svg);
  dEl.parentNode.insertBefore(box, dEl);

  /*
    Section edges follow the ribbon: each edge is a stretch of the ribbon's
    centre line (segment index + t, desktop / mobile), extended flat to the
    page sides. The colour above the line and below it are painted up to the
    ribbon, so the seam always sits exactly under the ribbon, even mid-morph.
    lines: band edges (in frame px) the painted area must cover.
  */
  var EDGES = [
    { from: [3.75, 3.5], to: [5, 5], up: 'sand', down: 'mint', lines: [[972], [600]] },
    { from: [10.1, 10.1], to: [11, 11], up: 'navy', upLeft: ['blue', 632], down: 'sand',
      lines: [[2722, 2766], [1792, 1797]] },
    { from: [12.4, 12.5], to: [13.8, 13.6], up: 'sand', down: 'navy', lines: [[3669], [2658, 2667]] },
    { from: [14.05, 14.25], to: [14.8, 14.73], then: { from: [16.76, 16.73], to: [17, 17] }, up: 'navy', down: 'mint', lines: [[4600, 4642], [3358]] }
  ];
  if (CFG.mLines) CFG.mLines.forEach(function (l, i) { if (EDGES[i]) EDGES[i].lines[1] = l; });
  if (CFG.dLines) CFG.dLines.forEach(function (l, i) { if (EDGES[i]) EDGES[i].lines[0] = l; });
  var eBox = document.createElement('div');
  eBox.className = 'edge-morph';
  eBox.setAttribute('aria-hidden', 'true');
  var eSvg = document.createElementNS(NS, 'svg');
  eSvg.setAttribute('preserveAspectRatio', 'none');
  eSvg.setAttribute('focusable', 'false');
  var defs = document.createElementNS(NS, 'defs');
  eSvg.appendChild(defs);
  EDGES.forEach(function (e, k) {
    e.upPath = document.createElementNS(NS, 'path');
    e.downPath = document.createElementNS(NS, 'path');
    e.upPath.setAttribute('fill', 'var(--' + e.up + ')');
    e.downPath.setAttribute('fill', 'var(--' + e.down + ')');
    eSvg.appendChild(e.upPath);
    if (e.upLeft) {
      var cp = document.createElementNS(NS, 'clipPath');
      cp.id = 'edge-left-' + k;
      e.clipRect = document.createElementNS(NS, 'rect');
      cp.appendChild(e.clipRect);
      defs.appendChild(cp);
      e.leftPath = document.createElementNS(NS, 'path');
      e.leftPath.setAttribute('fill', 'var(--' + e.upLeft[0] + ')');
      e.leftPath.setAttribute('clip-path', 'url(#' + cp.id + ')');
      eSvg.appendChild(e.leftPath);
    }
    eSvg.appendChild(e.downPath);
  });
  eBox.appendChild(eSvg);
  dEl.parentNode.insertBefore(eBox, dEl);
  document.documentElement.classList.add('js-thread');

  var mq = window.matchMedia('(max-width: 767px)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var t = mq.matches ? 1 : 0; // 0 = desktop shape, 1 = mobile shape
  var raf = 0;

  // probe = the design frame (1280 or 393 wide), centred inside the canvas
  var probe = document.createElement('div');
  probe.className = 'c';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = '--x:0;--y:0;--w:1280;--h:0;--mx:0;--my:0;--mw:393;--mh:0;visibility:hidden;pointer-events:none';
  canvas.appendChild(probe);

  function fit() {
    var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    var fw = probe.offsetWidth || w, ox = probe.offsetLeft || 0, oy = probe.offsetTop || 0;
    var vb = (-ox / fw) + ' ' + (-oy / fw) + ' ' + (w / fw) + ' ' + (h / fw);
    svg.setAttribute('viewBox', vb);
    eSvg.setAttribute('viewBox', vb);
  }

  var cur = dp.slice();

  // point on the ribbon at "segment index + t"
  function at(q) {
    var i = Math.min(Math.floor(q), (cur.length - 2) / 6 - 1), u = q - i, v = 1 - u, b = i * 6;
    var a = v * v * v, c1 = 3 * v * v * u, c2 = 3 * v * u * u, d = u * u * u;
    return [
      a * cur[b] + c1 * cur[b + 2] + c2 * cur[b + 4] + d * cur[b + 6],
      a * cur[b + 1] + c1 * cur[b + 3] + c2 * cur[b + 5] + d * cur[b + 7]
    ];
  }
  function poly(pts) {
    var s = 'M';
    for (var i = 0; i < pts.length; i++) s += (i ? 'L' : '') + pts[i][0].toFixed(5) + ' ' + pts[i][1].toFixed(5);
    return s + 'Z';
  }

  function drawEdges() {
    var lay = mq.matches ? 1 : 0, frame = lay ? 393 : 1280;
    EDGES.forEach(function (e) {
      // the edge follows one stretch of ribbon, or two joined where the strands cross
      var line = [], i, part = e;
      while (part) {
        var q0 = part.from[0] + (part.from[1] - part.from[0]) * t;
        var q1 = part.to[0] + (part.to[1] - part.to[0]) * t;
        var k = Math.max(8, Math.ceil((q1 - q0) * 40));
        for (i = 0; i <= k; i++) line.push(at(q0 + (q1 - q0) * i / k));
        part = part.then;
      }
      var n = line.length - 1;
      if (line[0][0] > line[n][0]) line.reverse();
      var lo = Infinity, hi = -Infinity, xl = -3, xr = 4;
      for (i = 0; i < line.length; i++) {
        lo = Math.min(lo, line[i][1]); hi = Math.max(hi, line[i][1]);
        xl = Math.min(xl, line[i][0] - 0.02); xr = Math.max(xr, line[i][0] + 0.02);
      }
      e.lines[lay].forEach(function (y) { lo = Math.min(lo, y / frame); hi = Math.max(hi, y / frame); });
      lo -= 6 / frame; hi += 6 / frame;
      var edge = [[xl, line[0][1]]].concat(line, [[xr, line[n][1]]]);
      var up = [[xl, lo], [xr, lo]].concat(edge.slice().reverse());
      var down = edge.concat([[xr, hi], [xl, hi]]);
      e.upPath.setAttribute('d', poly(up));
      e.downPath.setAttribute('d', poly(down));
      if (e.leftPath) {
        if (lay === 0) {
          e.leftPath.setAttribute('d', poly(up));
          e.clipRect.setAttribute('x', xl); e.clipRect.setAttribute('y', lo);
          e.clipRect.setAttribute('width', e.upLeft[1] / 1280 - xl);
          e.clipRect.setAttribute('height', hi - lo);
        } else {
          e.leftPath.removeAttribute('d');
        }
      }
    });
  }

  function draw() {
    var s = 'M', p, i;
    for (i = 0; i < dp.length; i++) {
      p = dp[i] + (mp[i] - dp[i]) * t;
      cur[i] = p;
      if (i === 2) s += 'C';
      s += (i && i !== 2 ? ' ' : '') + p.toFixed(5);
    }
    // lead-in: continue the ribbon straight back from its first point, far past
    // the top edge, so its cut end never shows (e.g. in the side margins of wide screens)
    var dx = cur[0] - cur[2], dy = cur[1] - cur[3], dl = Math.sqrt(dx * dx + dy * dy) || 1;
    var ext = 1.5; // in page widths
    var lead = 'M' + (cur[0] + dx / dl * ext).toFixed(5) + ' ' + (cur[1] + dy / dl * ext).toFixed(5) + 'L';
    path.setAttribute('d', lead + s.slice(1));
    var sw = D.stroke / D.frame + (M.stroke / M.frame - D.stroke / D.frame) * t;
    path.setAttribute('stroke-width', sw.toFixed(5));
    drawEdges();
  }

  function ease(x) { return (1 - Math.cos(Math.PI * x)) / 2; }

  function go(target) {
    cancelAnimationFrame(raf);
    fit();
    if (calm.matches) { t = target; draw(); return; }
    var from = t, start = null, dur = 2000 * Math.abs(target - from);
    if (!dur) { draw(); return; }
    function step(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / dur);
      t = from + (target - from) * ease(k);
      draw();
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  fit(); draw();
  var onChange = function () { fit(); drawEdges(); go(mq.matches ? 1 : 0); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else mq.addListener(onChange);
  window.addEventListener('resize', fit);
})();
