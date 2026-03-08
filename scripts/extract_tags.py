import re
from supabase import create_client
from collections import Counter

SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ"
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# =====================================================================
# 研究系キーワード辞書（拡充版）
# =====================================================================
KEYWORDS = [

    # --- 原子力・量子エネルギー ---
    "核融合", "プラズマ", "原子炉", "核分裂", "核燃料", "廃炉",
    "放射線", "放射性", "放射化学", "核医学", "中性子", "加速器",
    "レーザー", "照射", "被ばく", "廃棄物", "アクチノイド", "ウラン",
    "トリウム", "核セキュリティ", "原子力安全",

    # --- 材料・物性 ---
    "材料", "合金", "金属", "セラミックス", "高分子", "複合材料",
    "薄膜", "ナノ材料", "超伝導", "半導体", "磁性", "スピントロニクス",
    "腐食", "強度", "疲労", "破壊", "表面", "界面", "結晶",
    "アモルファス", "相変態", "熱処理", "塑性変形", "硬さ",
    "耐熱", "有機材料", "無機材料", "ハイブリッド材料",
    "誘電体", "圧電", "強誘電", "有機電子材料",

    # --- 機械・熱流体 ---
    "流体", "熱流体", "燃焼", "伝熱", "熱制御", "ターボ機械",
    "流体機械", "摩擦", "潤滑", "トライボロジー", "振動", "騒音",
    "弾性", "塑性", "破壊力学", "有限要素法", "流体力学",
    "乱流", "気液二相流", "マイクロ流体", "熱輸送", "熱伝導",
    "分子動力学", "ナノスケール", "地殻", "地圧",

    # --- ロボット・制御・AI ---
    "ロボット", "自律制御", "制御工学", "人工知能", "機械学習",
    "深層学習", "コンピュータビジョン", "画像認識", "自動化",
    "ドローン", "マニピュレータ", "ソフトロボット", "分子ロボット",

    # --- 電気・電子・情報 ---
    "電力", "パワーエレクトロニクス", "電力変換", "スマートグリッド",
    "再生可能エネルギー", "太陽電池", "蓄電池", "燃料電池",
    "半導体デバイス", "集積回路", "VLSI", "センサ", "アクチュエータ",
    "MEMS", "フォトニクス", "光通信", "無線通信", "信号処理",
    "電磁波", "アンテナ", "プラズモニクス", "量子デバイス",
    "スピン", "メモリ", "ストレージ",
    "モータ", "発電機", "風力発電", "洋上風力", "磁気ギヤ",
    "画像処理", "画像電子", "映像", "ディスプレイ", "液晶",
    "光ファイバ", "マルチコアファイバ", "中赤外", "光計測",
    "音声", "音響", "音声認識", "音声合成", "音楽情報処理",
    "自然言語処理", "ヒューマンインターフェース", "HCI",
    "通信方式", "無線", "移動通信", "5G", "6G",

    # --- コンピュータ・情報処理 ---
    "高性能計算", "並列計算", "HPC", "スーパーコンピュータ",
    "コンピュータアーキテクチャ", "プロセッサ", "GPU", "FPGA",
    "ネットワーク", "クラウド", "分散システム", "セキュリティ",
    "暗号", "データベース", "アルゴリズム", "プログラミング",

    # --- ナノテクノロジー・MEMS ---
    "ナノテクノロジー", "ナノ加工", "マイクロシステム",
    "ナノデバイス", "ナノ構造", "量子ナノ",

    # --- 化学・バイオ ---
    "触媒", "有機合成", "高分子化学", "電気化学", "光化学",
    "分子設計", "タンパク質", "酵素", "バイオマス", "発酵",
    "細胞", "遺伝子", "バイオセンサ", "ドラッグデリバリー",
    "生体材料", "組織工学", "超臨界", "分離精製", "反応工学",
    "化学プロセス", "グリーンケミストリー", "人工光合成",
    "生体膜", "生物物理", "水熱", "CO2", "カーボンニュートラル",
    "地域エネルギー", "エネルギー変換", "エネルギーシステム",

    # --- 土木・建築・都市 ---
    "構造", "コンクリート", "地盤", "地震", "津波", "防災",
    "災害", "橋梁", "トンネル", "インフラ", "維持管理",
    "都市計画", "交通", "水環境", "河川", "沿岸", "水処理",
    "廃水", "環境保全", "生態系", "建築", "空間設計",
    "構造設計", "構造解析",

    # --- 航空宇宙 ---
    "航空", "宇宙", "ロケット", "推進", "空力", "飛翔体",
    "衛星", "宇宙探査", "軽量構造", "複合材",

    # --- 計測・シミュレーション・共通 ---
    "計測", "センシング", "非破壊検査", "イメージング", "X線",
    "MRI", "PET", "超音波", "シミュレーション", "数値計算",
    "最適化", "データ駆動", "デジタルツイン", "IoT",
    "エネルギーハーベスティング", "環境", "安全", "リスク評価",
    "量子", "電磁", "イオン", "光", "レーザー",

    # --- 医工学 ---
    "医工学", "医療機器", "手術支援", "生体信号", "神経工学",
    "リハビリ", "義肢", "福祉工学", "生体力学", "血流",
    "血液", "生体電子", "脳波", "筋電",

    # --- 英語キーワード ---
    "fusion", "plasma", "neutron", "radiation", "reactor",
    "accelerator", "laser", "quantum", "magnetic", "imaging",
    "robotics", "AI", "machine learning", "deep learning",
    "semiconductor", "photonics", "antenna", "catalyst",
    "simulation", "optimization", "HPC", "MEMS", "IoT",
    "motor", "battery", "fuel cell", "solar",
]

def extract_tags(text, max_tags=8):
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for kw in KEYWORDS:
        if kw.lower() in text_lower:
            count = text_lower.count(kw.lower())
            found.append((kw, count))
    found.sort(key=lambda x: -x[1])
    return [kw for kw, _ in found[:max_tags]]

def main():
    res = supabase.table("labs").select("id, name, summary_text").not_.is_("summary_text", "null").execute()
    labs = res.data
    print(f"{len(labs)}件のタグを抽出します")
    for lab in labs:
        tags = extract_tags(lab["summary_text"])
        print(f"{lab['name']}: {tags}")
        supabase.table("lab_tags").delete().eq("lab_id", lab["id"]).execute()
        for tag in tags:
            supabase.table("lab_tags").insert({
                "lab_id": lab["id"],
                "tag": tag,
                "source": "auto"
            }).execute()
    print("完了！")

main()