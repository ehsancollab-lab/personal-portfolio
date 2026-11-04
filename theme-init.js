// Apply the saved theme before styles paint; typography and images never wait on storage.
try { document.documentElement.dataset.theme = localStorage.getItem('ehsan-portfolio-theme') === 'dark' ? 'dark' : 'light'; } catch {}
try {
  const language = localStorage.getItem('ehsan-portfolio-language') === 'fa' ? 'fa' : 'en';
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  if (language === 'fa') {
    const font = document.createElement('link'); font.rel = 'preload'; font.as = 'font'; font.type = 'font/woff2'; font.crossOrigin = 'anonymous';
    font.href = new URL('./assets/fonts/On-Regular.woff2', document.baseURI).href;
    document.head.append(font);
  }
} catch {}
