/* =============================================
   PIZZAGOOGLE — APP LOGIC
   ============================================= */

let currentQuery   = '';
let currentDamping = 0.85;
let iterState      = { pr: null, step: -1 }; // -1 = converged

/* ════════════ SEARCH ════════════ */

function runSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  currentQuery = q;

  const oldRanked = computeOldRanking(PAGES, q);
  const newRanked = computePageRankRanking(PAGES, q);

  document.getElementById('landingSection').style.display  = 'none';
  document.getElementById('resultsSection').style.display  = 'block';

  renderSpamAlert(oldRanked, newRanked, q);
  renderOldResults(oldRanked, newRanked, q);
  renderNewResults(newRanked, oldRanked);
}

function setSearch(term) {
  document.getElementById('searchInput').value = term;
  runSearch();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentQuery = '';
  document.getElementById('resultsSection').style.display  = 'none';
  document.getElementById('landingSection').style.display  = 'block';
  document.getElementById('spamAlert').style.display = 'none';
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

/* ════════════ SPAM ALERT ════════════ */

function renderSpamAlert(oldRanked, newRanked, query) {
  const alert = document.getElementById('spamAlert');
  if (query === '*') { alert.style.display = 'none'; return; }

  const oldWinner = oldRanked[0];
  const newWinner = newRanked[0];
  const spammerId = 'pizza-pizza-pizza'; // known spammer

  const oldSpammerRank = oldRanked.findIndex(p => p.id === spammerId) + 1;
  const newSpammerRank = newRanked.findIndex(p => p.id === spammerId) + 1;
  const matched = oldRanked.filter(p => p.score > 0).length;

  const title = document.getElementById('spamTitle');
  const desc  = document.getElementById('spamDesc');
  const pill  = document.getElementById('spamCountPill');

  if (oldWinner.id === spammerId && newWinner.id !== spammerId) {
    title.textContent = `Spam Exposed! Old Way crowns #1 Raccoon (keyword spam) vs. PageRank crowns ${newWinner.mascotName} (${(newWinner.pageRank * 100).toFixed(1)}% rank)`;
    desc.textContent  = ` Notice how Sneaky Raccoon repeats the keyword many times but has ZERO quality inbound links — PageRank exposes the trick!`;
  } else {
    title.textContent = `Ranking Difference Detected!`;
    desc.textContent  = ` Old keyword ranking vs PageRank authority gives different results for "${query}". Scroll down to compare!`;
  }
  pill.textContent = `${matched} of ${PAGES.length} sites matched`;
  alert.style.display = 'block';
}

/* ════════════ HIGHLIGHT KEYWORDS ════════════ */

function highlightKeywords(text, query) {
  if (!query || query === '*') return text;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;
  words.forEach(word => {
    if (word.length < 2) return;
    const re = new RegExp(`(${word})`, 'gi');
    result = result.replace(re, '<mark>$1</mark>');
  });
  return result;
}

/* ════════════ MASCOT AVATAR ════════════ */

function mascotAvatar(page) {
  return `<div class="card-mascot" style="background:${page.mascotBg}" title="${page.mascotName}">${page.mascotEmoji}</div>`;
}

/* ════════════ INBOUND LINKS LIST ════════════ */

function inboundLinks(pageId) {
  return Object.entries(LINK_GRAPH)
    .filter(([, tos]) => tos.includes(pageId))
    .map(([from]) => {
      const p = PAGES.find(x => x.id === from);
      return p ? `${p.mascotEmoji} ${p.title}` : from;
    });
}

/* ════════════ OLD RESULTS ════════════ */

function renderOldResults(oldRanked, newRanked, query) {
  const container = document.getElementById('oldResultsList');
  const maxScore  = Math.max(...oldRanked.map(p => p.score), 1);
  container.innerHTML = '';

  oldRanked.forEach((page, i) => {
    const newPos = newRanked.findIndex(p => p.id === page.id);
    const diff   = newPos - i;
    const kwCount = countKeyword(page, query);
    const isSpammer = page.id === 'pizza-pizza-pizza' && i === 0;

    let posBadge = '';
    if      (diff < 0) posBadge = `<span class="position-change pos-up">▲ Rises ${Math.abs(diff)} in PageRank</span>`;
    else if (diff > 0) posBadge = `<span class="position-change pos-down">▼ Drops ${diff} in PageRank</span>`;
    else               posBadge = `<span class="position-change pos-same">= Same in PageRank</span>`;

    const rank1Class = i === 0 ? 'rank-1' : '';
    const spamPill   = isSpammer ? `<span class="card-spam-pill">🚨 Spam Trick Worked!</span>` : '';

    const snippet = highlightKeywords(page.desc.slice(0, 160) + '…', query);
    const inLinks = inboundLinks(page.id);

    container.innerHTML += `
      <div class="result-card" onclick="window.open('${page.url}','_blank')">
        ${mascotAvatar(page)}
        <div class="card-body">
          <div class="card-top">
            <span class="rank-pill rank-pill-old ${rank1Class}">${i === 0 ? '👑' : '#'}${i + 1}</span>
            <span class="card-site-name">Site #${page.siteNum} · ${page.mascotName}</span>
            ${spamPill}
          </div>
          <a class="card-url" href="${page.url}" target="_blank" onclick="e => e.stopPropagation()">${page.url}</a>
          <p class="card-snippet">${snippet}</p>
          <div class="card-metrics">
            <span class="metric-pill metric-old">🔤 Keyword Count: <strong>${kwCount}×</strong></span>
            ${isSpammer ? '<span class="metric-pill metric-spam">🚨 0 Inbound Links</span>' : ''}
            <span class="metric-pill metric-links">🔗 ${inLinks.length} inbound link${inLinks.length !== 1 ? 's' : ''}</span>
          </div>
          ${posBadge}
        </div>
      </div>`;
  });
}

/* ════════════ PAGERANK RESULTS ════════════ */

function renderNewResults(newRanked, oldRanked) {
  const container = document.getElementById('newResultsList');
  const maxPR     = Math.max(...newRanked.map(p => p.pageRank), 0.001);
  container.innerHTML = '';

  newRanked.forEach((page, i) => {
    const oldPos    = oldRanked.findIndex(p => p.id === page.id);
    const diff      = oldPos - i;
    const inLinks   = inboundLinks(page.id);
    const prPct     = (page.pageRank * 100).toFixed(1);
    const barWidth  = (page.pageRank / maxPR * 100).toFixed(1);
    const isSpammer = page.id === 'pizza-pizza-pizza';
    const isWinner  = i === 0;

    let posBadge = '';
    if      (diff > 0) posBadge = `<span class="position-change pos-up">▲ Up ${diff} from Old Ranking</span>`;
    else if (diff < 0) posBadge = `<span class="position-change pos-down">▼ Down ${Math.abs(diff)} from Old Ranking</span>`;
    else               posBadge = `<span class="position-change pos-same">= Same as Old Ranking</span>`;

    const crownPill = isWinner  ? `<span class="card-crown-pill">👑 PageRank Winner!</span>` : '';
    const demotePill = isSpammer ? `<span class="metric-pill metric-demote">🎺 Demoted! (spam exposed)</span>` : '';

    const voterLinks = inLinks.map(l => `<span>${l}</span>`).join('');

    container.innerHTML += `
      <div class="result-card" onclick="window.open('${page.url}','_blank')">
        ${mascotAvatar(page)}
        <div class="card-body">
          <div class="card-top">
            <span class="rank-pill rank-pill-new ${i===0?'rank-1':''}">${i===0?'👑':'#'}${i+1}</span>
            <span class="card-site-name">Site #${page.siteNum} · ${page.mascotName}</span>
            ${crownPill}
          </div>
          <a class="card-url" href="${page.url}" target="_blank">${page.url}</a>
          <div class="card-metrics">
            <span class="metric-pill metric-new">📊 PageRank: ${prPct}% (${page.pageRank.toFixed(4)})</span>
            <span class="metric-pill metric-links">🔗 ${inLinks.length} vote${inLinks.length !== 1 ? 's' : ''}</span>
            ${demotePill}
          </div>
          <div class="pr-bar-wrap">
            <div class="pr-bar-label">
              <span>Votes from: ${inLinks.length > 0 ? inLinks.map(l => l.split(' ').slice(0,2).join(' ')).join(', ') : 'nobody 😢'}</span>
              <span>${prPct}%</span>
            </div>
            <div class="pr-bar"><div class="pr-bar-fill" style="width:${barWidth}%"></div></div>
          </div>
          ${posBadge}
        </div>
      </div>`;
  });
}

/* ════════════ DATASET TABLE ════════════ */

function buildDatasetTable() {
  const body = document.getElementById('datasetBody');
  const pr   = PAGE_RANKS;
  const maxPR = Math.max(...Object.values(pr));

  PAGES.forEach((page, i) => {
    const outLinks = (LINK_GRAPH[page.id] || []).map(id => {
      const p = PAGES.find(x => x.id === id);
      return p ? `<span>${p.mascotEmoji} ${p.title}</span>` : id;
    }).join('');

    const inLinks = inboundLinks(page.id).map(l => `<span>${l}</span>`).join('');

    const prVal  = pr[page.id];
    const prClass = prVal >= maxPR * 0.75 ? 'pr-high' : prVal >= maxPR * 0.4 ? 'pr-mid' : 'pr-low';

    body.innerHTML += `
      <tr>
        <td><strong>${i+1}</strong></td>
        <td class="td-mascot" title="${page.mascotName}">${page.mascotEmoji}</td>
        <td><div class="td-url">${page.url}</div><div style="font-size:0.72rem;color:#78716C;margin-top:2px">${page.mascotName} · ${page.mascotLabel}</div></td>
        <td class="td-links">${outLinks || '<span style="opacity:0.5">none</span>'}</td>
        <td class="td-links">${inLinks  || '<span style="opacity:0.5">none</span>'}</td>
        <td class="td-pr ${prClass}">${(prVal * 100).toFixed(1)}%</td>
      </tr>`;
  });
}

/* ════════════ LINK GRAPH CANVAS ════════════ */

let hoveredNode  = null;
let selectedNode = null;
let graphPR      = { ...PAGE_RANKS };

const NODE_POSITIONS = {}; // set at draw time

function drawGraph(pr = graphPR) {
  const canvas = document.getElementById('graphCanvas');
  const wrap   = canvas.parentElement;
  const W      = wrap.clientWidth  || 900;
  const H      = 400;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const ids = PAGES.map(p => p.id);
  const N   = ids.length;
  const cx  = W / 2, cy = H / 2;
  const rx  = Math.min(W * 0.36, 280);
  const ry  = Math.min(H * 0.36, 140);

  // Compute positions (ellipse layout)
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2;
    NODE_POSITIONS[id] = {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  });

  const maxPR = Math.max(...Object.values(pr));

  // Draw edges
  ids.forEach(from => {
    (LINK_GRAPH[from] || []).forEach(to => {
      const a = NODE_POSITIONS[from];
      const b = NODE_POSITIONS[to];
      if (!a || !b) return;

      const isHighlighted = selectedNode === from || selectedNode === to;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const ux = dx / dist, uy = dy / dist;
      const nodeR = getNodeR(pr[from], maxPR);
      const nodeRTo = getNodeR(pr[to], maxPR);

      ctx.beginPath();
      ctx.strokeStyle = isHighlighted ? '#1D4ED8' : 'rgba(161,140,100,0.3)';
      ctx.lineWidth   = isHighlighted ? 2.5 : 1.5;
      ctx.setLineDash(isHighlighted ? [] : [5, 4]);
      ctx.moveTo(a.x + ux * nodeR, a.y + uy * nodeR);
      ctx.lineTo(b.x - ux * (nodeRTo + 2), b.y - uy * (nodeRTo + 2));
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const ex = b.x - ux * (nodeRTo + 2), ey = b.y - uy * (nodeRTo + 2);
      const ang = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.fillStyle = isHighlighted ? '#1D4ED8' : 'rgba(161,140,100,0.5)';
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10 * Math.cos(ang - 0.4), ey - 10 * Math.sin(ang - 0.4));
      ctx.lineTo(ex - 10 * Math.cos(ang + 0.4), ey - 10 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    });
  });

  // Draw nodes
  ids.forEach(id => {
    const { x, y } = NODE_POSITIONS[id];
    const page = PAGES.find(p => p.id === id);
    const r    = getNodeR(pr[id], maxPR);
    const isSelected = selectedNode === id;
    const isHovered  = hoveredNode === id;

    // Shadow
    if (isSelected || isHovered) {
      ctx.shadowColor = '#1D4ED8';
      ctx.shadowBlur  = 16;
    }

    // Node circle
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    if (id === 'best-pizza-pune') {
      grad.addColorStop(0, '#FDE68A');
      grad.addColorStop(1, '#D97706');
    } else if (id === 'pune-food-guide') {
      grad.addColorStop(0, '#93C5FD');
      grad.addColorStop(1, '#1D4ED8');
    } else if (id === 'pizza-pizza-pizza') {
      grad.addColorStop(0, '#E5E7EB');
      grad.addColorStop(1, '#9CA3AF');
    } else {
      grad.addColorStop(0, '#A7F3D0');
      grad.addColorStop(1, '#059669');
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isSelected) {
      ctx.strokeStyle = '#1D4ED8';
      ctx.lineWidth   = 3;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = 1.5;
    }
    ctx.stroke();

    // Emoji
    ctx.font      = `${Math.max(r * 0.9, 14)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(page.mascotEmoji, x, y);

    // Name label
    ctx.fillStyle = '#374151';
    ctx.font      = `bold ${W > 600 ? 11 : 9}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    const shortName = page.title.split(' ').slice(0, 2).join('\n');
    const lines = shortName.split('\n');
    lines.forEach((line, li) => ctx.fillText(line, x, y + r + 5 + li * 13));

    // PR value
    ctx.fillStyle = '#1D4ED8';
    ctx.font      = `bold ${W > 600 ? 10 : 9}px Inter, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(pr[id] * 100).toFixed(1)}%`, x, y - r - 4);
  });
}

