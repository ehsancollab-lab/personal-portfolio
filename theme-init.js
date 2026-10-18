// Apply the saved theme before styles paint; typography and images never wait on storage.
try { document.documentElement.dataset.theme = localStorage.getItem('ehsan-portfolio-theme') === 'dark' ? 'dark' : 'light'; } catch {}
