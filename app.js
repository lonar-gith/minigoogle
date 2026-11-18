/* =============================================
   MINIGOOGLE — APP LOGIC
   ============================================= */

/* ---- Search ---- */
function runSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const oldRanked = computeOldRanking(PAGES, query);
  const newRanked = computePageRankRanking(PAGES, query);

  document.getElementById('landingSection').style.display  = 'none';
  document.getElementById('resultsSection').style.display = 'block';

  renderOld(oldRanked, newRanked);
  renderNew(newRanked, oldRanked);
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

function setSearch(term) {
  document.getElementById('searchInput').value = term;
  runSearch();
}

/* ---- Render OLD results ---- */
function renderOld(oldRanked, newRanked) {
  const container = document.getElementById('oldResults');
  const maxScore  = Math.max(...oldRanked.map(p => p.score), 1);
  container.innerHTML = '';

  oldRanked.forEach((page, i) => {
    const newPos = newRanked.findIndex(p => p.id === page.id);
    const diff   = newPos - i;    // positive = dropped in PageRank, negative = rose

    let moveHtml = '';
    if (diff < 0) {
      moveHtml = `<span class="rank-moved moved-up">▲ Rises ${Math.abs(diff)} in PageRank</span>`;
    } else if (diff > 0) {
      moveHtml = `<span class="rank-moved moved-down">▼ Drops ${diff} in PageRank</span>`;
    } else {
      moveHtml = `<span class="rank-moved moved-same">Same position in PageRank</span>`;
    }

    const pct = maxScore > 0 ? (page.score / maxScore * 100).toFixed(1) : 0;

    container.innerHTML += `
      <div class="result-card old-card-result" onclick="window.open('${page.url}','_blank')">
        <div class="rank-badge">#${i + 1}</div>
        <div class="card-rank-label">Rank #${i + 1} — Old Way</div>
        <div class="card-title">${page.title}</div>
        <div class="card-url">${page.url}</div>
        <div class="card-desc">${page.desc}</div>
        <div class="score-bar-wrap">
          <div class="score-label">
            <span>Keyword Score</span>
            <span>${page.score} pts</span>
          </div>
          <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
        </div>
        ${moveHtml}
      </div>`;
  });
}

/* ---- Render NEW (PageRank) results ---- */
function renderNew(newRanked, oldRanked) {
  const container = document.getElementById('newResults');
  const maxScore  = Math.max(...newRanked.map(p => p.score), 0.001);
  const maxPR     = Math.max(...newRanked.map(p => p.pageRank), 0.001);
  container.innerHTML = '';

  newRanked.forEach((page, i) => {
    const oldPos = oldRanked.findIndex(p => p.id === page.id);
    const diff   = oldPos - i;   // positive = was lower in old ranking

    let moveHtml = '';
    if (diff > 0) {
      moveHtml = `<span class="rank-moved moved-up">▲ Up ${diff} from Old Ranking</span>`;
    } else if (diff < 0) {
      moveHtml = `<span class="rank-moved moved-down">▼ Down ${Math.abs(diff)} from Old Ranking</span>`;
    } else {
      moveHtml = `<span class="rank-moved moved-same">Same as Old Ranking</span>`;
    }

    const pct   = (page.score / maxScore * 100).toFixed(1);
    const prPct = (page.pageRank / maxPR * 100).toFixed(1);
    const inLinks = Object.entries(LINK_GRAPH).filter(([, tos]) => tos.includes(page.id)).length;

    container.innerHTML += `
      <div class="result-card new-card-result" onclick="window.open('${page.url}','_blank')">
        <div class="rank-badge">#${i + 1}</div>
        <div class="card-rank-label">Rank #${i + 1} — PageRank</div>
        <div class="card-title">${page.title}</div>
        <div class="card-url">${page.url}</div>
        <div class="card-desc">${page.desc}</div>
        <div class="score-bar-wrap">
          <div class="score-label">
            <span>Combined Score</span>
            <span>${page.score.toFixed(4)}</span>
          </div>
          <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="score-bar-wrap" style="margin-top:6px">
          <div class="score-label">
            <span>PageRank (${inLinks} inbound link${inLinks !== 1 ? 's' : ''})</span>
            <span>${page.pageRank.toFixed(4)}</span>
          </div>
          <div class="score-bar"><div class="score-fill" style="width:${prPct}%"></div></div>
        </div>
        ${moveHtml}
      </div>`;
  });
}

/* ---- Link Graph Canvas ---- */
function drawGraph(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  canvas.width  = width;
  canvas.height = height;

  const pageIds = PAGES.map(p => p.id);
  const N = pageIds.length;
  const cx = width / 2, cy = height / 2;
  const r  = Math.min(width, height) * 0.36;

  // Node positions (circle layout)
  const pos = {};
  pageIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2;
    pos[id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  ctx.clearRect(0, 0, width, height);

  // Draw edges
  pageIds.forEach(from => {
    (LINK_GRAPH[from] || []).forEach(to => {
      const a = pos[from], b = pos[to];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const ux = dx/dist, uy = dy/dist;
      const nodeR = 22;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(129,140,248,0.4)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(a.x + ux*nodeR, a.y + uy*nodeR);
      ctx.lineTo(b.x - ux*nodeR, b.y - uy*nodeR);
      ctx.stroke();

      // Arrowhead
      const ex = b.x - ux*(nodeR+1), ey = b.y - uy*(nodeR+1);
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(129,140,248,0.7)';
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10*Math.cos(angle-0.4), ey - 10*Math.sin(angle-0.4));
      ctx.lineTo(ex - 10*Math.cos(angle+0.4), ey - 10*Math.sin(angle+0.4));
      ctx.closePath();
      ctx.fill();
    });
  });

  // Draw nodes
  const shortNames = {
    'pizza-pizza-pizza':   'PizzaPizza\nPizza',
    'cheap-eats-pune':     'Cheap Eats\nPune',
    'pizza-recipes-home':  'Pizza\nRecipes',
    'pune-food-guide':     'Pune Food\nGuide',
    'best-pizza-pune':     'Best Pizza\nPune',
    'college-canteen-blog':'College\nCanteen',
  };

  const prValues = PAGE_RANKS;
  const maxPR = Math.max(...Object.values(prValues));

  pageIds.forEach(id => {
    const { x, y } = pos[id];
    const relSize = 16 + 10 * (prValues[id] / maxPR);

    // Node circle
    const grad = ctx.createRadialGradient(x, y, 0, x, y, relSize);
    grad.addColorStop(0, 'rgba(34,211,238,0.9)');
    grad.addColorStop(1, 'rgba(99,102,241,0.6)');
    ctx.beginPath();
    ctx.arc(x, y, relSize, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${width > 500 ? 10 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = (shortNames[id] || id).split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + (li - (lines.length-1)/2) * 12);
    });

    // PR value below node
    ctx.fillStyle = 'rgba(34,211,238,0.8)';
    ctx.font = `${width > 500 ? 9 : 8}px sans-serif`;
    ctx.fillText(`PR: ${prValues[id].toFixed(3)}`, x, y + relSize + 10);
  });
}

// Landing page mini graph
window.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('graphCanvas');
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  drawGraph(canvas, wrap.clientWidth || 700, 220);
  window.addEventListener('resize', () => {
    drawGraph(canvas, wrap.clientWidth || 700, 220);
  });
});

// Modal full graph
function showGraph() {
  document.getElementById('graphModal').style.display = 'flex';
  const c = document.getElementById('graphModalCanvas');
  drawGraph(c, 700, 460);
}
function closeModal() {
  document.getElementById('graphModal').style.display = 'none';
}
