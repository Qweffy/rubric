/* @ds-bundle: {"format":3,"namespace":"HiringRadarDesignSystem_e283cd","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"ICON_PATHS","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"SectionLabel","sourcePath":"components/core/SectionLabel.jsx"},{"name":"Spinner","sourcePath":"components/core/Spinner.jsx"},{"name":"JobRow","sourcePath":"components/data/JobRow.jsx"},{"name":"MatchBadge","sourcePath":"components/data/MatchBadge.jsx"},{"name":"ScoreGauge","sourcePath":"components/data/ScoreGauge.jsx"},{"name":"Scorecard","sourcePath":"components/data/Scorecard.jsx"},{"name":"Sparkline","sourcePath":"components/data/Sparkline.jsx"},{"name":"StatusBadge","sourcePath":"components/data/StatusBadge.jsx"},{"name":"Tag","sourcePath":"components/data/Tag.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"HRIllustration","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ErrorState","sourcePath":"components/feedback/ErrorState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RangeSlider","sourcePath":"components/forms/RangeSlider.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Toggle","sourcePath":"components/forms/Toggle.jsx"},{"name":"ProgressLine","sourcePath":"components/navigation/ProgressLine.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"CommandPalette","sourcePath":"components/overlay/CommandPalette.jsx"},{"name":"ConfirmModal","sourcePath":"components/overlay/ConfirmModal.jsx"},{"name":"Drawer","sourcePath":"components/overlay/Drawer.jsx"},{"name":"Menu","sourcePath":"components/overlay/Menu.jsx"},{"name":"Modal","sourcePath":"components/overlay/Modal.jsx"}],"sourceHashes":{"assets/lucide-icons.js":"0e4575e7258a","components/core/Button.jsx":"3e6902b83845","components/core/Card.jsx":"a546989ad844","components/core/Icon.jsx":"a669ce19f3dd","components/core/IconButton.jsx":"d89fa7fa007c","components/core/Kbd.jsx":"016b7ede5f50","components/core/SectionLabel.jsx":"49a6dd9af622","components/core/Spinner.jsx":"cb34ec80409d","components/data/JobRow.jsx":"73d507539ad0","components/data/MatchBadge.jsx":"a714530eab5c","components/data/ScoreGauge.jsx":"95f1de4a835f","components/data/Scorecard.jsx":"fbdae7698be9","components/data/Sparkline.jsx":"57e2b3e2d2d7","components/data/StatusBadge.jsx":"f1a58469eb31","components/data/Tag.jsx":"611764c6cb3e","components/feedback/Banner.jsx":"f29a4ec6e30e","components/feedback/EmptyState.jsx":"03e607e18128","components/feedback/ErrorState.jsx":"fb89f0064700","components/feedback/Skeleton.jsx":"35979f36a8fa","components/feedback/Toast.jsx":"2ef5c5ad9697","components/feedback/Tooltip.jsx":"7af426f922f0","components/forms/Input.jsx":"2361ad6331c4","components/forms/RangeSlider.jsx":"c181acebffd7","components/forms/SearchInput.jsx":"203b3ba4929c","components/forms/Select.jsx":"a78aaa6e0b6c","components/forms/Toggle.jsx":"6b51fb2756d9","components/navigation/ProgressLine.jsx":"056583acf8b2","components/navigation/SegmentedControl.jsx":"1b72788fb76a","components/navigation/Tabs.jsx":"7bcd0debffbd","components/overlay/CommandPalette.jsx":"292685f0bd1d","components/overlay/ConfirmModal.jsx":"e41d4dcc2adf","components/overlay/Drawer.jsx":"c10f8f020413","components/overlay/Menu.jsx":"cf3a4293b6c2","components/overlay/Modal.jsx":"4834ffdc030f","styleguide.jsx":"2c3b1cb8aa96","ui_kits/hiring-radar/MissionControl.jsx":"5b8e191b8d77","ui_kits/hiring-radar/RadarScope.jsx":"680b3b6d94a5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HiringRadarDesignSystem_e283cd = window.HiringRadarDesignSystem_e283cd || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/lucide-icons.js
try { (() => {
/* ============================================================
   HIRING RADAR — ICON SET
   Lucide-style stroke icons (MIT). 24x24 viewBox, 1.5px stroke,
   currentColor, never filled, never emoji.
   Exposes window.HR_ICONS (name -> inner SVG) and window.hrIcon().
   ============================================================ */
(function () {
  var HR_ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    retry: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    kebab: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    command: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
    'map-pin': '<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    signal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    check_circle: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    'sliders': '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>'
  };
  function hrIcon(name, size, stroke) {
    size = size || 20;
    stroke = stroke || 1.5;
    var inner = HR_ICONS[name] || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  if (typeof window !== 'undefined') {
    window.HR_ICONS = HR_ICONS;
    window.hrIcon = hrIcon;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      HR_ICONS: HR_ICONS,
      hrIcon: hrIcon
    };
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/lucide-icons.js", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — base surface/panel. variant: raised (default) | glass | flush.
 * Optional header (label + actions) and padding control.
 */
function Card({
  variant = 'raised',
  header,
  actions,
  children,
  glow = false,
  padding = true,
  style,
  ...rest
}) {
  const surfaces = {
    raised: {
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      backdropFilter: 'none'
    },
    glass: {
      background: 'var(--glass)',
      border: '1px solid var(--border)',
      backdropFilter: 'blur(var(--blur-glass))',
      WebkitBackdropFilter: 'blur(var(--blur-glass))'
    },
    flush: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      backdropFilter: 'none'
    }
  };
  const s = surfaces[variant] || surfaces.raised;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 'var(--radius-card)',
      boxShadow: glow ? 'var(--glow-phosphor-sm), var(--shadow-card)' : 'var(--shadow-card)',
      overflow: 'hidden',
      ...s,
      ...style
    }
  }, rest), header && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '11px 16px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--label-mono)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-label)'
    }
  }, header), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padding ? 'var(--pad-panel)' : 0,
      flex: 1
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide-style stroke paths (MIT). 24x24 viewBox, currentColor, never filled.
const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  retry: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  kebab: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  command: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  'map-pin': '<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  signal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
};

/**
 * Icon — single Lucide-style stroke glyph. currentColor, never filled.
 */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  style,
  className,
  ...rest
}) {
  const inner = ICON_PATHS[name] || '';
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className: className,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: inner
    }
  }, rest));
}
Object.assign(__ds_scope, { ICON_PATHS, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Kbd — a single keycap, mono. Combine for chords: <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
function Kbd({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("kbd", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
      height: 20,
      padding: '0 6px',
      font: '600 11px/1 var(--font-mono)',
      color: 'var(--text-mid)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SectionLabel — uppercase 11px mono terminal label for chrome headers.
 * e.g. "SIGNAL FEED", "LAST SWEEP 06:00 UTC".
 */
function SectionLabel({
  children,
  icon,
  tone = 'low',
  style,
  ...rest
}) {
  const colors = {
    low: 'var(--text-label)',
    phosphor: 'var(--phosphor)',
    violet: 'var(--violet)',
    amber: 'var(--amber)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--label-mono)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: colors[tone] || colors.low,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13,
    strokeWidth: 1.75
  }), children);
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/core/Spinner.jsx
try { (() => {
/** Inline phosphor spinner — degrades to a static ring under reduced-motion via CSS. */
function Spinner({
  size = 16,
  color = 'currentColor',
  style
}) {
  const s = size;
  return /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    style: {
      display: 'block',
      animation: 'hr-spin 0.7s linear infinite',
      ...style
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9",
    stroke: color,
    strokeOpacity: "0.22",
    strokeWidth: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 0 0-9-9",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("style", null, `@keyframes hr-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){svg[style*="hr-spin"]{animation:none!important}}`));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 'var(--control-h-sm)',
    padding: '0 12px',
    font: 'var(--text-xs)',
    gap: 6,
    icon: 16
  },
  md: {
    height: 'var(--control-h)',
    padding: '0 14px',
    font: '500 14px/1 var(--font-ui)',
    gap: 8,
    icon: 16
  },
  lg: {
    height: 'var(--control-h-lg)',
    padding: '0 20px',
    font: '500 15px/1 var(--font-ui)',
    gap: 8,
    icon: 20
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--phosphor)',
    color: '#04130C',
    border: '1px solid transparent',
    boxShadow: 'var(--glow-phosphor)',
    fontWeight: 600,
    hoverBg: '#5affb4',
    activeBg: '#2fe592'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-hi)',
    border: '1px solid var(--border-strong)',
    hoverBg: 'var(--phosphor-08)',
    activeBg: 'var(--phosphor-12)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    border: '1px solid transparent',
    hoverBg: 'rgba(147,164,179,0.08)',
    activeBg: 'rgba(147,164,179,0.14)'
  },
  destructive: {
    background: 'transparent',
    color: 'var(--red)',
    border: '1px solid rgba(255,93,93,0.42)',
    hoverBg: 'var(--red-14)',
    activeBg: 'rgba(255,93,93,0.22)'
  }
};

/**
 * Button — primary action control. Phosphor primary glows; others are outline/ghost.
 */
function Button({
  variant = 'secondary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  children,
  style,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const sz = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const isDisabled = disabled || loading;
  const bg = isDisabled ? undefined : active ? v.activeBg : hover ? v.hoverBg : v.background;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: isDisabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    "aria-busy": loading || undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sz.gap,
      height: sz.height,
      padding: sz.padding,
      font: sz.font,
      fontWeight: v.fontWeight || 500,
      color: v.color,
      background: bg ?? v.background,
      border: v.border,
      borderRadius: 'var(--radius-control)',
      letterSpacing: '0.005em',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.4 : 1,
      boxShadow: variant === 'primary' && !isDisabled ? hover ? '0 0 28px rgba(61,255,162,0.38)' : v.boxShadow : 'none',
      transition: 'background var(--dur-fast) var(--ease-out), box-shadow var(--dur) var(--ease-out), opacity var(--dur-fast)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: sz.icon,
    color: variant === 'primary' ? '#04130C' : 'currentColor'
  }), !loading && iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: sz.icon
  }), children, !loading && iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: sz.icon
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    box: 30,
    icon: 16
  },
  md: {
    box: 36,
    icon: 18
  },
  lg: {
    box: 44,
    icon: 20
  }
};

/**
 * IconButton — square, icon-only control. Always pass `label` for a11y.
 */
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  active = false,
  style,
  onClick,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sz = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;
  const tones = {
    ghost: {
      color: active ? 'var(--phosphor)' : 'var(--text-body)',
      hoverBg: 'rgba(147,164,179,0.08)'
    },
    solid: {
      color: '#04130C',
      hoverBg: '#5affb4'
    },
    danger: {
      color: 'var(--red)',
      hoverBg: 'var(--red-14)'
    }
  };
  const t = tones[variant] || tones.ghost;
  const base = variant === 'solid' ? 'var(--phosphor)' : active ? 'var(--phosphor-12)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    "aria-pressed": active || undefined,
    disabled: isDisabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: label,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: sz.box,
      height: sz.box,
      padding: 0,
      color: t.color,
      background: isDisabled ? 'transparent' : hover ? t.hoverBg : base,
      border: variant === 'solid' ? '1px solid transparent' : `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
      borderRadius: 'var(--radius-control)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.4 : 1,
      boxShadow: variant === 'solid' && !isDisabled ? 'var(--glow-phosphor)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast)',
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: sz.icon,
    color: variant === 'solid' ? '#04130C' : 'currentColor'
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: sz.icon
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/MatchBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LEVELS = {
  HIGH: {
    op: 1,
    label: 'HIGH'
  },
  MED: {
    op: 0.6,
    label: 'MED'
  },
  LOW: {
    op: 0.35,
    label: 'LOW'
  }
};

/**
 * MatchBadge — AI match-strength pill in violet. Used in narrow layouts where the
 * radial ScoreGauge doesn't fit. Opacity encodes strength: HIGH 100% / MED 60% / LOW 35%.
 */
function MatchBadge({
  level = 'MED',
  score,
  style,
  ...rest
}) {
  const key = String(level).toUpperCase();
  const l = LEVELS[key] || LEVELS.MED;
  const color = `rgba(167,139,250,${l.op})`;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 20,
      padding: '0 7px',
      font: '600 10px/1 var(--font-mono)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: color,
      background: `rgba(167,139,250,${l.op * 0.14})`,
      border: `1px solid rgba(167,139,250,${l.op * 0.5})`,
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: color,
      flexShrink: 0
    }
  }), l.label, score != null && /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.85
    }
  }, score));
}
Object.assign(__ds_scope, { MatchBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MatchBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/ScoreGauge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScoreGauge — radial match-score gauge 0-100 in violet, number in mono.
 * Animates the arc + counts up on mount (degrades to static under reduced-motion).
 */
function ScoreGauge({
  score = 0,
  size = 64,
  label,
  style,
  ...rest
}) {
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = React.useState(reduce ? score : 0);
  React.useEffect(() => {
    if (reduce) {
      setShown(score);
      return;
    }
    let raf, start;
    const dur = 600;
    const step = t => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const stroke = Math.max(4, size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, shown)) / 100;
  const numFont = size >= 56 ? 'var(--mono-lg)' : '600 13px/1 var(--font-mono)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(167,139,250,0.16)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--violet)",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - pct),
    style: {
      filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.45))',
      transition: reduce ? 'none' : 'stroke-dashoffset 80ms linear'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: numFont,
      color: 'var(--text-hi)'
    }
  }, shown)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--label-mono)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-label)'
    }
  }, label));
}
Object.assign(__ds_scope, { ScoreGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScoreGauge.jsx", error: String((e && e.message) || e) }); }

// components/data/Sparkline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Sparkline — tiny inline trend line. data: number[]. Phosphor by default. */
function Sparkline({
  data = [],
  width = 72,
  height = 22,
  tone = 'phosphor',
  style,
  ...rest
}) {
  const color = tone === 'violet' ? 'var(--violet)' : tone === 'cyan' ? 'var(--cyan)' : 'var(--phosphor)';
  if (!data.length) return /*#__PURE__*/React.createElement("svg", _extends({
    width: width,
    height: height,
    style: style
  }, rest));
  const min = Math.min(...data),
    max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = i / (data.length - 1) * (width - 2) + 1;
    const y = height - 2 - (v - min) / span * (height - 4);
    return [x, y];
  });
  const d = pts.map((p, i) => i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`).join(' ');
  const area = `${d} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  const id = React.useId().replace(/:/g, '');
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: width,
    height: height,
    style: {
      display: 'block',
      overflow: 'visible',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: `sg-${id}`,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#sg-${id})`
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: pts[pts.length - 1][0],
    cy: pts[pts.length - 1][1],
    r: "1.8",
    fill: color
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/data/Scorecard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Scorecard — a metric tile: uppercase label, big mono number (counts up on mount),
 * optional delta and sparkline. The atom of the mission-control dashboard.
 */
