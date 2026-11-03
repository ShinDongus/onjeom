// Registration needs HTTPS (or a local development origin). No user data is cached here.
if ("serviceWorker" in navigator && window.isSecureContext) {
  const worker = new URL(
    "./sw.js",
    document.currentScript?.src || location.href,
  );
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(worker).catch(() => {
      // The app still works online. Backup/export does not depend on the worker.
    });
  });
}
