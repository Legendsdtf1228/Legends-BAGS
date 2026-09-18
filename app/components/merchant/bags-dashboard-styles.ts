/** Presentation only. Existing routes, form actions and data remain authoritative. */
export const bagsDashboardRefreshCss = `
.bags-admin-shell{background:#f6f7f9;line-height:1.5}
.bags-admin-shell *{box-sizing:border-box}
.bags-admin-sidebar{box-shadow:none}
.bags-admin-brand{padding:18px 16px;gap:12px;min-height:76px}
.bags-admin-brand-text strong{font-size:9px;letter-spacing:.14em}
.bags-admin-brand-text span{font-size:17px;font-weight:800;letter-spacing:-.3px;margin-top:3px}
.bags-admin-nav{padding:10px;scrollbar-width:thin}
.bags-admin-nav-group{margin-bottom:18px}
.bags-admin-nav-label{font-size:9px;letter-spacing:.14em;padding:8px 12px}
.bags-admin-nav-link{padding:9px 12px;margin-bottom:3px;font-size:12px;font-weight:500;border-radius:7px;gap:11px}
.bags-admin-nav-link.active{background:var(--bags-accent-soft);border-color:var(--bags-accent-soft);color:#9a3412;box-shadow:none;font-weight:700}
.bags-admin-sidebar-foot{padding:14px 16px;margin-top:auto}
.bags-shop-label{display:block;font-size:9px;letter-spacing:.12em;color:var(--bags-sidebar-muted);margin-bottom:5px}
.bags-shop-name{font-size:11px;color:#e1e7ee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bags-collapse-toggle{background:transparent;border:0;border-top:1px solid var(--bags-sidebar-border);color:var(--bags-sidebar-text);display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;width:100%;font:inherit;font-size:11px;cursor:pointer}
.bags-collapse-toggle:hover{background:#243044}
.bags-admin-main{background:#f6f7f9;position:relative}
.bags-admin-topbar{min-height:76px;padding:18px 28px;gap:16px;box-shadow:none}
.bags-admin-topbar h1{font-size:22px;font-weight:800;letter-spacing:-.6px}
.bags-admin-topbar p{font-size:12px;margin-top:4px}
.bags-admin-page-body{padding:24px 28px 36px}
.bags-admin-section-header,.bags-dashboard-section-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap}
.bags-admin-section-header h2,.bags-dashboard-section-heading h2{font-size:16px;margin:0;font-weight:700;letter-spacing:-.2px}
.bags-admin-section-header p,.bags-dashboard-section-heading p{font-size:12px;margin:4px 0 0;color:var(--bags-text-muted)}
.bags-admin-date-range{display:flex;flex-wrap:wrap;gap:3px;padding:4px;background:#e9edf2;border:1px solid #e2e6ec;border-radius:9px}
.bags-admin-date-range .bags-admin-btn{min-height:30px;padding:0 10px;font-size:11px;border:0;background:transparent;box-shadow:none;color:#596579}
.bags-admin-date-range .bags-admin-btn.primary,.bags-admin-date-range .bags-admin-btn[aria-pressed=true]{background:#fff;color:#1f2937;box-shadow:0 1px 3px #18223018}
.bags-admin-card{border:1px solid #e3e7ed;border-radius:10px;box-shadow:0 2px 4px #17212e03;padding:18px}
.bags-admin-card h2{font-size:14px;margin-bottom:14px;letter-spacing:-.1px}
.bags-admin-grid.stats{gap:12px}
.bags-admin-stat{padding:18px;min-height:104px}
.bags-admin-stat::before{top:18px;bottom:18px;left:0;width:3px}
.bags-admin-stat strong{font-size:28px;font-weight:700;letter-spacing:-1px}
.bags-admin-stat span{font-size:10px;letter-spacing:.055em;margin-top:10px;color:#627086}
.bags-workflow-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.bags-workflow-grid>div{background:#f8fafc;border:1px solid #e8edf3;border-radius:8px;padding:12px 14px}
.bags-workflow-grid strong{display:block;font-size:20px;letter-spacing:-.4px}
.bags-workflow-grid span{font-size:11px}
.bags-admin-quick{gap:10px}
.bags-admin-quick>a{border-color:#e6e9ef;background:#fff;border-radius:8px;padding:16px}
.bags-admin-quick>a:hover{background:#fffbf7;border-color:#dfb799}
.bags-admin-quick strong{font-size:12px}
.bags-admin-quick span{font-size:11px;line-height:1.5}
.bags-admin-quick-icon{background:var(--bags-accent-soft);color:var(--bags-accent-dark);width:34px;height:34px;border-radius:9px}
.bags-admin-btn{font-weight:600;font-size:12px;min-height:36px}
.bags-admin-btn.primary{box-shadow:none}
.bags-admin-table th{padding:12px 14px;background:#f8f9fb;font-size:10px;color:#627086}
.bags-admin-table td{padding:14px;font-size:12px}
.bags-admin-table tbody tr:hover{background:#fcfcfd}
.bags-admin-table td a:not(.bags-admin-btn){color:#9c4211;text-underline-offset:3px}
.bags-admin-empty{padding:30px 18px;background:#fafbfc;border:1px dashed #dce2e9;border-radius:8px}
.bags-admin-pipeline-row{gap:16px;padding:5px 0;font-size:12px}
.bags-admin-pipeline-row>span{min-width:76px;color:#627086}
.bags-admin-shell :is(a,button,input,select):focus-visible{outline:3px solid #fb923c;outline-offset:3px}
.bags-admin-skip{position:fixed;left:12px;top:-80px;z-index:100;background:#fff;color:#111827;padding:12px 18px;border-radius:6px;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(16,24,40,.12)}
.bags-admin-skip:focus,.bags-admin-skip:focus-visible{top:12px}
.bags-admin-nav-backdrop{display:none}
@media(max-width:960px){
 .bags-admin-sidebar,.bags-admin-sidebar.is-collapsed{width:100%;height:auto}
 .bags-admin-brand{min-height:64px;padding:12px 16px}
 .bags-admin-sidebar-foot,.bags-collapse-toggle{display:none}
 .bags-admin-topbar{position:relative;min-height:80px;padding:18px 20px}
 .bags-admin-page-body{padding:18px 20px 28px}
 .bags-admin-nav-toggle{width:40px;height:40px}
 .bags-admin-nav-backdrop{display:block;position:absolute;inset:0;z-index:20;border:0;background:rgba(17,24,39,.4);cursor:pointer}
}
@media(max-width:640px){
 .bags-admin-page-body{padding:16px 14px 28px}
 .bags-admin-topbar{padding:16px 14px}
 .bags-admin-topbar h1{font-size:21px}
 .bags-admin-topbar>.bags-admin-actions{width:100%}
 .bags-admin-topbar>.bags-admin-actions a{flex:1;min-height:40px}
 .bags-admin-date-range{width:100%;justify-content:flex-start}
 .bags-admin-date-range .bags-admin-btn{flex:1 1 calc(33.33% - 4px);padding:0 6px;min-height:36px}
 .bags-admin-grid.stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .bags-admin-stat{padding:16px;min-height:100px}
 .bags-admin-stat strong{font-size:25px;overflow-wrap:anywhere}
 .bags-admin-card{padding:16px}
 .bags-admin-quick{grid-template-columns:1fr}
 .bags-workflow-grid{grid-template-columns:1fr}
 .bags-admin-table{min-width:540px}
}
@media(prefers-reduced-motion:reduce){.bags-admin-shell *{transition:none!important;scroll-behavior:auto!important}}
`;