function getNodeR(prVal, maxPR) {
  return 20 + 18 * (prVal / maxPR);
}

// Click / hover detection
function setupGraphInteraction() {
  const canvas = document.getElementById('graphCanvas');

  canvas.addEventListener('mousemove', e => {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleX;
    const maxPR = Math.max(...Object.values(graphPR));
    let found = null;
    PAGES.forEach(p => {
      const pos = NODE_POSITIONS[p.id];
      if (!pos) return;
      const r = getNodeR(graphPR[p.id], maxPR);
      if (Math.hypot(mx - pos.x, my - pos.y) < r) found = p.id;
    });
    if (found !== hoveredNode) {
      hoveredNode = found;
      canvas.style.cursor = found ? 'pointer' : 'default';
      drawGraph(graphPR);
    }
  });

  canvas.addEventListener('click', e => {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleX;
    const maxPR = Math.max(...Object.values(graphPR));
    let found = null;
    PAGES.forEach(p => {
      const pos = NODE_POSITIONS[p.id];
      if (!pos) return;
      const r = getNodeR(graphPR[p.id], maxPR);
      if (Math.hypot(mx - pos.x, my - pos.y) < r) found = p.id;
    });
    selectedNode = found === selectedNode ? null : found;
    drawGraph(graphPR);
    if (selectedNode) showInspector(selectedNode);
    else document.getElementById('nodeInspector').style.display = 'none';
  });
}