function Scorecard({
  label,
  value = 0,
  suffix = '',
  delta,
  spark,
  tone = 'phosphor',
  style,
  ...rest
}) {
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = React.useState(reduce ? value : 0);
  React.useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    let raf, start;
    const dur = 600;
    const step = t => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const accent = tone === 'violet' ? 'var(--violet)' : tone === 'cyan' ? 'var(--cyan)' : 'var(--text-hi)';
  const deltaUp = delta != null && delta >= 0;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 'var(--pad-card)',
      minWidth: 150,
      background: 'var(--bg-raised)',
      border: 'var(--border-1)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--label-mono)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-label)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-xl)',
      color: accent,
      letterSpacing: '-0.01em'
    }
  }, shown.toLocaleString()), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-base)',
      color: 'var(--text-low-content)'
    }
  }, suffix)), spark && /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: spark,
    tone: tone === 'text-hi' ? 'phosphor' : tone
  })), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: deltaUp ? 'var(--phosphor)' : 'var(--red)'
    }
  }, deltaUp ? '+' : '', delta, typeof delta === 'number' ? '' : '', " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-low-content)'
    }
  }, "vs last sweep")));
}
Object.assign(__ds_scope, { Scorecard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Scorecard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Status -> { color, dot, fill }. Covers posting attributes, process states, triggers.
const STATUS = {
  // posting attributes
  NEW: {
    c: 'var(--phosphor)',
    f: 'var(--phosphor-12)',
    b: 'var(--border-strong)',
    dot: true
  },
  REMOTE: {
    c: 'var(--cyan)',
    f: 'var(--cyan-12)',
    b: 'rgba(76,201,240,0.35)'
  },
  ONSITE: {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  },
  HYBRID: {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  },
  VISA: {
    c: 'var(--violet)',
    f: 'var(--violet-12)',
    b: 'rgba(167,139,250,0.40)'
  },
  // process states
  RUNNING: {
    c: 'var(--phosphor)',
    f: 'var(--phosphor-12)',
    b: 'var(--border-strong)',
    pulse: true
  },
  COMPLETED: {
    c: 'var(--phosphor)',
    f: 'var(--phosphor-08)',
    b: 'var(--border)'
  },
  FAILED: {
    c: 'var(--red)',
    f: 'var(--red-14)',
    b: 'rgba(255,93,93,0.42)'
  },
  PARTIAL: {
    c: 'var(--amber)',
    f: 'var(--amber-14)',
    b: 'rgba(255,200,87,0.38)'
  },
  RESUMED: {
    c: 'var(--cyan)',
    f: 'var(--cyan-12)',
    b: 'rgba(76,201,240,0.35)'
  },
  CANCELLED: {
    c: 'var(--text-low-content)',
    f: 'transparent',
    b: 'var(--border)'
  },
  // triggers
  CRON: {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  },
  MANUAL: {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  },
  BACKFILL: {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  }
};

/**
 * StatusBadge — mono uppercase pill (sharp corners) for posting attributes,
 * process states, and run triggers. Status string drives color + optional dot/pulse.
 */
function StatusBadge({
  status,
  label,
  style,
  ...rest
}) {
  const key = String(status).toUpperCase();
  const s = STATUS[key] || {
    c: 'var(--text-mid)',
    f: 'transparent',
    b: 'var(--border)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 20,
      padding: '0 7px',
      font: '600 10px/1 var(--font-mono)',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: s.c,
      background: s.f,
      border: `1px solid ${s.b}`,
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), (s.dot || s.pulse) && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 6,
      height: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: s.c
    }
  }), s.pulse && /*#__PURE__*/React.createElement("span", {
    className: "hr-pulse",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: s.c
    }
  })), label || key, /*#__PURE__*/React.createElement("style", null, `@keyframes hr-ping{0%{transform:scale(1);opacity:.7}80%,100%{transform:scale(2.6);opacity:0}}
        .hr-pulse{animation:hr-ping 1.8s var(--ease-out) infinite}
        @media (prefers-reduced-motion: reduce){.hr-pulse{animation:none}}`));
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    color: 'var(--text-mid)',
    border: 'var(--border)',
    bg: 'transparent'
  },
  phosphor: {
    color: 'var(--phosphor)',
    border: 'var(--border-strong)',
    bg: 'var(--phosphor-08)'
  },
  cyan: {
    color: 'var(--cyan)',
    border: 'rgba(76,201,240,0.35)',
    bg: 'var(--cyan-12)'
  },
  violet: {
    color: 'var(--violet)',
    border: 'rgba(167,139,250,0.40)',
    bg: 'var(--violet-12)'
  },
  amber: {
    color: 'var(--amber)',
    border: 'rgba(255,200,87,0.38)',
    bg: 'var(--amber-14)'
  }
};

/**
 * Tag — mono outline chip for stack tags and removable filter chips.
 * Numeric/code content stays mono (it always is here).
 */
function Tag({
  children,
  tone = 'neutral',
  icon,
  onRemove,
  selected = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: '0 8px',
      font: 'var(--mono-sm)',
      color: t.color,
      background: selected ? t.bg : tone === 'neutral' ? 'transparent' : t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-sm)',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13,
    strokeWidth: 1.75
  }), children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      display: 'inline-flex',
      marginRight: -3,
      padding: 1,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'inherit',
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 12,
    strokeWidth: 2
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/JobRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * JobRow — one HN "Who is hiring" posting as a table row: company, role,
 * salary (mono), location, stack tags, status badges, and a match gauge.
 * States: default, hover (border glows), selected, and stale (amber dot).
 */
