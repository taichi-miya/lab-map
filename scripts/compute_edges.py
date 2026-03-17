import os
import json
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("embeddingを取得中...")
res = supabase.table("labs").select("id, name, embedding").not_.is_("embedding", "null").execute()
labs = res.data
print(f"{len(labs)}件取得")

# embeddingをnp配列に変換
ids = [lab["id"] for lab in labs]
names = [lab["name"] for lab in labs]
vecs = np.array([json.loads(lab["embedding"]) for lab in labs])

# 正規化（コサイン類似度 = 内積）
norms = np.linalg.norm(vecs, axis=1, keepdims=True)
vecs_norm = vecs / norms

print("コサイン類似度を計算中...")
sim_matrix = vecs_norm @ vecs_norm.T  # (238, 238)

print("Top5エッジを抽出中...")
rows = []
for i in range(len(ids)):
    sims = sim_matrix[i].copy()
    sims[i] = -1  # 自分自身を除外

    top5_idx = np.argsort(sims)[::-1][:5]

    for j in top5_idx:
        a, b = ids[i], ids[j]
        if a > b:
            a, b = b, a
        rows.append({
            "from_lab_id": a,
            "to_lab_id": b,
            "weight": float(sims[j]),
            "type": "similarity",
        })

# 重複除去
unique_rows = list({(r["from_lab_id"], r["to_lab_id"]): r for r in rows}.values())
print(f"エッジ数: {len(unique_rows)}件")

# 既存データを削除
print("既存データを削除中...")
supabase.table("edges").delete().eq("type", "similarity").execute()

# 100件ずつinsert
print("保存中...")
for i in range(0, len(unique_rows), 100):
    supabase.table("edges").insert(unique_rows[i:i+100]).execute()
    print(f"  {min(i+100, len(unique_rows))}/{len(unique_rows)}件保存済み")

print("\n完了！")