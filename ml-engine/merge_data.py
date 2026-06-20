"""
Proper dataset merge — combines binary symptom dataset (dataset.csv)
with text-based dataset (Symptom2Disease.csv) to create REAL variation
per disease instead of exact-duplicate rows.
"""
import pandas as pd
import re

# ── Load original binary dataset ───────────────────────────────────────────────
df1 = pd.read_csv('data/dataset.csv')
df1.columns = df1.columns.str.strip()
df1 = df1.fillna('')
symptom_cols = [c for c in df1.columns if c != 'Disease']
for col in symptom_cols:
    df1[col] = df1[col].str.strip().str.replace(' ', '_').str.lower()

ALL_SYMPTOMS = sorted(set(
    s for col in symptom_cols for s in df1[col].unique() if s != ''
))

rows = []
for _, row in df1.iterrows():
    syms = set(row[col] for col in symptom_cols if row[col] != '')
    rows.append({**{s: (1 if s in syms else 0) for s in ALL_SYMPTOMS},
                 'Disease': row['Disease'].strip()})

merged_df = pd.DataFrame(rows)
print(f"From dataset.csv: {len(merged_df)} rows")

# ── Load text-based dataset (Symptom2Disease.csv) and extract real variation ───
try:
    df2 = pd.read_csv('data/Symptom2Disease.csv')
    df2.columns = df2.columns.str.strip()

    # This dataset usually has columns like: label, text
    text_col = [c for c in df2.columns if 'text' in c.lower()][0]
    label_col = [c for c in df2.columns if 'label' in c.lower() or 'disease' in c.lower()][0]

    NL_MAP = {
        'fever': 'high_fever', 'cough': 'cough', 'headache': 'headache',
        'fatigue': 'fatigue', 'tired': 'fatigue', 'nausea': 'nausea',
        'vomit': 'vomiting', 'rash': 'skin_rash', 'itch': 'itching',
        'joint pain': 'joint_pain', 'pain in joint': 'joint_pain',
        'chills': 'chills', 'sweat': 'sweating', 'diarrhea': 'diarrhoea',
        'stomach': 'stomach_pain', 'breathless': 'breathlessness',
        'chest pain': 'chest_pain', 'weight loss': 'weight_loss',
        'dizziness': 'dizziness', 'yellow': 'yellowing_of_skin',
        # extend this with all your real NL_MAP entries
    }

    extra_rows = []
    for _, row in df2.iterrows():
        text = str(row[text_col]).lower()
        disease = str(row[label_col]).strip()
        found = set()
        for phrase, sym in NL_MAP.items():
            if phrase in text and sym in ALL_SYMPTOMS:
                found.add(sym)
        if len(found) >= 2:  # only keep rows with enough info
            extra_rows.append({**{s: (1 if s in found else 0) for s in ALL_SYMPTOMS},
                                'Disease': disease})

    extra_df = pd.DataFrame(extra_rows)
    print(f"From Symptom2Disease.csv (real variation): {len(extra_df)} rows")

    # Only keep rows for diseases that exist in main dataset (avoid label mismatch)
    extra_df = extra_df[extra_df['Disease'].isin(merged_df['Disease'].unique())]
    print(f"After filtering to matching diseases: {len(extra_df)} rows")

    final_df = pd.concat([merged_df, extra_df], ignore_index=True)
    final_df = final_df.drop_duplicates()  # remove exact dupes only
    print(f"\nFinal merged dataset: {len(final_df)} rows")

    # Check uniqueness improvement
    unique_patterns = final_df.drop(columns=['Disease']).drop_duplicates()
    print(f"Unique symptom patterns now: {len(unique_patterns)}")

    final_df.to_csv('data/merged_dataset_v2.csv', index=False)
    print("Saved as merged_dataset_v2.csv")

except FileNotFoundError:
    print("Symptom2Disease.csv not found — using fallback approach")

# ── SAFER augmentation: dropout only, never add wrong symptoms ─────────────────
import random

def safe_dropout_augment(X, y, dropout_rate=0.2, copies=2):
    """
    Only REMOVES symptoms (simulates patient forgetting to mention something).
    NEVER adds a symptom that wasn't already true.
    This cannot create medically impossible combinations like
    'headache + paralysis' because paralysis is never artificially added.
    """
    X_aug, y_aug = list(X), list(y)
    rng = random.Random(42)
    for i in range(len(X)):
        active_idx = [j for j, v in enumerate(X[i]) if v == 1]
        if len(active_idx) <= 2:
            continue  # don't drop from already-sparse rows
        for _ in range(copies):
            noisy = X[i].copy()
            for j in active_idx:
                if rng.random() < dropout_rate:
                    noisy[j] = 0  # remove this symptom only
            X_aug.append(noisy)
            y_aug.append(y[i])
    return X_aug, y_aug
