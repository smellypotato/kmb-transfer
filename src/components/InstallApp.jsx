import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";

function standalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(standalone);
  const [iosHint, setIosHint] = useState(false);
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    function onPrompt(event) {
      event.preventDefault();
      setPrompt(event);
    }
    function onInstalled() {
      setInstalled(true);
      setPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  async function install() {
    if (!prompt) {
      setIosHint(true);
      return;
    }
    prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  return (
    <div className="install">
      <button type="button" onClick={install}>
        <FiDownload aria-hidden="true" />
        安裝應用程式
      </button>
      {iosHint && <p>請用 Safari 的分享按鈕，然後選擇「加入主畫面」。</p>}
    </div>
  );
}