function JobRow({
  company,
  role,
  salary,
  location,
  tags = [],
  badges = [],
  score,
  selected = false,
  stale = false,
  bookmarked = false,
  onSelect,
  onBookmark,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const active = selected || hover;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onSelect,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      alignItems: 'center',
      gap: 16,
      padding: '12px 14px',
      background: selected ? 'var(--phosphor-08)' : 'var(--bg-raised)',
      border: `1px solid ${selected ? 'var(--border-strong)' : active ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-card)',
      boxShadow: active ? 'var(--glow-phosphor-sm)' : 'none',
      cursor: 'pointer',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur), background var(--dur-fast)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, stale && /*#__PURE__*/React.createElement("span", {
    title: "Edited since last sweep",
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'var(--amber)',
      boxShadow: '0 0 8px rgba(255,200,87,0.6)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-hi)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, company), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-low)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-base)',
      color: 'var(--text-body)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, role)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, salary && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-base)',
      color: 'var(--phosphor)'
    }
  }, salary), location && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, location), badges.map(b => /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    key: b,
    status: b
  })), tags.slice(0, 4).map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t)), tags.length > 4 && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, "+", tags.length - 4))), score != null && /*#__PURE__*/React.createElement(__ds_scope.ScoreGauge, {
    score: score,
    size: 48
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "bookmark",
    label: bookmarked ? 'Saved' : 'Save',
    active: bookmarked,
    onClick: onBookmark,
    size: "sm"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "kebab",
    label: "More",
    size: "sm"
  })));
}
Object.assign(__ds_scope, { JobRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/JobRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  amber: {
    c: 'var(--amber)',
    bg: 'var(--amber-14)',
    b: 'rgba(255,200,87,0.30)',
    icon: 'alert-triangle'
  },
  violet: {
    c: 'var(--violet)',
    bg: 'var(--violet-12)',
    b: 'rgba(167,139,250,0.30)',
    icon: 'bot'
  },
  red: {
    c: 'var(--red)',
    bg: 'var(--red-14)',
    b: 'rgba(255,93,93,0.30)',
    icon: 'x-circle'
  }
};

/**
 * Banner — full-width strip under the topbar. Tones: amber (warning/stale),
 * violet (AI degraded), red (failure). Optional action slot.
 */
function Banner({
  tone = 'amber',
  children,
  action,
  onAction,
  actionLabel,
  onClose,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.amber;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "alert",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '10px 16px',
      background: t.bg,
      borderTop: `1px solid ${t.b}`,
      borderBottom: `1px solid ${t.b}`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 16,
    style: {
      color: t.c,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--text-sm)',
      color: 'var(--text-hi)'
    }
  }, children), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'none',
      border: `1px solid ${t.b}`,
      borderRadius: 'var(--radius-sm)',
      padding: '5px 10px',
      cursor: 'pointer',
      font: '600 12px/1 var(--font-ui)',
      color: t.c
    }
  }, actionLabel || 'Resolve'), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      padding: 2,
      cursor: 'pointer',
      color: t.c,
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 15
  })));
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================================
   Canonical illustration pack — the ONLY illustrations allowed in Hiring Radar.
   Artwork is embedded inline (byte-identical to assets/illustrations/<name>.svg)
   so the bundle is self-contained and path-independent. To change a drawing,
   edit the .svg in the pack and re-sync, never fork it here.
   ============================================================================ */
const ART = {
  'empty-radar': {
    vb: '0 0 120 120',
    inner: '<circle cx="60" cy="60" r="46" stroke="#5C8A77" stroke-opacity="0.34" stroke-width="1.5"></circle><circle cx="60" cy="60" r="31" stroke="#5C8A77" stroke-opacity="0.26" stroke-width="1.5"></circle><circle cx="60" cy="60" r="16" stroke="#5C8A77" stroke-opacity="0.26" stroke-width="1.5"></circle><line x1="60" y1="14" x2="60" y2="106" stroke="#5C8A77" stroke-opacity="0.18" stroke-width="1.5"></line><line x1="14" y1="60" x2="106" y2="60" stroke="#5C8A77" stroke-opacity="0.18" stroke-width="1.5"></line><path d="M60 60 L60 14 A46 46 0 0 1 93.1 28 Z" fill="#5C8A77" fill-opacity="0.07"></path><line x1="60" y1="60" x2="60" y2="14" stroke="#5C8A77" stroke-opacity="0.4" stroke-width="1.5"></line><circle cx="60" cy="60" r="2" fill="#5C8A77" fill-opacity="0.6"></circle>'
  },
  'lonely-blip': {
    vb: '0 0 120 120',
    inner: '<defs><filter id="lb_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"></feGaussianBlur></filter></defs><circle cx="60" cy="60" r="46" stroke="#3DFFA2" stroke-opacity="0.20" stroke-width="1.5"></circle><circle cx="60" cy="60" r="31" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"></circle><circle cx="60" cy="60" r="16" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"></circle><line x1="60" y1="14" x2="60" y2="106" stroke="#3DFFA2" stroke-opacity="0.10" stroke-width="1.5"></line><line x1="14" y1="60" x2="106" y2="60" stroke="#3DFFA2" stroke-opacity="0.10" stroke-width="1.5"></line><circle cx="78" cy="44" r="20" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"></circle><circle cx="78" cy="44" r="12" stroke="#3DFFA2" stroke-opacity="0.34" stroke-width="1.5"></circle><circle cx="78" cy="44" r="7" fill="#3DFFA2" opacity="0.4" filter="url(#lb_g)"></circle><circle cx="78" cy="44" r="3.2" fill="#3DFFA2"></circle>'
  },
  'agent-orb-idle': {
    vb: '0 0 120 120',
    inner: '<ellipse cx="60" cy="60" rx="48" ry="19" transform="rotate(-22 60 60)" stroke="#A78BFA" stroke-opacity="0.20" stroke-width="1.5"></ellipse><ellipse cx="60" cy="60" rx="48" ry="19" transform="rotate(34 60 60)" stroke="#A78BFA" stroke-opacity="0.16" stroke-width="1.5"></ellipse><circle cx="60" cy="60" r="26" stroke="#A78BFA" stroke-opacity="0.34" stroke-width="1.5"></circle><circle cx="60" cy="60" r="16" stroke="#A78BFA" stroke-opacity="0.24" stroke-width="1.5"></circle><circle cx="60" cy="60" r="6.5" fill="#A78BFA" fill-opacity="0.30"></circle><circle cx="98" cy="46" r="2.4" fill="#A78BFA" fill-opacity="0.5"></circle>'
  },
  'agent-orb-active': {
    vb: '0 0 120 120',
    inner: '<defs><filter id="orb_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"></feGaussianBlur></filter></defs><ellipse cx="60" cy="60" rx="48" ry="19" transform="rotate(-22 60 60)" stroke="#A78BFA" stroke-opacity="0.45" stroke-width="1.5"></ellipse><ellipse cx="60" cy="60" rx="48" ry="19" transform="rotate(34 60 60)" stroke="#A78BFA" stroke-opacity="0.38" stroke-width="1.5"></ellipse><circle cx="60" cy="60" r="26" stroke="#A78BFA" stroke-opacity="0.7" stroke-width="1.5"></circle><circle cx="60" cy="60" r="16" stroke="#A78BFA" stroke-opacity="0.5" stroke-width="1.5"></circle><circle cx="60" cy="60" r="13" fill="#A78BFA" opacity="0.5" filter="url(#orb_g)"></circle><circle cx="60" cy="60" r="7" fill="#A78BFA"></circle><circle cx="98" cy="46" r="3.4" fill="#A78BFA" filter="url(#orb_g)"></circle><circle cx="98" cy="46" r="2.4" fill="#E8F0F2"></circle>'
  },
  'flatline-calibration': {
    vb: '0 0 120 120',
    inner: '<line x1="20" y1="26" x2="20" y2="92" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.5"></line><line x1="20" y1="92" x2="104" y2="92" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.5"></line><line x1="22" y1="42" x2="104" y2="42" stroke="#4CC9F0" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="2 5"></line><text x="104" y="38" text-anchor="end" font-family="&#39;JetBrains Mono&#39;, monospace" font-size="8" fill="#4CC9F0" fill-opacity="0.7">target</text><rect x="30" y="89" width="9" height="3" rx="1" fill="#3DFFA2" fill-opacity="0.5"></rect><rect x="44" y="89" width="9" height="3" rx="1" fill="#3DFFA2" fill-opacity="0.5"></rect><rect x="58" y="89" width="9" height="3" rx="1" fill="#3DFFA2" fill-opacity="0.5"></rect><rect x="72" y="89" width="9" height="3" rx="1" fill="#3DFFA2" fill-opacity="0.5"></rect><rect x="86" y="89" width="9" height="3" rx="1" fill="#3DFFA2" fill-opacity="0.5"></rect>'
  },
  'clean-signal': {
    vb: '0 0 120 120',
    inner: '<defs><filter id="cs_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"></feGaussianBlur></filter></defs><circle cx="60" cy="60" r="42" stroke="#3DFFA2" stroke-opacity="0.20" stroke-width="1.5"></circle><circle cx="60" cy="60" r="26" stroke="#3DFFA2" stroke-opacity="0.14" stroke-width="1.5"></circle><path d="M50 60 l7 7 l14 -17" stroke="#3DFFA2" stroke-width="3" opacity="0.5" filter="url(#cs_g)"></path><path d="M50 60 l7 7 l14 -17" stroke="#3DFFA2" stroke-width="2.5"></path>'
  },
  'lost-signal': {
    vb: '0 0 120 120',
    inner: '<defs><filter id="ls_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2"></feGaussianBlur></filter></defs><path d="M60 14 A46 46 0 0 0 60 106" stroke="#3DFFA2" stroke-opacity="0.22" stroke-width="1.5"></path><path d="M60 29 A31 31 0 0 0 60 91" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.5"></path><line x1="14" y1="60" x2="46" y2="60" stroke="#3DFFA2" stroke-opacity="0.14" stroke-width="1.5"></line><path d="M64 15 A46 46 0 0 1 104 56" stroke="#FF5D5D" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="6 5" transform="translate(3 -2)"></path><path d="M62 30 A31 31 0 0 1 90 70" stroke="#FF5D5D" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="4 5" transform="translate(5 1)"></path><path d="M84 92 A46 46 0 0 0 105 64" stroke="#FF5D5D" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="5 6" transform="translate(-2 3)"></path><rect x="58" y="56" width="52" height="8" fill="#FF5D5D" fill-opacity="0.07"></rect><line x1="44" y1="56" x2="112" y2="56" stroke="#FFC857" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 4"></line><line x1="50" y1="64" x2="106" y2="64" stroke="#FF5D5D" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3 4" transform="translate(6 0)"></line><rect x="92" y="38" width="9" height="3" fill="#FFC857" fill-opacity="0.6"></rect><rect x="86" y="78" width="13" height="3" fill="#FF5D5D" fill-opacity="0.55"></rect><circle cx="82" cy="46" r="7" fill="#FF5D5D" opacity="0.45" filter="url(#ls_g)"></circle><circle cx="82" cy="46" r="3.2" fill="#FF5D5D"></circle><circle cx="60" cy="60" r="2" fill="#3DFFA2" fill-opacity="0.5"></circle>'
  },
  'off-the-grid': {
    vb: '0 0 120 120',
    inner: '<defs><filter id="og_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"></feGaussianBlur></filter><clipPath id="og_clip"><path d="M6 14 H58 L54 26 L60 40 L52 54 L58 70 L50 84 L56 100 L6 106 Z"></path></clipPath></defs><g clip-path="url(#og_clip)" stroke="#3DFFA2" stroke-opacity="0.20" stroke-width="1.5"><line x1="6" y1="26" x2="58" y2="26"></line><line x1="6" y1="44" x2="58" y2="44"></line><line x1="6" y1="62" x2="58" y2="62"></line><line x1="6" y1="80" x2="58" y2="80"></line><line x1="6" y1="98" x2="58" y2="98"></line><line x1="20" y1="14" x2="20" y2="106"></line><line x1="36" y1="14" x2="36" y2="106"></line><line x1="52" y1="14" x2="52" y2="106"></line></g><path d="M58 14 L54 26 L60 40 L52 54 L58 70 L50 84 L56 100" stroke="#3DFFA2" stroke-opacity="0.5" stroke-width="1.5"></path><circle cx="40" cy="60" r="3" fill="#3DFFA2"></circle><circle cx="40" cy="60" r="9" stroke="#3DFFA2" stroke-opacity="0.3" stroke-width="1.5"></circle><line x1="40" y1="60" x2="108" y2="34" stroke="#3DFFA2" stroke-opacity="0.55" stroke-width="1.5"></line><path d="M40 60 L108 34 L104 50 Z" fill="#3DFFA2" fill-opacity="0.06"></path><g fill="#3DFFA2" fill-opacity="0.45"><circle cx="72" cy="48" r="1.3"></circle><circle cx="84" cy="40" r="1.3"></circle><circle cx="96" cy="60" r="1.3"></circle><circle cx="78" cy="72" r="1.3"></circle><circle cx="100" cy="44" r="1.3"></circle><circle cx="88" cy="86" r="1.3"></circle><circle cx="104" cy="74" r="1.3"></circle><circle cx="68" cy="86" r="1.3"></circle></g>'
  },
  'static-interference': {
    vb: '0 0 96 96',
    inner: '<path d="M20 28 A38 38 0 0 1 76 30" stroke="#FF5D5D" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="7 5"></path><path d="M28 64 A26 26 0 0 0 70 62" stroke="#FFC857" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="5 5"></path><rect x="14" y="44" width="68" height="7" fill="#FF5D5D" fill-opacity="0.07"></rect><line x1="12" y1="44" x2="80" y2="44" stroke="#FFC857" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="3 4"></line><line x1="18" y1="51" x2="84" y2="51" stroke="#FF5D5D" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 4" transform="translate(5 0)"></line><g fill="#FFC857" fill-opacity="0.7"><rect x="30" y="32" width="2" height="2"></rect><rect x="58" y="36" width="2" height="2"></rect><rect x="44" y="60" width="2" height="2"></rect><rect x="66" y="56" width="2" height="2"></rect></g><g fill="#FF5D5D" fill-opacity="0.7"><rect x="38" y="38" width="2" height="2"></rect><rect x="52" y="64" width="2" height="2"></rect><rect x="24" y="56" width="2" height="2"></rect><rect x="70" y="40" width="2" height="2"></rect></g><circle cx="48" cy="48" r="2.4" fill="#FF5D5D"></circle>'
  },
  'blip-sprite': {
    vb: '0 0 56 56',
    inner: '<defs><filter id="bs_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"></feGaussianBlur></filter></defs><circle cx="28" cy="28" r="22" stroke="#3DFFA2" stroke-opacity="0.16" stroke-width="1.5"></circle><circle cx="28" cy="28" r="13" stroke="#3DFFA2" stroke-opacity="0.34" stroke-width="1.5"></circle><circle cx="28" cy="28" r="8" fill="#3DFFA2" opacity="0.4" filter="url(#bs_g)"></circle><circle cx="28" cy="28" r="4" fill="#3DFFA2"></circle>'
  },
  'loading-sweep': {
    vb: '0 0 120 120',
    inner: '<circle cx="60" cy="60" r="46" stroke="#3DFFA2" stroke-opacity="0.14" stroke-width="1.5"></circle><circle cx="60" cy="60" r="31" stroke="#3DFFA2" stroke-opacity="0.10" stroke-width="1.5"></circle><path d="M60 60 L60 14 A46 46 0 0 1 99 38 Z" fill="#3DFFA2" fill-opacity="0.12"></path><line x1="60" y1="60" x2="60" y2="14" stroke="#3DFFA2" stroke-width="1.5"></line><circle cx="60" cy="60" r="2.4" fill="#3DFFA2"></circle>'
  },
  'mark': {
    vb: '0 0 64 64',
    inner: '<defs><filter id="mark_g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"></feGaussianBlur></filter></defs><circle cx="32" cy="32" r="26" stroke="#3DFFA2" stroke-opacity="0.30" stroke-width="1.5"></circle><circle cx="32" cy="32" r="17" stroke="#3DFFA2" stroke-opacity="0.20" stroke-width="1.5"></circle><circle cx="32" cy="32" r="8" stroke="#3DFFA2" stroke-opacity="0.20" stroke-width="1.5"></circle><path d="M32 32 L32 6 A26 26 0 0 1 51.9 15.3 Z" fill="#3DFFA2" fill-opacity="0.12"></path><line x1="32" y1="32" x2="32" y2="6" stroke="#3DFFA2" stroke-opacity="0.6" stroke-width="1.5"></line><circle cx="32" cy="32" r="2.2" fill="#3DFFA2"></circle><circle cx="49" cy="22" r="6" fill="#3DFFA2" opacity="0.35" filter="url(#mark_g)"></circle><circle cx="49" cy="22" r="3" fill="#3DFFA2"></circle>'
  },
  'favicon': {
    vb: '0 0 24 24',
    inner: '<circle cx="12" cy="12" r="9.5" stroke="#3DFFA2" stroke-opacity="0.45" stroke-width="2.5"></circle><path d="M12 12 L12 2.5 A9.5 9.5 0 0 1 19.8 6.6 Z" fill="#3DFFA2" fill-opacity="0.16"></path><line x1="12" y1="12" x2="12" y2="2.5" stroke="#3DFFA2" stroke-opacity="0.7" stroke-width="2.5"></line><circle cx="17.6" cy="8.8" r="2.1" fill="#3DFFA2"></circle>'
  },
  'wordmark': {
    vb: '0 0 300 64',
    inner: '<g transform="translate(32 32)"><circle r="24" fill="none" stroke="#3DFFA2" stroke-opacity="0.22" stroke-width="1.5"></circle><circle r="15.5" fill="none" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.5"></circle><circle r="7" fill="none" stroke="#3DFFA2" stroke-opacity="0.18" stroke-width="1.5"></circle><path d="M0 0 L0 -24 A24 24 0 0 1 18.4 -15.4 Z" fill="#3DFFA2" fill-opacity="0.12"></path><line x1="0" y1="0" x2="0" y2="-24" stroke="#3DFFA2" stroke-opacity="0.55" stroke-width="1.5"></line><circle r="2.4" fill="#3DFFA2"></circle><circle cx="18" cy="-12" r="2.2" fill="#3DFFA2"></circle></g><text x="72" y="42" font-family="&#39;Space Grotesk&#39;, system-ui, sans-serif" font-size="30" font-weight="600" letter-spacing="-0.5" fill="#E8F0F2">hiring-radar</text><circle cx="99.5" cy="14.5" r="3.1" fill="#3DFFA2"></circle><circle cx="99.5" cy="14.5" r="6" fill="#3DFFA2" opacity="0.28" filter="url(#wm_glow)"></circle><defs><filter id="wm_glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2"></feGaussianBlur></filter></defs>'
  }
};
// friendly aliases for older call sites
const ALIAS = {
  radar: 'empty-radar',
  bot: 'agent-orb-idle',
  'agent-orb': 'agent-orb-active'
};

/**
 * HRIllustration — renders a named pack asset. Filter ids are namespaced per
 * instance so multiple illustrations can share a page without id collisions.
 */
function HRIllustration({
  name = 'empty-radar',
  size = 120,
  style,
  ...rest
}) {
  const key = ALIAS[name] || name;
  const a = ART[key] || ART['empty-radar'];
  const rawUid = React.useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9]/g, '');
  const inner = a.inner.replace(/id="([^"]+)"/g, (m, p) => 'id="' + p + '-' + uid + '"').replace(/url\(#([^)]+)\)/g, (m, p) => 'url(#' + p + '-' + uid + ')');
  const parts = a.vb.split(/\s+/);
  const vw = parseFloat(parts[2]) || 1;
  const vh = parseFloat(parts[3]) || 1;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: a.vb,
    width: size,
    height: Math.round(size * (vh / vw)),
    fill: 'none',
    'aria-hidden': true,
    style: {
      display: 'block',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: inner
    },
    ...rest
  });
}

/**
 * EmptyState — centered illustration slot + headline + sub-line + optional action.
 */
function EmptyState({
  illustration = 'empty-radar',
  title,
  description,
  action,
  onAction,
  actionIcon,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 6,
      padding: '40px 24px',
      maxWidth: 380,
      margin: '0 auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      opacity: 0.92
    }
  }, typeof illustration === 'string' ? /*#__PURE__*/React.createElement(HRIllustration, {
    name: illustration,
    size: 120
  }) : illustration), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-hi)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    iconLeft: actionIcon,
    onClick: onAction
  }, action)));
}
Object.assign(__ds_scope, { HRIllustration, EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ErrorState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ErrorState — recovery-oriented error. ALWAYS shows a recovery action and a
 * plain-language cause, never a stack trace. `compact` (inline/widget) drops the
 * illustration to STATIC INTERFERENCE or none; full uses LOST SIGNAL.
 */
function ErrorState({
  cause = "Couldn't reach the database",
  detail,
  tone = 'red',
  onRetry,
  retryLabel = 'Retry',
  compact = false,
  hideIllustration = false,
  style,
  ...rest
}) {
  const illo = compact ? 'static-interference' : 'lost-signal';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "alert",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 6,
      padding: compact ? '20px 16px' : '40px 24px',
      maxWidth: compact ? 320 : 400,
      margin: '0 auto',
      ...style
    }
  }, rest), !hideIllustration && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: compact ? 10 : 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.HRIllustration, {
    name: illo,
    size: compact ? 84 : 116
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: compact ? 'var(--text-base)' : 'var(--text-h3)',
      color: 'var(--text-hi)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600
    }
  }, cause), detail && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, detail), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    iconLeft: "retry",
    onClick: onRetry
  }, retryLabel)));
}
Object.assign(__ds_scope, { ErrorState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ErrorState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Skeleton — phosphor-tinted shimmer placeholder. variant:
 * text | row (table row) | card (scorecard) | radar (circular).
 */
function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 3,
  style,
  ...rest
}) {
  const base = {
    background: 'linear-gradient(90deg, rgba(147,164,179,0.06) 0%, rgba(61,255,162,0.10) 50%, rgba(147,164,179,0.06) 100%)',
    backgroundSize: '200% 100%',
    animation: 'hr-shimmer 1.4s linear infinite',
    borderRadius: 'var(--radius-sm)'
  };
  const css = /*#__PURE__*/React.createElement("style", null, `@keyframes hr-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @media (prefers-reduced-motion: reduce){.hr-skel{animation:none!important}}`);
  if (variant === 'text') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: width || '100%',
        ...style
      }
    }, rest), Array.from({
      length: lines
    }).map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "hr-skel",
      style: {
        ...base,
        height: 11,
        width: i === lines - 1 ? '60%' : '100%'
      }
    })), css);
  }
  if (variant === 'row') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px',
        border: 'var(--border-1)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--bg-raised)',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        height: 13,
        width: '45%'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        height: 10,
        width: '70%'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        width: 40,
        height: 40,
        borderRadius: '50%'
      }
    }), css);
  }
  if (variant === 'card') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 'var(--pad-card)',
        border: 'var(--border-1)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--bg-raised)',
        minWidth: 150,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        height: 9,
        width: '40%'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        height: 30,
        width: '70%'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "hr-skel",
      style: {
        ...base,
        height: 9,
        width: '55%'
      }
    }), css);
  }
  // radar
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "hr-skel",
    style: {
      ...base,
      width: width || 120,
      height: height || 120,
      borderRadius: '50%'
    }
  }), css);
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  success: {
    c: 'var(--phosphor)',
    icon: 'check',
    glow: 'var(--glow-phosphor-sm)'
  },
  error: {
    c: 'var(--red)',
    icon: 'x-circle',
    glow: 'var(--glow-red)'
  },
  warning: {
    c: 'var(--amber)',
    icon: 'alert-triangle',
    glow: 'none'
  },
  info: {
    c: 'var(--cyan)',
    icon: 'info',
    glow: 'var(--glow-cyan)'
  }
};

/**
 * Toast — transient notification on glass. Tones success/error/warning/info,
 * plus action variants: Retry, and Undo with a mono countdown ("Undo (8s)").
 */
function Toast({
  tone = 'info',
  title,
  message,
  action,
  onAction,
  actionLabel,
  undoSeconds,
  onUndo,
  onClose,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  const [secs, setSecs] = React.useState(undoSeconds);
  React.useEffect(() => {
    if (undoSeconds == null) return;
    setSecs(undoSeconds);
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(id);
  }, [undoSeconds]);
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      width: 360,
      maxWidth: '90vw',
      padding: '12px 14px',
      background: 'var(--glass)',
      backdropFilter: 'blur(var(--blur-glass))',
      WebkitBackdropFilter: 'blur(var(--blur-glass))',
      border: '1px solid var(--border)',
      borderLeft: `2px solid ${t.c}`,
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-pop)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.c,
      marginTop: 1,
      filter: t.glow !== 'none' ? `drop-shadow(0 0 6px ${t.c})` : 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 13px/1.3 var(--font-ui)',
      color: 'var(--text-hi)'
    }
  }, title), message && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, message), (action || undoSeconds != null) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 8
    }
  }, undoSeconds != null && /*#__PURE__*/React.createElement("button", {
    onClick: onUndo,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      font: 'var(--mono-sm)',
      color: t.c
    }
  }, "Undo (", secs, "s)"), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      font: '600 12px/1 var(--font-ui)',
      color: t.c
    }
  }, action === 'retry' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "retry",
    size: 13
  }), actionLabel || (action === 'retry' ? 'Retry' : 'Action')))), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      padding: 2,
      cursor: 'pointer',
      color: 'var(--text-low-content)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 15
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tooltip — mono, instant (no delay). Wraps a trigger; shows on hover/focus.
 * Positions: top | bottom | left | right.
 */
function Tooltip({
  label,
  position = 'top',
  children,
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8
    }
  }[position];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, rest), children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 'var(--z-dropdown)',
      ...pos,
      padding: '5px 8px',
      whiteSpace: 'nowrap',
      font: 'var(--mono-sm)',
      color: 'var(--text-hi)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-pop)',
      pointerEvents: 'none'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field. Supports leading icon, error state, and mono mode for data entry.
 */
function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  error,
  disabled = false,
  mono = false,
  size = 'md',
  style,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h)';
  const borderColor = error ? 'var(--red)' : focus ? 'var(--border-strong)' : 'var(--border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: h,
      padding: '0 12px',
      background: 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-control)',
      boxShadow: error ? 'var(--glow-red)' : focus ? 'var(--glow-phosphor-sm)' : 'none',
      opacity: disabled ? 0.45 : 1,
      transition: 'border-color var(--dur-fast), box-shadow var(--dur)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--text-low-content)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    "aria-invalid": error ? true : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-hi)',
      font: mono ? 'var(--mono-base)' : 'var(--text-base)',
      letterSpacing: mono ? '0' : 'normal'
    }
  }, rest))), error && typeof error === 'string' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-xs)',
      color: 'var(--red)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-triangle",
    size: 13,
    strokeWidth: 1.75
  }), error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RangeSlider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * RangeSlider — single-value range (e.g. min salary). Phosphor track fill,
 * mono value readout. Value shown formatted via `format`.
 */
function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  format = v => v,
  disabled = false,
  style,
  id,
  ...rest
}) {
  const pct = (value - min) / (max - min) * 100;
  const sid = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, (label || format) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: sid,
    style: {
      font: 'var(--text-xs)',
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-base)',
      color: 'var(--phosphor)'
    }
  }, format(value))), /*#__PURE__*/React.createElement("input", _extends({
    id: sid,
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: onChange,
    disabled: disabled,
    className: "hr-range",
    style: {
      width: '100%',
      height: 24,
      appearance: 'none',
      WebkitAppearance: 'none',
      background: 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ['--pct']: pct + '%'
    }
  }, rest)), /*#__PURE__*/React.createElement("style", null, `
        .hr-range { --pct: 50%; }
        .hr-range::-webkit-slider-runnable-track {
          height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, var(--phosphor) 0 var(--pct), rgba(147,164,179,0.18) var(--pct) 100%);
        }
        .hr-range::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(147,164,179,0.18); }
        .hr-range::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--phosphor); }
        .hr-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; margin-top: -6px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--bg-raised); border: 2px solid var(--phosphor);
          box-shadow: var(--glow-phosphor-sm);
        }
        .hr-range::-moz-range-thumb {
          width: 16px; height: 16px; border: 2px solid var(--phosphor); border-radius: 50%;
          background: var(--bg-raised); box-shadow: var(--glow-phosphor-sm);
        }
        .hr-range:focus-visible { outline: none; }
        .hr-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--phosphor-dim); }
      `));
}
Object.assign(__ds_scope, { RangeSlider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RangeSlider.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SearchInput — the primary scan field. Mono placeholder, ⌘K hint, optional clear.
 */
function SearchInput({
  value,
  onChange,
  placeholder = 'scan postings…',
  hint = '⌘K',
  onClear,
  autoFocus,
  size = 'md',
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: h,
      width: '100%',
      padding: '0 10px 0 12px',
      background: 'var(--bg-surface)',
      border: `1px solid ${focus ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-control)',
      boxShadow: focus ? 'var(--glow-phosphor-sm)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16,
    style: {
      color: focus ? 'var(--phosphor)' : 'var(--text-low-content)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: "search",
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    autoFocus: autoFocus,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-hi)',
      font: 'var(--mono-base)'
    }
  }, rest)), value && onClear ? /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    "aria-label": "Clear",
    style: {
      display: 'inline-flex',
      background: 'none',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: 'var(--text-low-content)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 14
  })) : hint && /*#__PURE__*/React.createElement("kbd", {
    style: {
      font: '600 11px/1 var(--font-mono)',
      color: 'var(--text-low-content)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '3px 6px'
    }
  }, hint));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Select — styled native dropdown with phosphor focus and chevron. */
