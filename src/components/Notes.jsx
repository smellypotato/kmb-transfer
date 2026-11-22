import { FiExternalLink } from "react-icons/fi";

export function Notes() {
  return (
    <footer className="notes">
      <p>資料只供參考，請瀏覽九巴網頁以獲取最新資訊</p>
      <p>
        乘客用八達通卡或電子支付方式繳付第一程車資後，除個別符號之指定時間外，乘客可於指定時間內以同一張八達通卡或電子支付方式繳付第二程車資，享受巴士轉乘優惠。!代表「適用於塘尾道或以後乘搭2A線之乘客」。
      </p>
      <p>
        <a href="https://www.kmb.hk/interchange_condition.html" target="_blank" rel="noreferrer">
          請按此參閱八達通及電子支付巴士轉乘須知
          <FiExternalLink aria-hidden="true" />
        </a>
      </p>
    </footer>
  );
}
