from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
import os
import nltk

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)

from nlp_extractor import extract_symptoms_from_text, get_symptom_suggestions
from extra_diseases import EXTRA_DISEASES

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')

# ── Load datasets ──────────────────────────────────────────────────────────────
print("Loading datasets...")
df      = pd.read_csv(os.path.join(DATA, 'dataset.csv'))
desc_df = pd.read_csv(os.path.join(DATA, 'symptom_Description.csv'))
prec_df = pd.read_csv(os.path.join(DATA, 'symptom_precaution.csv'))
sev_df  = pd.read_csv(os.path.join(DATA, 'Symptom-severity.csv'))

# ── Clean data ─────────────────────────────────────────────────────────────────
df.columns = df.columns.str.strip()
df = df.fillna('')
symptom_cols = [c for c in df.columns if c != 'Disease']
for col in symptom_cols:
    df[col] = df[col].str.strip().str.replace(' ', '_').str.lower()

desc_df.columns = desc_df.columns.str.strip()
prec_df.columns = prec_df.columns.str.strip()
sev_df.columns  = sev_df.columns.str.strip()
sev_df['Symptom'] = sev_df['Symptom'].str.strip().str.replace(' ', '_').str.lower()

# ── Build symptom list & maps ──────────────────────────────────────────────────
ALL_SYMPTOMS = sorted(set(
    s for col in symptom_cols for s in df[col].unique() if s != ''
))
SEVERITY_MAP = dict(zip(sev_df['Symptom'], sev_df['weight']))

DESC_MAP, PREC_MAP = {}, {}
for _, row in desc_df.iterrows():
    DESC_MAP[row['Disease'].strip()] = row['Description'].strip()
for _, row in prec_df.iterrows():
    disease = row['Disease'].strip()
    precs = [str(row.get(f'Precaution_{i}', '')).strip()
             for i in range(1, 5)
             if str(row.get(f'Precaution_{i}', '')).strip()]
    PREC_MAP[disease] = precs

# Add extra diseases
for disease, info in EXTRA_DISEASES.items():
    DESC_MAP[disease] = info['description']
    PREC_MAP[disease] = info['precautions']
    for sym in info['symptoms']:
        if sym not in ALL_SYMPTOMS:
            ALL_SYMPTOMS.append(sym)
ALL_SYMPTOMS = sorted(set(ALL_SYMPTOMS))

# ── Build feature matrix ───────────────────────────────────────────────────────
print("Building feature matrix...")
X, y = [], []
for _, row in df.iterrows():
    symptoms = set(row[col] for col in symptom_cols if row[col] != '')
    features = [1 if s in symptoms else 0 for s in ALL_SYMPTOMS]
    X.append(features)
    y.append(row['Disease'].strip())

# Add extra disease samples
for disease, info in EXTRA_DISEASES.items():
    syms = set(info['symptoms'])
    features = [1 if s in syms else 0 for s in ALL_SYMPTOMS]
    for _ in range(20):
        noisy = features.copy()
        for i in range(len(noisy)):
            if noisy[i] == 0 and np.random.random() < 0.03:
                noisy[i] = 1
        X.append(noisy)
        y.append(disease)

X = np.array(X)
y = np.array(y)

# ── Train optimized models ─────────────────────────────────────────────────────
print("Training optimized ensemble models...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Model 1 — Random Forest (best for tabular medical data)
rf_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    n_jobs=-1
)

# Model 2 — Gradient Boosting (sequential learning)
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    learning_rate=0.1,
    max_depth=5,
    random_state=42
)

# Model 3 — SVM (good for high-dimensional data)
svm_model = SVC(
    kernel='rbf',
    probability=True,
    random_state=42,
    C=10
)

rf_model.fit(X_train, y_train)
gb_model.fit(X_train, y_train)
svm_model.fit(X_train, y_train)

rf_acc  = accuracy_score(y_test, rf_model.predict(X_test))
gb_acc  = accuracy_score(y_test, gb_model.predict(X_test))
svm_acc = accuracy_score(y_test, svm_model.predict(X_test))
cv_scores = cross_val_score(rf_model, X, y, cv=5)

print(f"Random Forest accuracy:      {rf_acc*100:.1f}%")
print(f"Gradient Boosting accuracy:  {gb_acc*100:.1f}%")
print(f"SVM accuracy:                {svm_acc*100:.1f}%")
print(f"Cross-validation (5-fold):   {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")
print(f"Total symptoms: {len(ALL_SYMPTOMS)} | Total diseases: {len(set(y))}")
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
        "message":      "HealthBot ML Engine running!",
        "diseases":     len(set(y)),
        "symptoms":     len(ALL_SYMPTOMS),
        "rf_accuracy":  f"{rf_acc*100:.1f}%",
        "gb_accuracy":  f"{gb_acc*100:.1f}%",
        "svm_accuracy": f"{svm_acc*100:.1f}%",
        "cv_score":     f"{cv_scores.mean()*100:.1f}%"
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({"symptoms": ALL_SYMPTOMS, "total": len(ALL_SYMPTOMS)})

@app.route('/diseases', methods=['GET'])
def get_diseases():
    return jsonify({"diseases": sorted(set(y)), "total": len(set(y))})

@app.route('/suggest', methods=['POST'])
def suggest():
    """Get symptom suggestions as user types"""
    data = request.get_json()
    partial = data.get('text', '')
    suggestions = get_symptom_suggestions(partial, ALL_SYMPTOMS)
    return jsonify({"suggestions": suggestions})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # Support both text input (NLP) and symptom list input
    text_input   = data.get('text', '')
    symptom_list = data.get('symptoms', [])

    if text_input:
        # NLP extraction from natural language
        matched, confidence_scores = extract_symptoms_from_text(text_input, ALL_SYMPTOMS)
        symptoms = matched
    else:
        symptoms = [s.strip().lower().replace(' ', '_') for s in symptom_list]
        matched  = [s for s in symptoms if s in ALL_SYMPTOMS]
        confidence_scores = {s: 1.0 for s in matched}
        symptoms = matched

    if not symptoms:
        return jsonify({
            "error": "No matching symptoms found",
            "hint":  "Try describing your symptoms in more detail"
        }), 400

    # Build feature vector
    vec = [1 if s in symptoms else 0 for s in ALL_SYMPTOMS]

    # Weighted ensemble prediction
    rf_proba  = rf_model.predict_proba([vec])[0]
    gb_proba  = gb_model.predict_proba([vec])[0]
    svm_proba = svm_model.predict_proba([vec])[0]
    classes   = rf_model.classes_

    # RF gets highest weight as it performs best
    avg_proba = (rf_proba * 0.45) + (gb_proba * 0.35) + (svm_proba * 0.20)
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

    severity_label, severity_level = severity_score(symptoms)

    return jsonify({
        "matched_symptoms":   symptoms,
        "symptom_confidence": confidence_scores,
        "unmatched":          [s for s in (symptom_list or []) if s not in ALL_SYMPTOMS],
        "predictions":        predictions,
        "severity":           severity_label,
        "severity_level":     severity_level,
        "recommendation":     get_recommendation(severity_level),
        "model_info": {
            "rf_accuracy":      f"{rf_acc*100:.1f}%",
            "gb_accuracy":      f"{gb_acc*100:.1f}%",
            "svm_accuracy":     f"{svm_acc*100:.1f}%",
            "cv_score":         f"{cv_scores.mean()*100:.1f}%",
            "total_diseases":   len(set(y)),
            "total_symptoms":   len(ALL_SYMPTOMS)
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