function Select({
  value,
  onChange,
  children,
  disabled = false,
  error = false,
  size = 'md',
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h)';
  const borderColor = error ? 'var(--red)' : focus ? 'var(--border-strong)' : 'var(--border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      height: h,
      width: '100%',
      background: 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-control)',
      boxShadow: focus ? 'var(--glow-phosphor-sm)' : 'none',
      opacity: disabled ? 0.45 : 1,
      transition: 'border-color var(--dur-fast), box-shadow var(--dur)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      flex: 1,
      height: '100%',
      padding: '0 34px 0 12px',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-hi)',
      font: 'var(--text-base)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), children), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      position: 'absolute',
      right: 10,
      color: 'var(--text-low-content)',
      pointerEvents: 'none'
    }
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Toggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Toggle — on/off switch. Phosphor when on, glow on the knob. */
function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  style,
  ...rest
}) {
  const sid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: sid,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", _extends({
    id: sid,
    role: "switch",
    type: "button",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      position: 'relative',
      width: 38,
      height: 22,
      padding: 0,
      flexShrink: 0,
      background: checked ? 'var(--phosphor-12)' : 'rgba(147,164,179,0.12)',
      border: `1px solid ${checked ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 999,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur), border-color var(--dur)'
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 18 : 2,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: checked ? 'var(--phosphor)' : 'var(--text-low-content)',
      boxShadow: checked ? 'var(--glow-phosphor-sm)' : 'none',
      transition: 'left var(--dur) var(--ease-out), background var(--dur)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-base)',
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ProgressLine.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressLine — thin determinate/indeterminate progress bar.
 * Phosphor by default, violet for AI/agent work.
 */
function ProgressLine({
  value,
  tone = 'phosphor',
  indeterminate = false,
  style,
  ...rest
}) {
  const color = tone === 'violet' ? 'var(--violet)' : 'var(--phosphor)';
  const glow = tone === 'violet' ? 'var(--glow-violet)' : 'var(--glow-phosphor-sm)';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "progressbar",
    "aria-valuenow": indeterminate ? undefined : value,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      position: 'relative',
      width: '100%',
      height: 3,
      overflow: 'hidden',
      background: 'rgba(147,164,179,0.12)',
      borderRadius: 2,
      ...style
    }
  }, rest), indeterminate ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '35%',
      background: color,
      boxShadow: glow,
      borderRadius: 2,
      animation: 'hr-indeterminate 1.2s var(--ease-in-out) infinite'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${Math.max(0, Math.min(100, value))}%`,
      background: color,
      boxShadow: glow,
      borderRadius: 2,
      transition: 'width var(--dur) var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("style", null, `
        @keyframes hr-indeterminate { 0%{left:-35%} 100%{left:100%} }
        @media (prefers-reduced-motion: reduce){
          div[role="progressbar"] > div { animation: none !important; }
        }
      `));
}
Object.assign(__ds_scope, { ProgressLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ProgressLine.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SegmentedControl — mono toggle between 2-4 modes (e.g. search mode: SEMANTIC / KEYWORD / HYBRID).
 * Options: array of { value, label, icon? }.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  style,
  ...rest
}) {
  const h = size === 'sm' ? 28 : 34;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'inline-flex',
      padding: 3,
      gap: 2,
      height: h,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-control)',
      ...style
    }
  }, rest), options.map(opt => {
    const selected = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      role: "tab",
      "aria-selected": selected,
      onClick: () => onChange && onChange(opt.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        height: '100%',
        background: selected ? 'var(--phosphor-12)' : 'transparent',
        color: selected ? 'var(--phosphor)' : 'var(--text-mid)',
        border: selected ? '1px solid var(--border-strong)' : '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        font: '600 11px/1 var(--font-mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background var(--dur-fast), color var(--dur-fast)'
      }
    }, opt.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: opt.icon,
      size: 14
    }), opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabs — filter tabs with mono counts. Underline indicator in phosphor.
 * tabs: array of { value, label, count? }.
 */
function Tabs({
  tabs,
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--divider)',
      ...style
    }
  }, rest), tabs.map(tab => {
    const selected = tab.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.value,
      role: "tab",
      "aria-selected": selected,
      onClick: () => onChange && onChange(tab.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: selected ? 'var(--text-hi)' : 'var(--text-mid)',
        font: '500 13px/1 var(--font-ui)',
        borderBottom: `2px solid ${selected ? 'var(--phosphor)' : 'transparent'}`,
        marginBottom: -1,
        transition: 'color var(--dur-fast)'
      }
    }, tab.label, tab.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        font: '600 11px/1 var(--font-mono)',
        color: selected ? 'var(--phosphor)' : 'var(--text-low-content)',
        background: selected ? 'var(--phosphor-12)' : 'rgba(147,164,179,0.10)',
        borderRadius: 'var(--radius-sm)',
        padding: '3px 6px'
      }
    }, tab.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/CommandPalette.jsx
try { (() => {
/**
 * CommandPalette — ⌘K glass panel with mono input and grouped results.
 * groups: array of { label, items: [{ id, label, icon?, hint? }] }.
 * Shows a no-results state with a fallthrough to "search postings instead".
 */
function CommandPalette({
  open,
  onClose,
  groups = [],
  placeholder = 'Type a command or search…',
  onSelect,
  onSearchFallback
}) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);
  const filtered = groups.map(g => ({
    ...g,
    items: g.items.filter(it => it.label.toLowerCase().includes(query.toLowerCase()))
  })).filter(g => g.items.length);
  const flat = filtered.flatMap(g => g.items);
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') {
        onClose && onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(a => Math.min(flat.length - 1, a + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(a => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flat.length) {
          onSelect && onSelect(flat[active]);
        } else {
          onSearchFallback && onSearchFallback(query);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flat, active, query]);
  if (!open) return null;
  let idx = -1;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-palette)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '14vh',
      background: 'rgba(3,5,8,0.55)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Command palette",
    style: {
      width: 560,
      maxWidth: '92vw',
      maxHeight: '64vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--glass)',
      backdropFilter: 'blur(var(--blur-glass))',
      WebkitBackdropFilter: 'blur(var(--blur-glass))',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-panel), var(--glow-phosphor-sm)',
      animation: 'hr-pop var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '13px 16px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "command",
    size: 18,
    style: {
      color: 'var(--phosphor)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    value: query,
    onChange: e => {
      setQuery(e.target.value);
      setActive(0);
    },
    placeholder: placeholder,
    style: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-hi)',
      font: 'var(--mono-base)'
    }
  }), /*#__PURE__*/React.createElement("kbd", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '2px 6px'
    }
  }, "ESC")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 6
    }
  }, flat.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, "No matches for ", /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-hi)'
    }
  }, "\"", query, "\"")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, "Press ", /*#__PURE__*/React.createElement("kbd", {
    style: {
      color: 'var(--phosphor)'
    }
  }, "Enter"), " to search postings instead")) : filtered.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 10px 4px',
      font: 'var(--label-mono)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-label)'
    }
  }, g.label), g.items.map(it => {
    idx++;
    const cur = idx === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onMouseEnter: () => setActive(idx),
      onClick: () => onSelect && onSelect(it),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 10px',
        background: cur ? 'var(--phosphor-12)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        textAlign: 'left',
        color: cur ? 'var(--text-hi)' : 'var(--text-body)',
        font: 'var(--text-sm)'
      }
    }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 16,
      style: {
        color: cur ? 'var(--phosphor)' : 'var(--text-low-content)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.hint && /*#__PURE__*/React.createElement("kbd", {
      style: {
        font: 'var(--mono-sm)',
        color: 'var(--text-low-content)'
      }
    }, it.hint));
  })))), /*#__PURE__*/React.createElement("style", null, `@keyframes hr-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
          @media (prefers-reduced-motion: reduce){[aria-label="Command palette"]{animation:none!important}}`)));
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Drawer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Drawer — side panel sliding from the right (default) or left. Esc closes,
 * focus trapped, focus returns to trigger. Used for posting detail / agent trace.
 */
function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  width = 440,
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const prevFocus = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    const onKey = e => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const f = ref.current && ref.current.querySelector('button,[href],input,[tabindex]');
      f && f.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-drawer)',
      display: 'flex',
      justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
      background: 'rgba(3,5,8,0.5)',
      backdropFilter: 'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    ref: ref,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    style: {
      width,
      maxWidth: '94vw',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderLeft: side === 'right' ? '1px solid var(--border-strong)' : 'none',
      borderRight: side === 'left' ? '1px solid var(--border-strong)' : 'none',
      boxShadow: 'var(--shadow-panel)',
      animation: `hr-slide-${side} var(--dur-slow) var(--ease-out)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 18px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-hi)'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'none',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: 'var(--text-low-content)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 18
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '14px 18px',
      borderTop: '1px solid var(--divider)'
    }
  }, footer), /*#__PURE__*/React.createElement("style", null, `@keyframes hr-slide-right{from{transform:translateX(100%)}to{transform:none}}
          @keyframes hr-slide-left{from{transform:translateX(-100%)}to{transform:none}}
          @media (prefers-reduced-motion: reduce){[role="dialog"]{animation:none!important}}`)));
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Drawer.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Menu.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Menu — dropdown menu. items: array of
 * { label, icon?, danger?, shortcut?, onSelect } or { divider: true }.
 * `trigger` is the clickable node; menu anchors below it.
 */
