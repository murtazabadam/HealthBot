import pandas as pd
import numpy as np
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')

print("Merging datasets...")

# ── Load primary dataset ───────────────────────────────────────────────────────
df1 = pd.read_csv(os.path.join(DATA, 'dataset.csv'))
df1.columns = df1.columns.str.strip()
df1 = df1.fillna('')
symptom_cols = [c for c in df1.columns if c != 'Disease']
for col in symptom_cols:
    df1[col] = df1[col].str.strip().str.replace(' ', '_').str.lower()

print(f"Dataset 1: {len(df1)} rows, {df1['Disease'].nunique()} diseases")

# ── Load dataset 2 if exists ───────────────────────────────────────────────────
training_path = os.path.join(DATA, 'Training.csv')
if os.path.exists(training_path):
    df2 = pd.read_csv(training_path)
    df2.columns = df2.columns.str.strip()
    if 'prognosis' in df2.columns:
        df2 = df2.rename(columns={'prognosis': 'Disease'})
    print(f"Dataset 2: {len(df2)} rows, {df2['Disease'].nunique()} diseases")
else:
    df2 = None
    print("Dataset 2 not found — skipping")

# ── Load dataset 3 if exists ───────────────────────────────────────────────────
symptom2disease_path = os.path.join(DATA, 'Symptom2Disease.csv')
if os.path.exists(symptom2disease_path):
    df3 = pd.read_csv(symptom2disease_path)
    df3.columns = df3.columns.str.strip()
    print(f"Dataset 3: {len(df3)} rows")
else:
    df3 = None
    print("Dataset 3 not found — skipping")

# ── Get all unique symptoms ────────────────────────────────────────────────────
all_symptoms = set()
for col in symptom_cols:
    all_symptoms.update(df1[col].unique())
all_symptoms.discard('')

if df2 is not None:
    sym_cols_2 = [c for c in df2.columns if c != 'Disease']
    for col in sym_cols_2:
        vals = df2[col].astype(str).str.strip().str.replace(' ', '_').str.lower()
        all_symptoms.update(vals[vals != ''])
        all_symptoms.update(vals[vals != 'nan'])

ALL_SYMPTOMS = sorted(all_symptoms - {'', 'nan'})
print(f"\nTotal unique symptoms: {len(ALL_SYMPTOMS)}")

# ── Build merged rows ──────────────────────────────────────────────────────────
rows = []

# From df1
for _, row in df1.iterrows():
    syms = set(row[col] for col in symptom_cols if row[col] != '')
    features = [1 if s in syms else 0 for s in ALL_SYMPTOMS]
    rows.append(features + [row['Disease'].strip()])

# From df2
if df2 is not None:
    sym_cols_2 = [c for c in df2.columns if c != 'Disease']
    for _, row in df2.iterrows():
        syms = set(
            str(row[col]).strip().replace(' ', '_').lower()
            for col in sym_cols_2
            if str(row[col]).strip() not in ['', 'nan', '0', '0.0']
        )
        if str(row.get('Disease', '')).strip():
            features = [1 if s in syms else 0 for s in ALL_SYMPTOMS]
            rows.append(features + [str(row['Disease']).strip()])

# ── Save merged dataset ────────────────────────────────────────────────────────
merged_df = pd.DataFrame(rows, columns=ALL_SYMPTOMS + ['Disease'])
merged_path = os.path.join(DATA, 'merged_dataset.csv')
merged_df.to_csv(merged_path, index=False)

print(f"\nMerged dataset saved!")
print(f"Total rows: {len(merged_df)}")
print(f"Total diseases: {merged_df['Disease'].nunique()}")
print(f"Total symptoms: {len(ALL_SYMPTOMS)}")
print(f"\nDiseases in merged dataset:")
for d in sorted(merged_df['Disease'].unique()):
    print(f"  - {d}")