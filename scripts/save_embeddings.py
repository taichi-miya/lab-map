import os
import time
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

print("embeddingが未保存の研究室を取得中...")
res = supabase.table("labs")\
    .select("id, name, summary_text")\
    .is_("embedding", "null")\
    .execute()

labs = res.data
print(f"{len(labs)}件処理します")

success = 0
skip = 0
error = 0

for i, lab in enumerate(labs):
    text = lab.get("summary_text", "").strip()
    
    # summary_textが空の場合はスキップ
    if not text:
        print(f"  [{i+1}/{len(labs)}] スキップ（summary_text空）: {lab['name']}")
        skip += 1
        continue
    
    try:
        r = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:2000]
        )
        embedding = r.data[0].embedding
        
        supabase.table("labs")\
            .update({"embedding": embedding})\
            .eq("id", lab["id"])\
            .execute()
        
        print(f"  [{i+1}/{len(labs)}] ✓ {lab['name']}")
        success += 1
        
        # API負荷分散：10件ごとに少し待つ
        if success % 10 == 0:
            time.sleep(1)
            
    except Exception as e:
        print(f"  [{i+1}/{len(labs)}] ✗ エラー: {lab['name']} → {e}")
        error += 1
        time.sleep(2)  # エラー時は少し長めに待つ

print(f"\n完了: 成功{success}件 / スキップ{skip}件 / エラー{error}件")