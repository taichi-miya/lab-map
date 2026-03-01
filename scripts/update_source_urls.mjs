import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SOURCE_URLS = [
  { name: "核融合・電磁工学分野", url: "https://web.tohoku.ac.jp/afre/research/research.html" },
  { name: "核融合プラズマ学分野", url: "https://web.tohoku.ac.jp/fusion/html_tains/intro.html" },
  { name: "高エネルギー物質工学分野", url: "https://www.qse.tohoku.ac.jp/lab/ase/" },
  { name: "核エネルギーフロー環境工学分野", url: "http://web.tohoku.ac.jp/michiru/research2020.html" },
  { name: "核エネルギーシステム安全工学分野", url: "http://www.takahashi.qse.tohoku.ac.jp/" },
  { name: "エネルギー物理工学教育分野", url: "https://www.qse.tohoku.ac.jp/lab/epee/frontline.html" },
  { name: "保全工学分野", url: "http://web.tohoku.ac.jp/watanabe/research/index.html" },
  { name: "信頼性計測学分野", url: "http://web.tohoku.ac.jp/yusa/index.php/research/" },
  { name: "加速器・原子炉システム工学分野", url: "http://web.tohoku.ac.jp/matsuyamalab/dynamitron/" },
  { name: "量子生体計測学分野", url: "https://web.tohoku.ac.jp/qbi/" },
  { name: "応用量子医工学分野", url: "http://web.tohoku.ac.jp/shidahara/index.html" },
  { name: "放射線高度利用分野", url: "https://www.qse.tohoku.ac.jp/lab/ara/" },
  { name: "核燃料科学分野", url: "https://www.qse.tohoku.ac.jp/lab/nfs/" },
  { name: "先進原子核工学分野", url: "https://www.qse.tohoku.ac.jp/lab/heme/" },
  { name: "材料照射工学分野", url: "https://www.qse.tohoku.ac.jp/lab/ientrm/" },
  { name: "原子力材料工学分野", url: "http://web.tohoku.ac.jp/imr-numat/research/" },
  { name: "量子機能材料工学分野", url: "https://www.qse.tohoku.ac.jp/lab/scer/" },
  { name: "アクチノイド物性工学分野", url: "https://actinide.imr.tohoku.ac.jp/styled/index.html" },
  { name: "放射化学分野", url: "https://www2.tagen.tohoku.ac.jp/lab/kirishima/%e7%a0%94%e7%a9%b6%e6%a6%82%e8%a6%81/" },
  { name: "加速器保健物理工学分野", url: "https://www.qse.tohoku.ac.jp/lab/ahp/" },
  { name: "核放射線物理工学分野", url: "https://inst.cyric.tohoku.ac.jp/terakawa-lab/" },
];

async function main() {
  for (const item of SOURCE_URLS) {
    const { error } = await supabase
      .from("labs")
      .update({ summary_source_url_override: item.url })
      .eq("name", item.name);

    if (error) console.error(`✗ ${item.name}:`, error.message);
    else console.log(`✓ ${item.name}`);
  }
  console.log("完了！");
}

main();