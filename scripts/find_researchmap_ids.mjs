/**
 * find_researchmap_ids.mjs
 *
 * faculties テーブルの教員名で researchmap を検索し、
 * researchmap_id / rm_status を更新する。
 *
 * 使い方:
 *   node scripts/find_researchmap_ids.mjs             # pending のみ処理
 *   node scripts/find_researchmap_ids.mjs --force     # 全件再検索
 *   node scripts/find_researchmap_ids.mjs --dry-run   # DB更新なし・確認のみ
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL
  ?? "https://vyatwmsakptuyhnxlniv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ";

const AFFILIATION_KEYWORD = "東北大学";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================
// researchmap 検索API
// ============================
async function searchResearchmap(name) {
  const query = encodeURIComponent(name.trim());
  const url = `https://api.researchmap.jp/researchers?q=${query}&format=json&limit=5`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.items ?? [];
}

// ============================
// ja / en テキスト抽出ヘルパー
// ============================
function extractText(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field)) {
    const ja = field.find((f) => f["@language"] === "ja");
    const en = field.find((f) => f["@language"] === "en");
    return (ja ?? en)?.["@value"] ?? "";
  }
  return field["@value"] ?? "";
}

function getAffiliationText(candidate) {
  return (candidate.affiliations ?? [])
    .map((a) => extractText(a.affiliation))
    .join(" ");
}

function getFullName(candidate) {
  return [
    extractText(candidate.family_name),
    extractText(candidate.given_name),
  ]
    .filter(Boolean)
    .join(" ");
}

// ============================
// 候補をスコアリングして東北大を優先
// ============================
function scoreCandidates(candidates, targetName) {
  return candidates
    .map((c) => {
      let score = 0;
      const affText = getAffiliationText(c);
      if (affText.includes(AFFILIATION_KEYWORD)) score += 10;
      if (getFullName(c) === targetName) score += 5;
      return { ...c, _score: score, _affText: affText };
    })
    .sort((a, b) => b._score - a._score);
}

// ============================
// メイン処理
// ============================
async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes("--force");
  const isDryRun = args.includes("--dry-run");

  console.log(`モード: ${isDryRun ? "DRY RUN" : isForce ? "強制（全件）" : "pendingのみ"}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 対象を取得
  let query = supabase
    .from("faculties")
    .select("id, name, lab_id, researchmap_id, rm_status, labs(name)");

  if (!isForce) {
    query = query.eq("rm_status", "pending");
  }

  const { data: faculties, error } = await query;
  if (error) {
    console.error("❌ Supabase取得エラー:", error.message);
    process.exit(1);
  }

  console.log(`🔍 ${faculties.length}件の教員を検索します...\n`);

  let cntFound = 0, cntAmbiguous = 0, cntNotFound = 0, cntError = 0;

  for (const faculty of faculties) {
    const { id, name, labs: lab } = faculty;
    process.stdout.write(`  ${name}（${lab?.name ?? ""}）... `);

    let candidates;
    try {
      candidates = await searchResearchmap(name);
    } catch (e) {
      console.log(`❌ API エラー: ${e.message}`);
      if (!isDryRun) {
        await supabase
          .from("faculties")
          .update({ rm_status: "error", rm_fetched_at: new Date().toISOString() })
          .eq("id", id);
      }
      cntError++;
      await sleep(500);
      continue;
    }

    if (candidates.length === 0) {
      console.log("❌ 見つからず");
      if (!isDryRun) {
        await supabase
          .from("faculties")
          .update({ rm_status: "not_found", rm_fetched_at: new Date().toISOString() })
          .eq("id", id);
      }
      cntNotFound++;
      await sleep(400);
      continue;
    }

    const scored = scoreCandidates(candidates, name);
    const best = scored[0];
    const rmId = best.id ?? best.rm_id;
    const isTohoku = best._score >= 10;

    if (isTohoku) {
      // 自動確定
      console.log(`✅ ${rmId}（${best._affText.slice(0, 40)}）`);
      if (!isDryRun) {
        await supabase
          .from("faculties")
          .update({
            researchmap_id: rmId,
            rm_status: "found",
            rm_fetched_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
      cntFound++;
    } else {
      // 要確認：上位3候補をコンソールに表示し、DBには仮置きで ambiguous
      console.log(`⚠  要確認（${scored.length}件）`);
      scored.slice(0, 3).forEach((c, i) => {
        const cId = c.id ?? c.rm_id;
        console.log(
          `      [${i + 1}] https://researchmap.jp/${cId}  ${getFullName(c)} / ${c._affText.slice(0, 40)}`
        );
      });

      if (!isDryRun) {
        await supabase
          .from("faculties")
          .update({
            researchmap_id: rmId,   // スコア最高の候補を仮置き
            rm_status: "ambiguous", // 手動確認が必要なフラグ
            rm_fetched_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
      cntAmbiguous++;
    }

    await sleep(400);
  }

  // ===== サマリー =====
  console.log("\n" + "=".repeat(50));
  console.log(`✅ 自動確定: ${cntFound}件`);
  console.log(`⚠  要確認:   ${cntAmbiguous}件`);
  console.log(`❌ 未発見:   ${cntNotFound}件`);
  console.log(`💥 エラー:   ${cntError}件`);

  if (cntAmbiguous > 0 && !isDryRun) {
    console.log(`
💡 要確認の教員は Supabase の faculties テーブルで
   rm_status = 'ambiguous' の行を確認してください。
   正しい researchmap_id に書き換えて rm_status を 'found' にすれば完了です。
   → https://supabase.com/dashboard/project/vyatwmsakptuyhnxlniv/editor`);
  }
}

main();
