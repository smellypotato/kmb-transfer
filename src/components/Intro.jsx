import { useState } from "react";
import { Chevron } from "./Chevron.jsx";

export function Intro() {
  const [open, setOpen] = useState(false);

  return (
    <header className={open ? "intro is-open" : "intro"}>
      <h1>
        <button
          type="button"
          className="section-toggle"
          aria-expanded={open}
          aria-controls="intro-body"
          onClick={() => setOpen((current) => !current)}
        >
          <span>八達通及電子支付巴士轉乘計劃</span>
          <Chevron open={open} />
        </button>
      </h1>
      {open && (
        <div id="intro-body">
          <p>
            九巴的八達通及電子支付巴士轉乘計劃，為乘客提供第二程接駁巴士的車資折扣優惠，乘客以優惠車資接駁至目的地，更充份善用九巴龐大的巴士服務網絡。
          </p>
          <p>
            教學說明：乘客可先在「搜尋」一欄輸入首程乘搭的路線，再視乎路線方向，於首個或第二個選項列「第一程」中查閱第二程路線、建議轉乘地點和車資優惠。
          </p>
          <p>
            例子：乘客由油塘出發，前往葵盛（東），首程選擇先於油塘乘搭路線33前往荃灣西站，乘客可於「搜尋」一欄輸入33，再選擇首個項列，即「第一程乘搭33往荃灣西站，轉乘下列第二程路線」，可以查閱到前往葵盛（東）的路線為38，建議轉乘巴士站為黃大仙轉車站, 沙田坳道(D1)，並可享有$4.2車資優惠。
          </p>
        </div>
      )}
    </header>
  );
}
