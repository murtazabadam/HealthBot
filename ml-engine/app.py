from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import os, json

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')

# ── Load datasets ──────────────────────────────────────────────────────────────
print("Loading datasets...")
df         = pd.read_csv(os.path.join(DATA, 'dataset.csv'))
desc_df    = pd.read_csv(os.path.join(DATA, 'symptom_Description.csv'))
prec_df    = pd.read_csv(os.path.join(DATA, 'symptom_precaution.csv'))
sev_df     = pd.read_csv(os.path.join(DATA, 'Symptom-severity.csv'))

# ── Clean data ─────────────────────────────────────────────────────────────────
df.columns = df.columns.str.strip()
df = df.fillna('')
for col in df.columns:
    if col != 'Disease':
        df[col] = df[col].str.strip().str.replace(' ', '_').str.lower()

desc_df.columns  = desc_df.columns.str.strip()
prec_df.columns  = prec_df.columns.str.strip()
sev_df.columns   = sev_df.columns.str.strip()
sev_df['Symptom'] = sev_df['Symptom'].str.strip().str.replace(' ', '_').str.lower()

# ── Build symptom list & severity map ─────────────────────────────────────────
symptom_cols = [c for c in df.columns if c != 'Disease']
ALL_SYMPTOMS = sorted(set(
    s for col in symptom_cols for s in df[col].unique() if s != ''
))
SEVERITY_MAP = dict(zip(sev_df['Symptom'], sev_df['weight']))

# ── Build description & precaution maps ───────────────────────────────────────
DESC_MAP = {}
for _, row in desc_df.iterrows():
    DESC_MAP[row['Disease'].strip()] = row['Description'].strip()

PREC_MAP = {}
for _, row in prec_df.iterrows():
    disease = row['Disease'].strip()
    precs = [str(row.get(f'Precaution_{i}','')).strip()
             for i in range(1,5) if str(row.get(f'Precaution_{i}','')).strip()]
    PREC_MAP[disease] = precs

# ── Build feature matrix ───────────────────────────────────────────────────────
print("Building feature matrix...")
X, y = [], []
for _, row in df.iterrows():
    symptoms = set(row[col] for col in symptom_cols if row[col] != '')
    features = [1 if s in symptoms else 0 for s in ALL_SYMPTOMS]
    X.append(features)
    y.append(row['Disease'].strip())

X = np.array(X)
y = np.array(y)

# ── Train models ───────────────────────────────────────────────────────────────
print("Training models...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))

gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
gb_model.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb_model.predict(X_test))

print(f"Random Forest accuracy:      {rf_acc*100:.1f}%")
print(f"Gradient Boosting accuracy:  {gb_acc*100:.1f}%")
print(f"Loaded {len(ALL_SYMPTOMS)} symptoms | {len(set(y))} diseases")
print("ML Engine ready!")

# ── Severity scoring ───────────────────────────────────────────────────────────
def severity_score(symptoms):
    total = sum(SEVERITY_MAP.get(s, 3) for s in symptoms)
    avg   = total / max(len(symptoms), 1)
    if avg <= 2:   return "Mild",     1
    elif avg <= 4: return "Moderate", 2
    elif avg <= 6: return "Serious",  3
    else:          return "Severe",   4

def get_recommendation(level):
    return {
        1: "Rest at home, stay hydrated, and monitor your symptoms.",
        2: "Visit a clinic if symptoms persist beyond 2 days.",
        3: "Consult a doctor soon. Do not ignore these symptoms.",
        4: "Seek immediate medical attention!"
    }.get(level, "Please consult a healthcare professional.")

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "message": "HealthBot ML Engine running!",
        "diseases": len(set(y)),
        "symptoms": len(ALL_SYMPTOMS),
        "rf_accuracy": f"{rf_acc*100:.1f}%",
        "gb_accuracy": f"{gb_acc*100:.1f}%"
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({"symptoms": ALL_SYMPTOMS, "total": len(ALL_SYMPTOMS)})

@app.route('/diseases', methods=['GET'])
def get_diseases():
    return jsonify({"diseases": sorted(set(y)), "total": len(set(y))})

@app.route('/predict', methods=['POST'])
def predict():
    data     = request.get_json()
    symptoms = [s.strip().lower().replace(' ', '_') for s in data.get('symptoms', [])]

    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    # Match to known symptoms
    matched = [s for s in symptoms if s in ALL_SYMPTOMS]
    if not matched:
        return jsonify({
            "error": "No matching symptoms found",
            "hint":  "Use /symptoms to see all valid symptoms"
        }), 400

    # Build input vector
    vec = [1 if s in matched else 0 for s in ALL_SYMPTOMS]

    # Get predictions from both models
    rf_proba  = rf_model.predict_proba([vec])[0]
    gb_proba  = gb_model.predict_proba([vec])[0]
    classes   = rf_model.classes_

    # Ensemble average
    avg_proba = (rf_proba + gb_proba) / 2
    top_idx   = np.argsort(avg_proba)[::-1][:5]

    predictions = []
    for idx in top_idx:
        disease    = classes[idx]
        confidence = round(float(avg_proba[idx]) * 100, 1)
        if confidence < 1:
            continue
        predictions.append({
            "disease":     disease,
            "confidence":  confidence,
            "description": DESC_MAP.get(disease, ""),
            "precautions": PREC_MAP.get(disease, [])
        })

    severity_label, severity_level = severity_score(matched)

    return jsonify({
        "matched_symptoms": matched,
        "unmatched_symptoms": [s for s in symptoms if s not in ALL_SYMPTOMS],
        "predictions":     predictions,
        "severity":        severity_label,
        "severity_level":  severity_level,
        "recommendation":  get_recommendation(severity_level),
        "model_info": {
            "rf_accuracy":  f"{rf_acc*100:.1f}%",
            "gb_accuracy":  f"{gb_acc*100:.1f}%",
            "total_diseases": len(set(y)),
            "total_symptoms": len(ALL_SYMPTOMS)
        }
    })

@app.route('/disease/<name>', methods=['GET'])
def disease_info(name):
    matched = next((d for d in set(y) if d.lower() == name.lower()), None)
    if not matched:
        return jsonify({"error": "Disease not found"}), 404
    return jsonify({
        "disease":     matched,
        "description": DESC_MAP.get(matched, ""),
        "precautions": PREC_MAP.get(matched, [])
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)