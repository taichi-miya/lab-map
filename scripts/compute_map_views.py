from openai import OpenAI
from supabase import create_client
import numpy as np
import umap
from sklearn.cluster import KMeans

SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ"
OPENAI_API_KEY = "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"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# --- 座標正規化（全スコープ共通のスケールに合わせる） ---
COORD_W = 2720
COORD_H = 1920
COORD_PAD = 240

def normalize_coords(coords):
    x = coords[:, 0]
    y = coords[:, 1]
    if x.max() == x.min():
        x = np.zeros_like(x) + COORD_W / 2
    else:
        x = (x - x.min()) / (x.max() - x.min()) * COORD_W + COORD_PAD
    if y.max() == y.min():
        y = np.zeros_like(y) + COORD_H / 2
    else:
        y = (y - y.min()) / (y.max() - y.min()) * COORD_H + COORD_PAD
    return x, y

def compute_umap(embeddings, n_neighbors=None):
    n = len(embeddings)
    # 5件未満はUMAPが不安定なので等間隔配置
    if n < 5:
        coords = np.array([[i * 400.0, 0.0] for i in range(n)])
        return coords
    # n_neighbors は「サンプル数-1」以下かつ最低2
    nn = max(2, min(n_neighbors or 15, n - 1))
    try:
        reducer = umap.UMAP(
            n_components=2,
            random_state=42,
            n_neighbors=nn,
            min_dist=0.4
        )
        return reducer.fit_transform(np.array(embeddings))
    except Exception as e:
        print(f"  ⚠ UMAPエラー（{n}件）: {e} → 等間隔配置にフォールバック")
        # フォールバック: 円形に均等配置
        angles = np.linspace(0, 2 * np.pi, n, endpoint=False)
        coords = np.column_stack([np.cos(angles) * 500, np.sin(angles) * 500])
        return coords

def compute_clusters(coords, n):
    if n < 2:
        return [0] * len(coords)
    k = min(n, len(coords))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    return kmeans.fit_predict(coords).tolist()

# --- 全ラボのembeddingを取得 ---
print("ラボデータ取得中...")
res = supabase.table("labs").select(
    "id, name, summary_clean, summary_text"
).not_.is_("summary_clean", "null").execute()
all_labs = res.data
print(f"{len(all_labs)}件取得")

# コース情報取得
print("コース情報取得中...")
course_res = supabase.table("lab_courses").select("lab_id, undergraduate_dept, course").execute()
course_data = course_res.data

# 専攻情報取得（labsテーブルのdeptカラム）
dept_res = supabase.table("labs").select("id, dept").execute()
dept_map = {r["id"]: r["dept"] for r in dept_res.data if r["dept"]}

# --- embedding取得（OpenAI API） ---
print("embedding取得中...")
lab_embeddings = {}
for lab in all_labs:
    text = lab["summary_clean"] or lab["summary_text"]
    if not text:
        continue
    print(f"  embedding: {lab['name']}")
    r = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:2000]
    )
    lab_embeddings[lab["id"]] = r.data[0].embedding

print(f"embedding完了: {len(lab_embeddings)}件")

# --- スコープごとにUMAP計算してmap_viewsに保存 ---

def save_map_view(scope_type, scope_value, lab_ids, embeddings_list, cluster_count):
    if len(lab_ids) < 2:
        print(f"  スキップ（{len(lab_ids)}件以下）: {scope_value}")
        return

    print(f"  UMAP計算: {scope_type} / {scope_value} ({len(lab_ids)}件)")
    coords = compute_umap(embeddings_list)
    clusters = compute_clusters(coords, cluster_count)
    x_arr, y_arr = normalize_coords(coords)

    # 既存データ削除
    supabase.table("map_views").delete().eq("scope_type", scope_type).eq("scope_value", scope_value).execute()

    # 新規挿入
    rows = []
    for i, lab_id in enumerate(lab_ids):
        rows.append({
            "scope_type": scope_type,
            "scope_value": scope_value,
            "lab_id": lab_id,
            "view_x": float(x_arr[i]),
            "view_y": float(y_arr[i]),
            "cluster_id": int(clusters[i])
        })

    # 100件ずつinsert
    for i in range(0, len(rows), 100):
        supabase.table("map_views").insert(rows[i:i+100]).execute()

    print(f"  ✓ 保存完了: {len(rows)}件")

# =====================
# 1. 学科単位（undergraduate_dept）
# =====================
print("\n=== 学科単位で計算 ===")
dept_labs = {}
for c in course_data:
    d = c["undergraduate_dept"]
    if d not in dept_labs:
        dept_labs[d] = set()
    dept_labs[d].add(c["lab_id"])

for dept, lab_id_set in dept_labs.items():
    valid_ids = [lid for lid in lab_id_set if lid in lab_embeddings]
    embs = [lab_embeddings[lid] for lid in valid_ids]
    save_map_view("undergraduate_dept", dept, valid_ids, embs, cluster_count=min(4, len(valid_ids)))

# =====================
# 2. コース単位（course）
# =====================
print("\n=== コース単位で計算 ===")
course_labs = {}
for c in course_data:
    key = f"{c['undergraduate_dept']}::{c['course']}"
    if key not in course_labs:
        course_labs[key] = set()
    course_labs[key].add(c["lab_id"])

for key, lab_id_set in course_labs.items():
    valid_ids = [lid for lid in lab_id_set if lid in lab_embeddings]
    embs = [lab_embeddings[lid] for lid in valid_ids]
    save_map_view("course", key, valid_ids, embs, cluster_count=min(3, len(valid_ids)))

# =====================
# 3. 専攻単位（grad_dept = labsのdeptカラム）
# =====================
print("\n=== 専攻単位で計算 ===")
grad_dept_labs = {}
for lab_id, dept in dept_map.items():
    if dept not in grad_dept_labs:
        grad_dept_labs[dept] = []
    grad_dept_labs[dept].append(lab_id)

for dept, lab_id_list in grad_dept_labs.items():
    valid_ids = [lid for lid in lab_id_list if lid in lab_embeddings]
    embs = [lab_embeddings[lid] for lid in valid_ids]
    save_map_view("grad_dept", dept, valid_ids, embs, cluster_count=min(4, len(valid_ids)))

print("\n全スコープ計算完了！")