function showInspector(id) {
  const page  = PAGES.find(p => p.id === id);
  const inLks = inboundLinks(id);
  const outLks = (LINK_GRAPH[id] || []).map(tid => {
    const p = PAGES.find(x => x.id === tid);
    return p ? `${p.mascotEmoji} ${p.title}` : tid;
  });

  document.getElementById('inspectorTitle').textContent = `${page.mascotEmoji} ${page.mascotName} — ${page.title}`;
  document.getElementById('inspectorBody').innerHTML = `
    <p><strong>PageRank:</strong> ${(graphPR[id] * 100).toFixed(2)}%</p>
    <p><strong>Inbound links (votes received):</strong> ${inLks.length > 0 ? inLks.join(', ') : 'none 😢 (no votes!)'}</p>
    <p><strong>Outbound links (votes cast):</strong> ${outLks.length > 0 ? outLks.join(', ') : 'none'}</p>
    <p style="margin-top:8px;font-size:0.78rem">
      PR formula contribution: <code style="font-size:0.78rem">PR(${page.title}) = (1−0.85)/6 + 0.85 × Σ[inbound PR / outbound count]</code>
    </p>`;
  document.getElementById('nodeInspector').style.display = 'block';
}

/* ════════════ DAMPING SLIDER ════════════ */

