import pandas as pd
import numpy as np
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')

print("Building dataset...")

# ── Load primary dataset ───────────────────────────────────────────────────────
df1 = pd.read_csv(os.path.join(DATA, 'dataset.csv'))
df1.columns = df1.columns.str.strip()
df1 = df1.fillna('')
symptom_cols = [c for c in df1.columns if c != 'Disease']
for col in symptom_cols:
    df1.loc[:, col] = df1[col].str.strip().str.replace(' ', '_').str.lower()

print(f"Dataset 1: {len(df1)} rows, {df1['Disease'].nunique()} diseases")

# Get all unique symptoms
all_symptoms = set()
for col in symptom_cols:
    all_symptoms.update(df1[col].unique())
all_symptoms.discard('')
ALL_SYMPTOMS = sorted(all_symptoms)

print(f"Total unique symptoms: {len(ALL_SYMPTOMS)}")

# Build feature matrix
rows = []
for _, row in df1.iterrows():
    syms = set(row[col] for col in symptom_cols if row[col] != '')
    features = [1 if s in syms else 0 for s in ALL_SYMPTOMS]
    rows.append(features + [row['Disease'].strip()])

merged_df = pd.DataFrame(rows, columns=ALL_SYMPTOMS + ['Disease'])

# ── Add augmented samples for better generalization ───────────────────────────
print("Augmenting data...")
augmented = []
for _, row in merged_df.iterrows():
    disease = row['Disease']
    features = row[ALL_SYMPTOMS].values.copy()
    # Create 2 augmented versions per row with slight noise
    for _ in range(2):
        noisy = features.copy()
        # Randomly drop 1-2 symptoms (10% chance each)
        for i in range(len(noisy)):
            if noisy[i] == 1 and np.random.random() < 0.10:
                noisy[i] = 0
        augmented.append(list(noisy) + [disease])

aug_df = pd.DataFrame(augmented, columns=ALL_SYMPTOMS + ['Disease'])
final_df = pd.concat([merged_df, aug_df], ignore_index=True)

# Save
merged_path = os.path.join(DATA, 'merged_dataset.csv')
final_df.to_csv(merged_path, index=False)

print(f"\nFinal dataset saved!")
print(f"Original rows: {len(merged_df)}")
print(f"Augmented rows: {len(aug_df)}")
print(f"Total rows: {len(final_df)}")
print(f"Total diseases: {final_df['Disease'].nunique()}")
print(f"Total symptoms: {len(ALL_SYMPTOMS)}")