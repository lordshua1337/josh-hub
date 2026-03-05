// Project Switcher -- Universal dropdown for navigating between live projects.
// Drop-in script: adds hover dropdown to top-left logo area.
// Temporary dev tool. Remove script tag to fully remove.

(function() {
  'use strict';

  var PROJECTS = [
    { name: 'josh-hub', url: 'https://lordshua1337.github.io/josh-hub/' },
    { name: 'ctax-partner-site', url: 'https://lordshua1337.github.io/ctax-partner-site/' },
    { name: 'doodleforge', url: 'https://doodleforge.vercel.app' },
    { name: 'the-well', url: 'https://the-well-eight.vercel.app' },
    { name: 'uncommon-cents', url: 'https://uncommon-cents.vercel.app' },
    { name: 'stock-pilot', url: 'https://stock-pilot-puce.vercel.app' },
    { name: 'cash-cow', url: 'https://lordshua1337.github.io/cash-cow/' },
    { name: 'ad-intelligence', url: 'https://ad-intelligence-one.vercel.app' },
    { name: 'pipeline-simulator', url: 'https://pipeline-simulator-woad.vercel.app' },
    { name: 'image-forge', url: 'https://image-forge-mauve.vercel.app' },
    { name: 'oculus', url: 'https://occulus.vercel.app' },
    { name: 'marcom-engine', url: 'https://lordshua1337.github.io/marcom-engine/' },
    { name: 'partner-portal-templates', url: 'https://partner-portal-templates-lordshua1337-lordshua1337s-projects.vercel.app' }
  ];

  // Detect current project from hostname
  var currentHost = window.location.hostname;
  var currentPath = window.location.pathname;
  var currentProject = null;

  PROJECTS.forEach(function(p) {
    try {
      var u = new URL(p.url);
      if (u.hostname === currentHost) {
        // For GitHub Pages subpaths, also check pathname prefix
        if (u.pathname.length > 1 && currentPath.indexOf(u.pathname.replace(/\/$/, '')) === 0) {
          currentProject = p.name;
        } else if (u.pathname.length <= 1) {
          currentProject = p.name;
        }
      }
    } catch (e) {}
  });

  // Find logo target
  function findLogoTarget() {
    var selectors = [
      '[data-project-switcher]',
      '.navbar-brand',
      '.logo',
      '.nav-logo',
      'header a:first-child',
      'nav a:first-child'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    // Fallback: first link in header or nav
    var header = document.querySelector('header') || document.querySelector('nav');
    if (header) {
      var firstLink = header.querySelector('a');
      if (firstLink) return firstLink;
    }
    return null;
  }

  function init() {
    var target = findLogoTarget();
    if (!target) return;

    // Inject CSS
    var style = document.createElement('style');
    style.textContent = [
      '.ps-wrap{position:relative;display:inline-block}',
      '.ps-dropdown{display:none;position:absolute;top:100%;left:0;z-index:99999;',
      'background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;',
      'min-width:220px;padding:4px 0;margin-top:4px;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
      'box-shadow:0 1px 3px rgba(0,0,0,0.08);opacity:0;transition:opacity 0.15s}',
      '.ps-wrap:hover .ps-dropdown,.ps-dropdown.ps-visible{display:block;opacity:1}',
      '.ps-item{display:block;padding:7px 14px;font-size:13px;color:#374151;',
      'text-decoration:none;cursor:pointer;border:none;background:none;width:100%;text-align:left}',
      '.ps-item:hover{background:#f0f0f0;color:#111}',
      '.ps-item-current{color:#9ca3af;cursor:default;font-style:italic}',
      '.ps-item-current:hover{background:transparent;color:#9ca3af}',
      '.ps-label{padding:6px 14px 4px;font-size:10px;font-weight:700;letter-spacing:0.08em;',
      'text-transform:uppercase;color:#9ca3af;pointer-events:none}'
    ].join('\n');
    document.head.appendChild(style);

    // Wrap logo in container
    var wrapper = document.createElement('div');
    wrapper.className = 'ps-wrap';
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);

    // Build dropdown
    var dropdown = document.createElement('div');
    dropdown.className = 'ps-dropdown';

    var label = document.createElement('div');
    label.className = 'ps-label';
    label.textContent = 'Switch Project';
    dropdown.appendChild(label);

    PROJECTS.forEach(function(p) {
      var isCurrent = p.name === currentProject;
      var item = document.createElement('a');
      item.className = 'ps-item' + (isCurrent ? ' ps-item-current' : '');
      item.textContent = p.name;
      if (!isCurrent) {
        item.href = p.url;
      }
      dropdown.appendChild(item);
    });

    wrapper.appendChild(dropdown);

    // Delayed hide to prevent flicker on diagonal mouse movement
    var hideTimer = null;
    wrapper.addEventListener('mouseenter', function() {
      clearTimeout(hideTimer);
      dropdown.classList.add('ps-visible');
    });
    wrapper.addEventListener('mouseleave', function() {
      hideTimer = setTimeout(function() {
        dropdown.classList.remove('ps-visible');
      }, 120);
    });

    // Escape key closes dropdown
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.classList.remove('ps-visible');
      }
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