function Menu({
  trigger,
  items = [],
  align = 'left',
  open: controlledOpen,
  onOpenChange,
  style,
  ...rest
}) {
  const [uOpen, setUOpen] = React.useState(false);
  const open = controlledOpen != null ? controlledOpen : uOpen;
  const setOpen = v => {
    onOpenChange ? onOpenChange(v) : setUOpen(v);
  };
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(!open)
  }, trigger), open && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    style: {
      position: 'absolute',
      top: '100%',
      [align]: 0,
      marginTop: 6,
      zIndex: 'var(--z-dropdown)',
      minWidth: 184,
      padding: 5,
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-control)',
      boxShadow: 'var(--shadow-pop)'
    }
  }, items.map((it, i) => it.divider ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 1,
      background: 'var(--divider)',
      margin: '5px 0'
    }
  }) : /*#__PURE__*/React.createElement("button", {
    key: i,
    role: "menuitem",
    onClick: () => {
      it.onSelect && it.onSelect();
      setOpen(false);
    },
    className: "hr-menuitem",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '7px 8px',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      color: it.danger ? 'var(--red)' : 'var(--text-body)',
      font: 'var(--text-sm)',
      textAlign: 'left'
    }
  }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 16,
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, it.label), it.shortcut && /*#__PURE__*/React.createElement("kbd", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, it.shortcut))), /*#__PURE__*/React.createElement("style", null, `.hr-menuitem:hover{background:var(--phosphor-08)!important;color:var(--text-hi)!important}
            .hr-menuitem:hover[style*="--red"]{background:var(--red-14)!important}`)));
}
Object.assign(__ds_scope, { Menu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Menu.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Modal — centered dialog on a blurred scrim. Esc closes, focus is trapped,
 * focus returns to the previously-focused element on close.
 */
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 460,
  style,
  ...rest
}) {
  const panelRef = React.useRef(null);
  const prevFocus = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => panel ? panel.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') : [];
    const first = focusables()[0];
    if (first) first.focus();else if (panel) panel.focus();
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const a = f[0],
          z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-modal)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'rgba(3,5,8,0.62)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      animation: 'hr-fade var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    ref: panelRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    tabIndex: -1,
    style: {
      width,
      maxWidth: '100%',
      maxHeight: '88vh',
      overflow: 'auto',
      outline: 'none',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-panel)',
      animation: 'hr-pop var(--dur) var(--ease-out)',
      ...style
    }
  }, rest), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 18px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-hi)'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'none',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: 'var(--text-low-content)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '14px 18px',
      borderTop: '1px solid var(--divider)'
    }
  }, footer), /*#__PURE__*/React.createElement("style", null, `@keyframes hr-fade{from{opacity:0}to{opacity:1}}
          @keyframes hr-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
          @media (prefers-reduced-motion: reduce){[role="dialog"],[role="dialog"]+*{animation:none!important}}`)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Modal.jsx", error: String((e && e.message) || e) }); }