document.getElementById('dampSlider').addEventListener('input', function () {
  currentDamping = parseFloat(this.value);
  document.getElementById('dampVal').textContent = currentDamping.toFixed(2);
  graphPR = computePageRank(PAGES, LINK_GRAPH, currentDamping, 100);
  window.PAGE_RANKS = graphPR;
  iterState = { pr: null, step: -1 };
  document.getElementById('iterNum').textContent = '∞ (converged)';
  drawGraph(graphPR);
  buildDatasetTable();
});

/* ════════════ ITERATION CONTROLS ════════════ */

function iterReset() {
  const N = PAGES.length;
  graphPR = {};
  PAGES.forEach(p => graphPR[p.id] = 1 / N);
  iterState = { step: 0 };
  document.getElementById('iterNum').textContent = '0 (equal)';
  drawGraph(graphPR);
}

function iterStep() {
  const prev = { ...graphPR };
  const ids  = PAGES.map(p => p.id);
  const N    = ids.length;
  const d    = currentDamping;
  const inLinks = {};
  ids.forEach(id => inLinks[id] = []);
  ids.forEach(from => (LINK_GRAPH[from] || []).forEach(to => inLinks[to].push(from)));

  const next = {};
  ids.forEach(id => {
    let rank = (1 - d) / N;
    inLinks[id].forEach(inId => {
      rank += d * (prev[inId] / ((LINK_GRAPH[inId] || []).length || 1));
    });
    next[id] = rank;
  });
  graphPR = next;
  iterState.step = (iterState.step || 0) + 1;
  document.getElementById('iterNum').textContent = iterState.step;
  drawGraph(graphPR);
}

function iterConverge() {
  graphPR = computePageRank(PAGES, LINK_GRAPH, currentDamping, 100);
  iterState = { step: -1 };
  document.getElementById('iterNum').textContent = '∞ (converged)';
  drawGraph(graphPR);
}

/* ════════════ INIT ════════════ */

window.addEventListener('DOMContentLoaded', () => {
  graphPR = { ...PAGE_RANKS };
  buildDatasetTable();
  drawGraph(graphPR);
  setupGraphInteraction();

  window.addEventListener('resize', () => drawGraph(graphPR));
});
