// Inline script that runs before paint to prevent dark-mode flash.
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('jh-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
