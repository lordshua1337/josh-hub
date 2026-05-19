// ===== BITL (Bring It To Life) Progress Tracker =====
// Renders BITL status dashboard on projects page

function renderBITLTracker(containerId) {
  var container = document.getElementById(containerId);
  if (!container || !CC_STATE.bitl) return;

  var bitl = CC_STATE.bitl;
  var total = bitl.length;
  var complete = bitl.filter(function(p) { return p.status === 'complete'; }).length;
  var alive = bitl.filter(function(p) { return p.status === 'alive'; }).length;
  var scaffold = bitl.filter(function(p) { return p.status === 'scaffold'; }).length;
  var pct = Math.round((complete / total) * 100);
  var activePct = Math.round(((complete + alive) / total) * 100);

  var tierNames = { 0: 'Infrastructure', 1: 'Already Alive', 2: 'Need First Feature', 3: 'Need Core Pipeline' };
  var statusColors = { complete: 'var(--success)', alive: 'var(--accent)', scaffold: 'var(--text-tertiary)' };
  var statusLabels = { complete: 'BITL Complete', alive: 'Active', scaffold: 'Scaffold' };

  // Group by tier
  var tiers = {};
  bitl.forEach(function(p) {
    if (!tiers[p.tier]) tiers[p.tier] = [];
    tiers[p.tier].push(p);
  });

  var html = '';

  // Header with progress ring
  html += '<div class="bitl-header">';
  html += '  <div class="bitl-ring-wrap">';
  html += '    <svg class="bitl-ring" viewBox="0 0 80 80">';
  html += '      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" stroke-width="5"/>';
  html += '      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent)" stroke-width="5" ';
  html += '        stroke-dasharray="' + (2 * Math.PI * 34) + '" ';
  html += '        stroke-dashoffset="' + ((1 - activePct / 100) * 2 * Math.PI * 34) + '" ';
  html += '        stroke-linecap="round" transform="rotate(-90 40 40)" style="transition: stroke-dashoffset 1s ease"/>';
  html += '    </svg>';
  html += '    <span class="bitl-ring-num">' + activePct + '%</span>';
  html += '  </div>';
  html += '  <div class="bitl-header-text">';
  html += '    <h3 class="bitl-title">Bring It To Life</h3>';
  html += '    <p class="bitl-subtitle">' + complete + ' complete, ' + alive + ' active, ' + scaffold + ' scaffolds -- ' + total + ' total</p>';
  html += '  </div>';
  html += '</div>';

  // Status bar
  html += '<div class="bitl-bar">';
  if (complete > 0) html += '<div class="bitl-bar-seg bitl-bar-complete" style="width:' + (complete / total * 100) + '%"></div>';
  if (alive > 0) html += '<div class="bitl-bar-seg bitl-bar-alive" style="width:' + (alive / total * 100) + '%"></div>';
  if (scaffold > 0) html += '<div class="bitl-bar-seg bitl-bar-scaffold" style="width:' + (scaffold / total * 100) + '%"></div>';
  html += '</div>';

  // Legend
  html += '<div class="bitl-legend">';
  html += '  <span class="bitl-legend-item"><span class="bitl-dot bitl-dot-complete"></span>Complete (' + complete + ')</span>';
  html += '  <span class="bitl-legend-item"><span class="bitl-dot bitl-dot-alive"></span>Active (' + alive + ')</span>';
  html += '  <span class="bitl-legend-item"><span class="bitl-dot bitl-dot-scaffold"></span>Scaffold (' + scaffold + ')</span>';
  html += '</div>';

  // Project list grouped by tier
  var tierOrder = [1, 2, 3, 0];
  tierOrder.forEach(function(tierNum) {
    var projects = tiers[tierNum];
    if (!projects) return;

    html += '<div class="bitl-tier">';
    html += '  <div class="bitl-tier-header">';
    html += '    <span class="bitl-tier-label">Tier ' + tierNum + '</span>';
    html += '    <span class="bitl-tier-name">' + tierNames[tierNum] + '</span>';
    html += '  </div>';

    projects.forEach(function(p) {
      var repo = CC_STATE.repos.find(function(r) { return r.name === p.name; });
      var liveUrl = repo && repo.live ? repo.live : null;

      html += '<div class="bitl-project">';
      html += '  <div class="bitl-project-status" style="background:' + statusColors[p.status] + '"></div>';
      html += '  <div class="bitl-project-info">';
      html += '    <div class="bitl-project-name">' + p.name + '</div>';
      html += '    <div class="bitl-project-soul">"' + p.soul + '"</div>';
      if (p.missing) {
        html += '  <div class="bitl-project-missing">Missing: ' + p.missing + '</div>';
      } else {
        html += '  <div class="bitl-project-done">BITL treatment complete</div>';
      }
      html += '  </div>';
      if (liveUrl) {
        html += '  <a href="' + liveUrl + '" target="_blank" rel="noopener" class="bitl-project-link" title="Open live">';
        html += '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        html += '  </a>';
      }
      html += '</div>';
    });

    html += '</div>';
  });

  container.innerHTML = html;
}