// components/overlay/ConfirmModal.jsx
try { (() => {
/**
 * ConfirmModal — destructive-confirm variant. Red accent, restates the action
 * and object, destructive button on the RIGHT, Cancel focused by default.
 */
function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Discard',
  cancelLabel = 'Cancel',
  confirmIcon = 'alert-triangle',
  tone = 'red'
}) {
  const cancelRef = React.useRef(null);
  React.useEffect(() => {
    if (open) setTimeout(() => cancelRef.current && cancelRef.current.focus(), 30);
  }, [open]);
  const c = tone === 'amber' ? 'var(--amber)' : 'var(--red)';
  return /*#__PURE__*/React.createElement(__ds_scope.Modal, {
    open: open,
    onClose: onCancel,
    width: 420,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      ref: cancelRef,
      tabIndex: -1,
      style: {
        display: 'contents'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "ghost",
      onClick: onCancel
    }, cancelLabel)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "destructive",
      iconLeft: confirmIcon,
      onClick: onConfirm
    }, confirmLabel))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      color: c,
      filter: `drop-shadow(0 0 8px ${c})`
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-triangle",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-hi)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, message))));
}
Object.assign(__ds_scope, { ConfirmModal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/ConfirmModal.jsx", error: String((e && e.message) || e) }); }

// styleguide.jsx
try { (() => {
const NS = window.HiringRadarDesignSystem_e283cd;
// If the compiled bundle is missing, the standalone script in Style Guide.html
// has already shown a fallback in #app; bail out before destructuring.
if (NS) {
  const {
    Button,
    IconButton,
    Icon,
    Kbd,
    SectionLabel,
    Card,
    Input,
    SearchInput,
    Select,
    RangeSlider,
    Toggle,
    Tabs,
    SegmentedControl,
    ProgressLine,
    Tag,
    StatusBadge,
    MatchBadge,
    ScoreGauge,
    Scorecard,
    Sparkline,
    JobRow,
    Toast,
    Banner,
    Skeleton,
    EmptyState,
    ErrorState,
    Tooltip,
    Menu,
    Modal,
    ConfirmModal,
    Drawer,
    CommandPalette
  } = NS;
  const ICONS = ['search', 'radar', 'list', 'bookmark', 'bot', 'user', 'server', 'settings', 'play', 'pause', 'retry', 'external-link', 'copy', 'kebab', 'filter', 'close', 'check', 'alert-triangle', 'chevron-down', 'command', 'map-pin', 'clock', 'x-circle', 'arrow-right', 'bell', 'signal', 'zap', 'database', 'info', 'inbox', 'sliders', 'chevron-right'];
  function Section({
    label,
    title,
    sub,
    children
  }) {
    return /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("p", {
      className: "seclbl"
    }, label), /*#__PURE__*/React.createElement("h2", {
      className: "sec"
    }, title), sub && /*#__PURE__*/React.createElement("p", {
      className: "secsub"
    }, sub), children);
  }
  function Grp({
    label,
    children,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "grp",
      style: style
    }, /*#__PURE__*/React.createElement("div", {
      className: "grplbl"
    }, label), children);
  }
  function App() {
    const [q, setQ] = React.useState('staff rust remote');
    const [sal, setSal] = React.useState(180);
    const [remote, setRemote] = React.useState(true);
    const [visa, setVisa] = React.useState(false);
    const [tab, setTab] = React.useState('new');
    const [mode, setMode] = React.useState('hybrid');
    const [sel, setSel] = React.useState('helio');
    const [saved, setSaved] = React.useState({
      helio: true
    });
    const [modal, setModal] = React.useState(false);
    const [confirm, setConfirm] = React.useState(false);
    const [drawer, setDrawer] = React.useState(false);
    const [palette, setPalette] = React.useState(false);
    const [toasts, setToasts] = React.useState([]);
    React.useEffect(() => {
      const onKey = e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setPalette(true);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);
    function pushToast(t) {
      const id = Date.now() + Math.random();
      setToasts(ts => [...ts, {
        ...t,
        id
      }]);
      setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5200);
    }
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      label: "Foundation",
      title: "Type & iconography",
      sub: "Space Grotesk display \xB7 Inter UI \xB7 JetBrains Mono for all data. One Lucide-style stroke set at 1.5px."
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Type ramp"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-display)',
        color: 'var(--text-hi)',
        letterSpacing: 'var(--tracking-display)'
      }
    }, "Scanning the market"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-h2)',
        color: 'var(--text-hi)'
      }
    }, "Cortex Labs \xB7 Staff Engineer"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-base)',
        color: 'var(--text-body)'
      }
    }, "Hybrid semantic search ranks every posting against your profile."), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--mono-lg)',
        color: 'var(--phosphor)'
      }
    }, "$210\u2013250K \xB7 match=0.92 \xB7 06:00 UTC"))), /*#__PURE__*/React.createElement(Grp, {
      label: "Icon set"
    }, /*#__PURE__*/React.createElement("div", {
      className: "iconrow"
    }, ICONS.map(n => /*#__PURE__*/React.createElement("div", {
      key: n
    }, /*#__PURE__*/React.createElement(Icon, {
      name: n,
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      className: "nm"
    }, n)))))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Buttons",
      sub: "Phosphor primary carries the glow. One primary per view."
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Variants"
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: "play"
    }, "Run sweep"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: "filter"
    }, "Filters"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "copy"
    }, "Copy"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      iconLeft: "alert-triangle"
    }, "Discard"))), /*#__PURE__*/React.createElement(Grp, {
      label: "States"
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      loading: true
    }, "Scanning"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      disabled: true
    }, "Disabled"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      iconRight: "arrow-right"
    }, "Large"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "Small"))), /*#__PURE__*/React.createElement(Grp, {
      label: "Icon buttons",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "play",
      label: "Run",
      variant: "solid"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "bookmark",
      label: "Save",
      active: true
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "kebab",
      label: "More"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "retry",
      label: "Retry",
      loading: true
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "close",
      label: "Close",
      variant: "danger"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "settings",
      label: "Settings",
      disabled: true
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 4,
        marginLeft: 10
      }
    }, /*#__PURE__*/React.createElement(Kbd, null, "\u2318"), /*#__PURE__*/React.createElement(Kbd, null, "K"))))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Inputs & controls",
      sub: "Mono placeholders for data fields. Focus glows phosphor; errors glow red."
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Search & text"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col"
    }, /*#__PURE__*/React.createElement(SearchInput, {
      value: q,
      onChange: e => setQ(e.target.value),
      onClear: () => setQ('')
    }), /*#__PURE__*/React.createElement(Input, {
      value: "ada@lovelace.dev",
      onChange: () => {},
      icon: "user"
    }), /*#__PURE__*/React.createElement(Input, {
      value: "not-an-email",
      onChange: () => {},
      error: "Enter a valid email"
    }))), /*#__PURE__*/React.createElement(Grp, {
      label: "Select, slider, toggles"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col"
    }, /*#__PURE__*/React.createElement(Select, {
      value: mode,
      onChange: e => setMode(e.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: "semantic"
    }, "Semantic search"), /*#__PURE__*/React.createElement("option", {
      value: "keyword"
    }, "Keyword"), /*#__PURE__*/React.createElement("option", {
      value: "hybrid"
    }, "Hybrid")), /*#__PURE__*/React.createElement(RangeSlider, {
      value: sal,
      onChange: e => setSal(+e.target.value),
      min: 80,
      max: 400,
      step: 5,
      label: "Min base salary",
      format: v => '$' + v + 'K'
    }), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 24
      }
    }, /*#__PURE__*/React.createElement(Toggle, {
      checked: remote,
      onChange: setRemote,
      label: "Remote only"
    }), /*#__PURE__*/React.createElement(Toggle, {
      checked: visa,
      onChange: setVisa,
      label: "Visa sponsor"
    }))))), /*#__PURE__*/React.createElement(Grp, {
      label: "Tabs \xB7 segmented \xB7 progress",
      style: {
        marginTop: 8,
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      tabs: [{
        value: 'all',
        label: 'All roles',
        count: 312
      }, {
        value: 'new',
        label: 'New',
        count: 47
      }, {
        value: 'saved',
        label: 'Saved',
        count: 9
      }, {
        value: 'applied',
        label: 'Applied',
        count: 3
      }]
    }), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(SegmentedControl, {
      value: mode,
      onChange: setMode,
      options: [{
        value: 'semantic',
        label: 'Semantic',
        icon: 'bot'
      }, {
        value: 'keyword',
        label: 'Keyword',
        icon: 'search'
      }, {
        value: 'hybrid',
        label: 'Hybrid',
        icon: 'zap'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(ProgressLine, {
      value: 72
    }), /*#__PURE__*/React.createElement(ProgressLine, {
      indeterminate: true,
      tone: "violet"
    })))))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Tags, badges, match score",
      sub: "Status drives color. Match strength = violet opacity; the gauge counts up on mount."
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Status \xB7 attributes / process / triggers"
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: "NEW"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "REMOTE"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "ONSITE"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "HYBRID"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "VISA"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 18,
        background: 'var(--divider)'
      }
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "RUNNING"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "COMPLETED"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "FAILED"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "PARTIAL"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "RESUMED"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "CANCELLED"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 18,
        background: 'var(--divider)'
      }
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "CRON"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "MANUAL"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "BACKFILL"
    }))), /*#__PURE__*/React.createElement(Grp, {
      label: "Stack tags \xB7 filter chips \xB7 match \xB7 gauge",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Tag, null, "Rust"), /*#__PURE__*/React.createElement(Tag, null, "k8s"), /*#__PURE__*/React.createElement(Tag, {
      tone: "cyan"
    }, "Postgres"), /*#__PURE__*/React.createElement(Tag, {
      tone: "phosphor",
      onRemove: () => {}
    }, "remote"), /*#__PURE__*/React.createElement(Tag, {
      tone: "violet",
      icon: "bot",
      onRemove: () => {}
    }, "AI-matched"), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 18,
        background: 'var(--divider)'
      }
    }), /*#__PURE__*/React.createElement(MatchBadge, {
      level: "HIGH",
      score: 92
    }), /*#__PURE__*/React.createElement(MatchBadge, {
      level: "MED",
      score: 64
    }), /*#__PURE__*/React.createElement(MatchBadge, {
      level: "LOW",
      score: 31
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 18,
        background: 'var(--divider)'
      }
    }), /*#__PURE__*/React.createElement(ScoreGauge, {
      score: 92,
      size: 56,
      label: "Match"
    }), /*#__PURE__*/React.createElement(ScoreGauge, {
      score: 64,
      size: 56
    })))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Cards & scorecards",
      sub: "The dashboard atoms. Big mono numbers count up; sparklines trace the last few sweeps."
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid3",
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(Scorecard, {
      label: "New roles",
      value: 47,
      delta: 12,
      spark: [3, 5, 4, 7, 6, 9, 8, 12]
    }), /*#__PURE__*/React.createElement(Scorecard, {
      label: "Avg match",
      value: 71,
      suffix: "/100",
      tone: "violet",
      spark: [60, 62, 58, 66, 70, 68, 71]
    }), /*#__PURE__*/React.createElement(Scorecard, {
      label: "Shortlisted",
      value: 9,
      tone: "cyan",
      spark: [2, 3, 3, 5, 6, 7, 9]
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement(Card, {
      header: "Posting \xB7 Cortex Labs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-h3)',
        color: 'var(--text-hi)'
      }
    }, "Staff Systems Engineer"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--mono-base)',
        color: 'var(--phosphor)'
      }
    }, "$210\u2013250K \xB7 Remote (US)"), /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Tag, null, "Rust"), /*#__PURE__*/React.createElement(Tag, null, "Postgres"), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "VISA"
    })))), /*#__PURE__*/React.createElement(Card, {
      variant: "glass",
      header: "Glass overlay",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "close",
        label: "Close",
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-sm)',
        color: 'var(--text-body)'
      }
    }, "Glass surfaces sit over the radar for sticky bars, popovers, and the command palette.")))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Job rows",
      sub: "Default \xB7 hover (border glows) \xB7 selected \xB7 stale (amber dot). The signal feed is a stack of these."
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(JobRow, {
      company: "Cortex Labs",
      role: "Staff Systems Engineer",
      salary: "$210\u2013250K",
      location: "Remote (US)",
      tags: ['Rust', 'Postgres', 'k8s'],
      badges: ['NEW', 'REMOTE', 'VISA'],
      score: 92,
      selected: sel === 'cortex',
      bookmarked: saved.cortex,
      onSelect: () => setSel('cortex'),
      onBookmark: () => setSaved(s => ({
        ...s,
        cortex: !s.cortex
      }))
    }), /*#__PURE__*/React.createElement(JobRow, {
      company: "Helio",
      role: "Senior Backend Engineer",
      salary: "$180\u2013220K",
      location: "NYC \xB7 Hybrid",
      tags: ['Go', 'gRPC'],
      badges: ['HYBRID'],
      score: 64,
      selected: sel === 'helio',
      bookmarked: saved.helio,
      onSelect: () => setSel('helio'),
      onBookmark: () => setSaved(s => ({
        ...s,
        helio: !s.helio
      }))
    }), /*#__PURE__*/React.createElement(JobRow, {
      company: "Driftwood",
      role: "Platform Engineer",
      salary: "$160\u2013190K",
      location: "Remote (EU)",
      tags: ['Python', 'AWS', 'Terraform'],
      badges: ['REMOTE'],
      score: 48,
      stale: true,
      selected: sel === 'drift',
      bookmarked: saved.drift,
      onSelect: () => setSel('drift'),
      onBookmark: () => setSaved(s => ({
        ...s,
        drift: !s.drift
      }))
    }))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Toasts & banners",
      sub: "Toasts live on glass with retry / undo-countdown actions. Banners span under the topbar in three tones."
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Trigger a toast"
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => pushToast({
        tone: 'success',
        title: 'Sweep complete',
        message: '47 new roles ingested.'
      })
    }, "Success"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => pushToast({
        tone: 'error',
        title: 'Ingestion failed',
        message: "Couldn't reach the HN API.",
        action: 'retry'
      })
    }, "Error \xB7 Retry"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => pushToast({
        tone: 'warning',
        title: 'Removed from shortlist',
        undoSeconds: 8
      })
    }, "Warning \xB7 Undo"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => pushToast({
        tone: 'info',
        title: 'Agent queued',
        message: 'Shortlisting 312 postings…'
      })
    }, "Info"))), /*#__PURE__*/React.createElement(Grp, {
      label: "Banners",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 0
      }
    }, /*#__PURE__*/React.createElement(Banner, {
      tone: "amber",
      action: true,
      actionLabel: "Re-run"
    }, "Last sweep is 31h old \u2014 data may be stale."), /*#__PURE__*/React.createElement(Banner, {
      tone: "violet",
      action: true,
      actionLabel: "Details"
    }, "Agent running in degraded mode \u2014 using cached embeddings."), /*#__PURE__*/React.createElement(Banner, {
      tone: "red",
      action: true,
      actionLabel: "Retry"
    }, "Database unreachable. Showing your last cached results."))))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Loading, empty & error states",
      sub: "Skeletons shimmer phosphor. Errors always carry a recovery action and a plain-language cause \u2014 never a stack trace."
    }, /*#__PURE__*/React.createElement(Grp, {
      label: "Skeletons"
    }, /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      variant: "card"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      variant: "row"
    }), /*#__PURE__*/React.createElement(Skeleton, {
      variant: "row"
    })), /*#__PURE__*/React.createElement(Skeleton, {
      variant: "radar",
      width: 88,
      height: 88
    }))), /*#__PURE__*/React.createElement(Grp, {
      label: "Empty \xB7 error",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "panel"
    }, /*#__PURE__*/React.createElement(EmptyState, {
      title: "No roles yet",
      description: "Run a sweep to scan this month's \u201CWho is hiring\u201D thread.",
      action: "Run sweep",
      actionIcon: "play"
    })), /*#__PURE__*/React.createElement("div", {
      className: "panel"
    }, /*#__PURE__*/React.createElement(ErrorState, {
      cause: "Couldn't reach the database",
      detail: "We'll keep retrying in the background.",
      onRetry: () => pushToast({
        tone: 'info',
        title: 'Retrying…'
      })
    }))))), /*#__PURE__*/React.createElement(Section, {
      label: "Components",
      title: "Overlays",
      sub: "Modal, destructive confirm, drawer, dropdown menu, tooltip, and the \u2318K command palette. Esc closes; focus is trapped and returned."
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: "command",
      onClick: () => setPalette(true)
    }, "Command palette"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: "settings",
      onClick: () => setModal(true)
    }, "Modal"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      onClick: () => setConfirm(true)
    }, "Confirm destructive"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: "list",
      onClick: () => setDrawer(true)
    }, "Drawer"), /*#__PURE__*/React.createElement(Menu, {
      trigger: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        iconRight: "chevron-down"
      }, "Row actions"),
      items: [{
        label: 'Open posting',
        icon: 'external-link',
        shortcut: '↵'
      }, {
        label: 'Copy link',
        icon: 'copy'
      }, {
        label: 'Save to shortlist',
        icon: 'bookmark'
      }, {
        divider: true
      }, {
        label: 'Discard',
        icon: 'close',
        danger: true
      }]
    }), /*#__PURE__*/React.createElement(Tooltip, {
      label: "06:00 UTC daily"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--mono-sm)',
        color: 'var(--text-mid)',
        borderBottom: '1px dotted var(--text-low)',
        cursor: 'help'
      }
    }, "LAST SWEEP")))), /*#__PURE__*/React.createElement(Modal, {
      open: modal,
      onClose: () => setModal(false),
      title: "Sweep settings",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setModal(false)
      }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        onClick: () => {
          setModal(false);
          pushToast({
            tone: 'success',
            title: 'Settings saved'
          });
        }
      }, "Save"))
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        font: 'var(--text-sm)',
        color: 'var(--text-body)'
      }
    }, "Configure when the radar scans new postings and how aggressively the agent shortlists."), /*#__PURE__*/React.createElement(RangeSlider, {
      value: sal,
      onChange: e => setSal(+e.target.value),
      min: 80,
      max: 400,
      step: 5,
      label: "Minimum base salary",
      format: v => '$' + v + 'K'
    }), /*#__PURE__*/React.createElement(Toggle, {
      checked: remote,
      onChange: setRemote,
      label: "Remote roles only"
    }))), /*#__PURE__*/React.createElement(ConfirmModal, {
      open: confirm,
      onCancel: () => setConfirm(false),
      onConfirm: () => {
        setConfirm(false);
        pushToast({
          tone: 'success',
          title: 'Discarded 2 dead letters'
        });
      },
      title: "Discard 2 dead letters?",
      message: "These failed ingestion items will be permanently removed from the queue.",
      confirmLabel: "Discard"
    }), /*#__PURE__*/React.createElement(Drawer, {
      open: drawer,
      onClose: () => setDrawer(false),
      title: "Cortex Labs \xB7 Staff Engineer",
      footer: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "bookmark",
        onClick: () => setDrawer(false)
      }, "Save to shortlist")
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(ScoreGauge, {
      score: 92,
      size: 64,
      label: "Match"
    }), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--mono-base)',
        color: 'var(--phosphor)'
      }
    }, "$210\u2013250K"), /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: "REMOTE"
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "VISA"
    })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Agent reasoning"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '8px 0 0',
        font: 'var(--text-sm)',
        color: 'var(--text-body)'
      }
    }, "Strong overlap on Rust + distributed systems. Compensation above your $180K floor. Remote-friendly with visa support.")))), /*#__PURE__*/React.createElement(CommandPalette, {
      open: palette,
      onClose: () => setPalette(false),
      onSelect: () => setPalette(false),
      onSearchFallback: () => setPalette(false),
      groups: [{
        label: 'Actions',
        items: [{
          id: 'run',
          label: 'Run sweep now',
          icon: 'play',
          hint: '⌘↵'
        }, {
          id: 'agent',
          label: 'Ask agent to shortlist',
          icon: 'bot'
        }, {
          id: 'export',
          label: 'Export shortlist',
          icon: 'external-link'
        }]
      }, {
        label: 'Navigate',
        items: [{
          id: 'feed',
          label: 'Open signal feed',
          icon: 'list',
          hint: 'G F'
        }, {
          id: 'saved',
          label: 'Saved roles',
          icon: 'bookmark',
          hint: 'G S'
        }, {
          id: 'settings',
          label: 'Settings',
          icon: 'settings',
          hint: 'G ,'
        }]
      }]
    }), ReactDOM.createPortal(toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
      key: t.id,
      tone: t.tone,
      title: t.title,
      message: t.message,
      action: t.action,
      undoSeconds: t.undoSeconds,
      onClose: () => setToasts(ts => ts.filter(x => x.id !== t.id))
    })), document.getElementById('toaststack')));
  }
  ReactDOM.createRoot(document.getElementById('app')).render(/*#__PURE__*/React.createElement(App, null));
} // end if (NS)
})(); } catch (e) { __ds_ns.__errors.push({ path: "styleguide.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hiring-radar/MissionControl.jsx
try { (() => {
const MNS = window.HiringRadarDesignSystem_e283cd;
const {
  Button,
  IconButton,
  Icon,
  Kbd,
  SectionLabel,
  Card,
  SearchInput,
  SegmentedControl,
  Tabs,
  Tag,
  StatusBadge,
  ScoreGauge,
  Scorecard,
  Toast,
  Banner,
  Drawer,
  CommandPalette,
  Menu,
  ProgressLine,
  Tooltip
} = MNS;
const POSTINGS = [{
  id: 'cortex',
  company: 'Cortex Labs',
  role: 'Staff Systems Engineer',
  salary: '$210–250K',
  location: 'Remote (US)',
  tags: ['Rust', 'Postgres', 'k8s'],
  badges: ['NEW', 'REMOTE', 'VISA'],
  score: 92,
  x: 64,
  y: 32,
  ai: false,
  why: 'Strong overlap on Rust + distributed systems. Comp above your $180K floor. Remote-friendly with visa support.'
}, {
  id: 'helio',
  company: 'Helio',
  role: 'Senior Backend Engineer',
  salary: '$180–220K',
  location: 'NYC · Hybrid',
  tags: ['Go', 'gRPC', 'Kafka'],
  badges: ['NEW', 'HYBRID'],
  score: 78,
  x: 40,
  y: 58,
  ai: true,
  why: 'Go + event-streaming match your recent work. Hybrid in NYC — confirm your location preference.'
}, {
  id: 'drift',
  company: 'Driftwood',
  role: 'Platform Engineer',
  salary: '$160–190K',
  location: 'Remote (EU)',
  tags: ['Python', 'AWS', 'Terraform'],
  badges: ['REMOTE'],
  score: 61,
  x: 30,
  y: 36,
  ai: false,
  why: 'Infra-heavy. Comp slightly below target; EU timezone overlaps partially.',
  stale: true
}, {
  id: 'lumen',
  company: 'Lumen Systems',
  role: 'Senior SRE',
  salary: '$190–230K',
  location: 'Remote (Global)',
  tags: ['Go', 'Prometheus', 'k8s'],
  badges: ['REMOTE', 'VISA'],
  score: 71,
  x: 72,
  y: 64,
  ai: true,
  why: 'Reliability focus aligns with your on-call experience. Global remote is a plus.'
}, {
  id: 'arbor',
  company: 'Arbor',
  role: 'Backend Engineer',
  salary: '$150–180K',
  location: 'Austin · Onsite',
  tags: ['Node', 'GraphQL'],
  badges: ['ONSITE'],
  score: 38,
  x: 52,
  y: 22,
  ai: false,
  why: 'Onsite in Austin conflicts with your remote preference; stack is a partial match.'
}];
function NavItem({
  icon,
  label,
  count,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '8px 10px',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      borderRadius: 'var(--radius-control)',
      background: active ? 'var(--phosphor-12)' : hover ? 'rgba(147,164,179,0.07)' : 'transparent',
      color: active ? 'var(--phosphor)' : 'var(--text-body)',
      borderLeft: active ? '2px solid var(--phosphor)' : '2px solid transparent',
      font: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, label), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: active ? 'var(--phosphor)' : 'var(--text-low-content)'
    }
  }, count));
}
function MissionControl() {
  const [q, setQ] = React.useState('');
  const [mode, setMode] = React.useState('hybrid');
  const [tab, setTab] = React.useState('new');
  const [nav, setNav] = React.useState('feed');
  const [sel, setSel] = React.useState(null);
  const [saved, setSaved] = React.useState({
    cortex: true
  });
  const [palette, setPalette] = React.useState(false);
  const [banner, setBanner] = React.useState(true);
  const [sweeping, setSweeping] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  function pushToast(t) {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, {
      ...t,
      id
    }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5000);
  }
  function runSweep() {
    setSweeping(true);
    setTimeout(() => {
      setSweeping(false);
      pushToast({
        tone: 'success',
        title: 'Sweep complete',
        message: '5 new roles ingested.'
      });
    }, 2600);
  }
  const filtered = POSTINGS.filter(p => !q || (p.company + p.role + p.tags.join(' ')).toLowerCase().includes(q.toLowerCase()));
  const selected = POSTINGS.find(p => p.id === sel);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 18px',
      height: 'var(--topbar-h)',
      flexShrink: 0,
      background: 'var(--glass)',
      backdropFilter: 'blur(var(--blur-glass))',
      WebkitBackdropFilter: 'blur(var(--blur-glass))',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo.svg",
    alt: "Hiring Radar",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 460,
      marginLeft: 8
    }
  }, /*#__PURE__*/React.createElement(SearchInput, {
    value: q,
    onChange: e => setQ(e.target.value),
    onClear: () => setQ(''),
    placeholder: "scan postings\u2026"
  })), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    value: mode,
    onChange: setMode,
    options: [{
      value: 'semantic',
      label: 'Sem',
      icon: 'bot'
    }, {
      value: 'keyword',
      label: 'Key',
      icon: 'search'
    }, {
      value: 'hybrid',
      label: 'Hybrid',
      icon: 'zap'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Scans the latest \u201CWho is hiring\u201D thread"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    iconLeft: sweeping ? undefined : 'play',
    loading: sweeping,
    onClick: runSweep
  }, sweeping ? 'Sweeping' : 'Run sweep')), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Alerts"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-control)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: '600 11px/1 var(--font-mono)',
      color: 'var(--phosphor)'
    }
  }, "NM")), banner && /*#__PURE__*/React.createElement(Banner, {
    tone: "amber",
    action: true,
    actionLabel: "Re-run",
    onClose: () => setBanner(false)
  }, "Last sweep is 31h old \u2014 data may be stale."), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'var(--sidebar-w) 1fr 320px',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      borderRight: '1px solid var(--divider)',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 10px 10px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Navigation")), /*#__PURE__*/React.createElement(NavItem, {
    icon: "list",
    label: "Signal feed",
    count: 312,
    active: nav === 'feed',
    onClick: () => setNav('feed')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: "bookmark",
    label: "Saved",
    count: Object.values(saved).filter(Boolean).length,
    active: nav === 'saved',
    onClick: () => setNav('saved')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: "bot",
    label: "Agent runs",
    count: 4,
    active: nav === 'agent',
    onClick: () => setNav('agent')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: "database",
    label: "Sources",
    active: nav === 'sources',
    onClick: () => setNav('sources')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--bg-raised)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    icon: "signal",
    tone: "phosphor"
  }, "Pipeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--mono-sm)',
      color: 'var(--text-mid)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Ingested"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-hi)'
    }
  }, "312")), /*#__PURE__*/React.createElement(ProgressLine, {
    value: sweeping ? undefined : 100,
    indeterminate: sweeping
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--mono-sm)',
      color: 'var(--text-mid)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Agent matched"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--violet)'
    }
  }, "47")), /*#__PURE__*/React.createElement(ProgressLine, {
    value: 47 / 312 * 100,
    tone: "violet"
  }))), /*#__PURE__*/React.createElement(NavItem, {
    icon: "settings",
    label: "Settings",
    active: nav === 'settings',
    onClick: () => setNav('settings')
  })), /*#__PURE__*/React.createElement("main", {
    style: {
      overflow: 'auto',
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Scorecard, {
    label: "New roles",
    value: 47,
    delta: 12,
    spark: [3, 5, 4, 7, 6, 9, 8, 12]
  }), /*#__PURE__*/React.createElement(Scorecard, {
    label: "Avg match",
    value: 71,
    suffix: "/100",
    tone: "violet",
    spark: [60, 62, 58, 66, 70, 68, 71]
  }), /*#__PURE__*/React.createElement(Scorecard, {
    label: "Shortlisted",
    value: 9,
    tone: "cyan",
    spark: [2, 3, 3, 5, 6, 7, 9]
  }), /*#__PURE__*/React.createElement(Scorecard, {
    label: "Applied",
    value: 3,
    spark: [0, 1, 1, 2, 2, 3, 3]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'all',
      label: 'All',
      count: 312
    }, {
      value: 'new',
      label: 'New',
      count: 47
    }, {
      value: 'saved',
      label: 'Saved',
      count: 9
    }, {
      value: 'applied',
      label: 'Applied',
      count: 3
    }]
  }), /*#__PURE__*/React.createElement(Menu, {
    align: "right",
    trigger: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconLeft: "filter",
      iconRight: "chevron-down"
    }, "Sort"),
    items: [{
      label: 'Match score',
      icon: 'check'
    }, {
      label: 'Salary',
      icon: 'arrow-right'
    }, {
      label: 'Newest',
      icon: 'clock'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, filtered.map(p => /*#__PURE__*/React.createElement(JobRowLite, {
    key: p.id,
    p: p,
    selected: sel === p.id,
    bookmarked: !!saved[p.id],
    onSelect: () => setSel(p.id),
    onBookmark: () => setSaved(s => ({
      ...s,
      [p.id]: !s[p.id]
    }))
  })))), /*#__PURE__*/React.createElement("aside", {
    style: {
      borderLeft: '1px solid var(--divider)',
      padding: 18,
      overflow: 'auto',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    tone: "phosphor",
    icon: "radar"
  }, "Live scope"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, "06:00 UTC")), /*#__PURE__*/React.createElement(RadarScope, {
    size: 232,
    blips: POSTINGS.map(p => ({
      x: p.x,
      y: p.y,
      ai: p.ai
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "flush",
    padding: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    icon: "bot",
    tone: "violet"
  }, "Agent status"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: "RUNNING"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, "Shortlisting 312 postings")), /*#__PURE__*/React.createElement(ProgressLine, {
    indeterminate: true,
    tone: "violet"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, "NEXT SWEEP"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-sm)',
      color: 'var(--text-mid)'
    }
  }, "in 5h 12m \xB7 CRON"))))), /*#__PURE__*/React.createElement(Drawer, {
    open: !!selected,
    onClose: () => setSel(null),
    title: selected ? `${selected.company} · ${selected.role}` : '',
    footer: selected && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "external-link"
    }, "Open thread"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: "bookmark",
      onClick: () => {
        setSaved(s => ({
          ...s,
          [selected.id]: true
        }));
        pushToast({
          tone: 'success',
          title: 'Saved to shortlist'
        });
        setSel(null);
      }
    }, "Save to shortlist"))
  }, selected && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(ScoreGauge, {
    score: selected.score,
    size: 72,
    label: "Match"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--mono-lg)',
      color: 'var(--phosphor)'
    }
  }, selected.salary), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: 'var(--mono-sm)',
      color: 'var(--text-low-content)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 13
  }), selected.location), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, selected.badges.map(b => /*#__PURE__*/React.createElement(StatusBadge, {
    key: b,
    status: b
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
    icon: "bot",
    tone: "violet"
  }, "Why the agent surfaced this"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      font: 'var(--text-base)',
      color: 'var(--text-body)'
    }
  }, selected.why)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Stack"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 10
    }
  }, selected.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t)))))), /*#__PURE__*/React.createElement(CommandPalette, {
    open: palette,
    onClose: () => setPalette(false),
    onSelect: it => {
      setPalette(false);
      if (it.id === 'run') runSweep();
    },
    onSearchFallback: () => setPalette(false),
    groups: [{
      label: 'Actions',
      items: [{
        id: 'run',
        label: 'Run sweep now',
        icon: 'play',
        hint: '⌘↵'
      }, {
        id: 'agent',
        label: 'Ask agent to shortlist',
        icon: 'bot'
      }, {
        id: 'export',
        label: 'Export shortlist',
        icon: 'external-link'
      }]
    }, {
      label: 'Navigate',
      items: [{
        id: 'feed',
        label: 'Open signal feed',
        icon: 'list',
        hint: 'G F'
      }, {
        id: 'saved',
        label: 'Saved roles',
        icon: 'bookmark',
        hint: 'G S'
      }, {
        id: 'settings',
        label: 'Settings',
        icon: 'settings'
      }]
    }]
  }), ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 20,
      bottom: 20,
      zIndex: 'var(--z-toast)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
    key: t.id,
    tone: t.tone,
    title: t.title,
    message: t.message,
    onClose: () => setToasts(ts => ts.filter(x => x.id !== t.id))
  }))), document.body));
}

