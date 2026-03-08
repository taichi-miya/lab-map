import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from supabase import create_client
from sklearn.cluster import KMeans

matplotlib.rcParams['font.family'] = 'DejaVu Sans'

SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# DBからUMAP座標を取得
res = supabase.table("labs").select("id, name, map_x, map_y").not_.is_("map_x", "null").execute()
labs = res.data
print(f"{len(labs)}件の座標を取得しました")

coords = np.array([[lab["map_x"], lab["map_y"]] for lab in labs])

# エルボー法：k=2〜15で慣性（inertia）を計算
inertias = []
K_range = range(2, 16)
for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(coords)
    inertias.append(km.inertia_)
    print(f"k={k}: inertia={km.inertia_:.1f}")

# グラフ描画
plt.figure(figsize=(8, 5))
plt.plot(list(K_range), inertias, 'bo-', markersize=8)
plt.xlabel("Number of clusters (k)", fontsize=13)
plt.ylabel("Inertia", fontsize=13)
plt.title("Elbow Method - Optimal k for Lab Map", fontsize=14)
plt.xticks(list(K_range))
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("elbow.png", dpi=150)
print("\nelbow.png を保存しました。グラフを確認して最適なkを選んでください。")
print("折れ曲がり（elbow）が一番はっきりしているkが最適値です。")