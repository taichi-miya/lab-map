import re
from supabase import create_client
from collections import Counter

SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 研究系キーワード辞書（これに含まれる語をタグ候補にする）
KEYWORDS = [
    "核融合", "プラズマ", "レーザー", "中性子", "放射線", "核分裂",
    "原子炉", "加速器", "核燃料", "放射性", "照射", "材料",
    "量子", "エネルギー", "磁場", "電磁", "イオン", "電子",
    "計測", "診断", "センサー", "シミュレーション", "モデル",
    "安全", "リスク", "廃炉", "廃棄物", "環境", "被ばく",
    "医療", "治療", "イメージング", "PET", "MRI", "X線",
    "核医学", "放射化学", "アクチノイド", "ウラン", "トリウム",
    "超伝導", "半導体", "セラミックス", "合金", "腐食",
    "保全", "信頼性", "確率論", "リスク評価",
    "fusion", "plasma", "neutron", "radiation", "reactor",
    "accelerator", "laser", "quantum", "magnetic", "imaging",
]

def extract_tags(text, max_tags=8):
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for kw in KEYWORDS:
        if kw.lower() in text_lower:
            # 出現回数もカウント
            count = text_lower.count(kw.lower())
            found.append((kw, count))
    # 出現回数多い順にソートしてtop max_tags
    found.sort(key=lambda x: -x[1])
    return [kw for kw, _ in found[:max_tags]]

def main():
    res = supabase.table("labs").select("id, name, summary_text").not_.is_("summary_text", "null").execute()
    labs = res.data
    print(f"{len(labs)}件のタグを抽出します")

    for lab in labs:
        tags = extract_tags(lab["summary_text"])
        print(f"{lab['name']}: {tags}")

        # 既存タグを削除して入れ直す
        supabase.table("lab_tags").delete().eq("lab_id", lab["id"]).execute()
        for tag in tags:
            supabase.table("lab_tags").insert({
                "lab_id": lab["id"],
                "tag": tag,
                "source": "auto"
            }).execute()

    print("完了！")

main()