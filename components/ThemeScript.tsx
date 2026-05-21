// Inline script that runs before paint. Brand default is DARK (Prometheus
// forge palette); only opt out if the user explicitly chose light.
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('jh-theme');if(t!=='light'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