// Local lite row using the bundled JobRow
function JobRowLite({
  p,
  selected,
  bookmarked,
  onSelect,
  onBookmark
}) {
  return /*#__PURE__*/React.createElement(MNS.JobRow, {
    company: p.company,
    role: p.role,
    salary: p.salary,
    location: p.location,
    tags: p.tags,
    badges: p.badges,
    score: p.score,
    selected: selected,
    stale: p.stale,
    bookmarked: bookmarked,
    onSelect: onSelect,
    onBookmark: onBookmark
  });
}
ReactDOM.createRoot(document.getElementById('app')).render(/*#__PURE__*/React.createElement(MissionControl, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hiring-radar/MissionControl.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hiring-radar/RadarScope.jsx
try { (() => {
// RadarScope — the live radar panel: rings, conic sweep, plotted blips.
function RadarScope({
  size = 200,
  blips = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(61,255,162,0.06), transparent 70%)'
    }
  }), [0, 0.2, 0.4].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      inset: size * f,
      borderRadius: '50%',
      border: '1px solid var(--phosphor-dim)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 0,
      bottom: 0,
      width: 1,
      background: 'var(--phosphor-dim)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: 1,
      background: 'var(--phosphor-dim)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hr-sweep",
    style: {
      position: 'absolute',
      inset: 0,
      background: 'conic-gradient(from 0deg, rgba(61,255,162,0.4) 0deg, rgba(61,255,162,0.08) 26deg, transparent 60deg)'
    }
  })), blips.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      left: `${b.x}%`,
      top: `${b.y}%`,
      width: 8,
      height: 8,
      marginLeft: -4,
      marginTop: -4,
      borderRadius: '50%',
      background: b.ai ? 'var(--violet)' : 'var(--phosphor)',
      boxShadow: b.ai ? 'var(--glow-violet)' : 'var(--glow-phosphor-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hr-ping",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: b.ai ? 'var(--violet)' : 'var(--phosphor)',
      animationDelay: `${i * 0.4}s`
    }
  }))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes hr-sweep { to { transform: rotate(360deg); } }
        .hr-sweep { animation: hr-sweep 4s linear infinite; }
        @keyframes hr-ping2 { 0%{transform:scale(1);opacity:.7} 80%,100%{transform:scale(3);opacity:0} }
        .hr-ping { animation: hr-ping2 1.8s var(--ease-out) infinite; }
        @media (prefers-reduced-motion: reduce){ .hr-sweep,.hr-ping{ animation: none; } }
      `));
}
window.RadarScope = RadarScope;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hiring-radar/RadarScope.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ICON_PATHS = __ds_scope.ICON_PATHS;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.JobRow = __ds_scope.JobRow;

__ds_ns.MatchBadge = __ds_scope.MatchBadge;

__ds_ns.ScoreGauge = __ds_scope.ScoreGauge;

__ds_ns.Scorecard = __ds_scope.Scorecard;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.HRIllustration = __ds_scope.HRIllustration;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ErrorState = __ds_scope.ErrorState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RangeSlider = __ds_scope.RangeSlider;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.ProgressLine = __ds_scope.ProgressLine;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.ConfirmModal = __ds_scope.ConfirmModal;

__ds_ns.Drawer = __ds_scope.Drawer;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.Modal = __ds_scope.Modal;

})();
