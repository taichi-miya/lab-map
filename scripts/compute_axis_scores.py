import os
import json
import numpy as np
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# --- 軸定義文章 ---
AXIS_DEFINITIONS = {
    "x_minus": "基礎研究、真理の探求、学術的な知の深化、原理の解明",
    "x_plus":  "応用研究、社会実装、課題解決、実用化、産業への貢献",
    "y_minus":  "理論研究、数理モデル、計算機シミュレーション、数値解析",
    "y_plus": "実験、フィールドワーク、実証、観測、測定、試作",
}

def get_embedding(text):
    r = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return np.array(r.data[0].embedding)

def normalize(v):
    return v / np.linalg.norm(v)

# --- 軸ベクトルを計算 ---
print("軸ベクトルを計算中...")
e_x_minus = get_embedding(AXIS_DEFINITIONS["x_minus"])
e_x_plus  = get_embedding(AXIS_DEFINITIONS["x_plus"])
e_y_minus = get_embedding(AXIS_DEFINITIONS["y_minus"])
e_y_plus  = get_embedding(AXIS_DEFINITIONS["y_plus"])

axis_x_vec = normalize(e_x_plus - e_x_minus)   # 基礎↔応用
axis_y_vec = normalize(e_y_plus - e_y_minus)    # 理論↔実験

print("軸ベクトル計算完了")

# --- 全研究室のembeddingを取得 ---
print("研究室データ取得中...")
res = supabase.table("labs")\
    .select("id, name, embedding")\
    .not_.is_("embedding", "null")\
    .execute()

labs = res.data
print(f"{len(labs)}件取得")

# --- 射影してスコア計算 ---
success = 0
error = 0

for i, lab in enumerate(labs):
    try:
        vec = np.array(json.loads(lab["embedding"]))
        vec = normalize(vec)

        # 内積で射影スコアを計算
        score_x = float(np.dot(vec, axis_x_vec))
        score_y = float(np.dot(vec, axis_y_vec))

        supabase.table("labs")\
            .update({"axis_x": score_x, "axis_y": score_y})\
            .eq("id", lab["id"])\
            .execute()

        print(f"  [{i+1}/{len(labs)}] ✓ {lab['name']}: x={score_x:.4f}, y={score_y:.4f}")
        success += 1

    except Exception as e:
        print(f"  [{i+1}/{len(labs)}] ✗ エラー: {lab['name']} → {e}")
        error += 1

print(f"\n完了: 成功{success}件 / エラー{error}件")