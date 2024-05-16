function startRecord() {
  const scriptEl = document.createElement('script');
  scriptEl.src = chrome.runtime.getURL('content/inject.js');
  document.documentElement.appendChild(scriptEl);
  scriptEl.onload = () => {
    document.documentElement.removeChild(scriptEl);
  };
}

startRecord();
