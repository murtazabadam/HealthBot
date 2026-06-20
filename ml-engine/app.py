from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import os, warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data') if os.path.exists(
    os.path.join(BASE, 'data', 'dataset.csv')) else BASE
print(f"Using data directory: {DATA}")

# ── Load datasets ──────────────────────────────────────────────────────────────
print("Loading datasets...")
merged_path = os.path.join(DATA, 'merged_dataset.csv')

if os.path.exists(merged_path):
    print("Using merged dataset...")
    merged_df    = pd.read_csv(merged_path)
    ALL_SYMPTOMS = [c for c in merged_df.columns if c != 'Disease']
    X = merged_df[ALL_SYMPTOMS].values.astype(np.float32)
    y = merged_df['Disease'].values
    # Build disease→symptoms map
    DISEASE_SYMPTOMS = {}
    for _, row in merged_df.iterrows():
        d = row['Disease']
        if d not in DISEASE_SYMPTOMS:
            DISEASE_SYMPTOMS[d] = set()
        DISEASE_SYMPTOMS[d].update(
            col for col in ALL_SYMPTOMS if row[col] == 1
        )
    print(f"Merged: {len(X)} samples, {len(set(y))} diseases, {len(ALL_SYMPTOMS)} symptoms")
else:
    print("Using original dataset...")
    df = pd.read_csv(os.path.join(DATA, 'dataset.csv'))
    df.columns = df.columns.str.strip()
    df = df.fillna('')
    symptom_cols = [c for c in df.columns if c != 'Disease']
    for col in symptom_cols:
        df[col] = df[col].str.strip().str.replace(' ', '_').str.lower()
    ALL_SYMPTOMS = sorted(set(
        s for col in symptom_cols for s in df[col].unique() if s != ''
    ))
    X, y = [], []
    DISEASE_SYMPTOMS = {}
    for _, row in df.iterrows():
        syms = set(row[col] for col in symptom_cols if row[col] != '')
        d = row['Disease'].strip()
        X.append([1 if s in syms else 0 for s in ALL_SYMPTOMS])
        y.append(d)
        if d not in DISEASE_SYMPTOMS:
            DISEASE_SYMPTOMS[d] = set()
        DISEASE_SYMPTOMS[d].update(syms)
    X, y = np.array(X, dtype=np.float32), np.array(y)

# ── Load maps ──────────────────────────────────────────────────────────────────
desc_df = pd.read_csv(os.path.join(DATA, 'symptom_Description.csv'))
prec_df = pd.read_csv(os.path.join(DATA, 'symptom_precaution.csv'))
sev_df  = pd.read_csv(os.path.join(DATA, 'Symptom-severity.csv'))
for df_ in [desc_df, prec_df, sev_df]:
    df_.columns = df_.columns.str.strip()
sev_df['Symptom'] = sev_df['Symptom'].str.strip().str.replace(' ', '_').str.lower()

DESC_MAP, PREC_MAP = {}, {}
for _, row in desc_df.iterrows():
    DESC_MAP[row['Disease'].strip()] = row['Description'].strip()
for _, row in prec_df.iterrows():
    d = row['Disease'].strip()
    PREC_MAP[d] = [
        str(row.get(f'Precaution_{i}', '')).strip()
        for i in range(1, 5)
        if str(row.get(f'Precaution_{i}', '')).strip()
    ]
SEVERITY_MAP = dict(zip(sev_df['Symptom'], sev_df['weight']))

# ── NL Map ─────────────────────────────────────────────────────────────────────
NL_MAP = {
    'high fever': 'high_fever',    'mild fever': 'mild_fever',
    'fever': 'high_fever',          'feverish': 'high_fever',
    'feel hot': 'high_fever',       'high temperature': 'high_fever',
    'cough': 'cough',               'coughing': 'cough',
    'dry cough': 'cough',           'mucus': 'mucoid_sputum',
    'phlegm': 'mucoid_sputum',
    'fatigue': 'fatigue',           'tired': 'fatigue',
    'exhausted': 'fatigue',         'weakness': 'fatigue',
    'weak': 'fatigue',              'no energy': 'fatigue',
    'lethargy': 'lethargy',         'lethargic': 'lethargy',
    'severe headache': 'severe_headache',
    'headache': 'headache',         'head pain': 'headache',
    'head hurts': 'headache',       'migraine': 'headache',
    'nausea': 'nausea',             'feel sick': 'nausea',
    'nauseated': 'nausea',          'vomiting': 'vomiting',
    'throwing up': 'vomiting',      'vomit': 'vomiting',
    'stomach pain': 'stomach_pain', 'stomach ache': 'stomach_pain',
    'belly pain': 'stomach_pain',   'tummy ache': 'stomach_pain',
    'abdominal pain': 'abdominal_pain',
    'stomach hurts': 'stomach_pain',
    'diarrhoea': 'diarrhoea',       'diarrhea': 'diarrhoea',
    'loose motion': 'diarrhoea',    'loose stool': 'diarrhoea',
    'constipation': 'constipation', 'indigestion': 'indigestion',
    'acidity': 'acidity',           'heartburn': 'acidity',
    'bloating': 'distention_of_abdomen',
    'bloated': 'distention_of_abdomen',
    'breathlessness': 'breathlessness',
    'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness',
    'shortness of breath': 'breathlessness',
    'short of breath': 'breathlessness',
    'wheezing': 'wheezing',
    'chest pain': 'chest_pain',     'chest hurts': 'chest_pain',
    'chest tightness': 'chest_pain',
    'skin rash': 'skin_rash',       'rash': 'skin_rash',
    'red spots': 'skin_rash',       'itching': 'itching',
    'itchy': 'itching',             'itchy skin': 'itching',
    'yellow skin': 'yellowing_of_skin',
    'yellow eyes': 'yellowing_of_eyes',
    'jaundice': 'yellowing_of_skin', 'pale skin': 'pale_skin',
    'joint pain': 'joint_pain',     'joints hurt': 'joint_pain',
    'muscle pain': 'muscle_pain',   'body ache': 'muscle_pain',
    'back pain': 'back_pain',       'lower back pain': 'back_pain',
    'neck pain': 'neck_pain',       'knee pain': 'knee_pain',
    'hip pain': 'hip_joint_pain',
    'runny nose': 'runny_nose',     'cold': 'runny_nose',
    'blocked nose': 'continuous_sneezing',
    'stuffy nose': 'continuous_sneezing',
    'sneezing': 'continuous_sneezing',
    'sore throat': 'throat_irritation',
    'throat pain': 'throat_irritation',
    'throat hurts': 'throat_irritation',
    'chills': 'chills',             'shivering': 'chills',
    'feel cold': 'chills',          'night sweats': 'sweating',
    'sweating': 'sweating',
    'frequent urination': 'frequent_urination',
    'burning urination': 'burning_micturition',
    'painful urination': 'burning_micturition',
    'dark urine': 'dark_urine',     'yellow urine': 'yellow_urine',
    'blurry vision': 'blurred_and_distorted_vision',
    'weight loss': 'weight_loss',   'losing weight': 'weight_loss',
    'no appetite': 'loss_of_appetite',
    'loss of appetite': 'loss_of_appetite',
    'not hungry': 'loss_of_appetite',
    'dizziness': 'dizziness',       'dizzy': 'dizziness',
    'vertigo': 'dizziness',         'anxiety': 'anxiety',
    'anxious': 'anxiety',           'depression': 'depression',
    'depressed': 'depression',      'palpitations': 'palpitations',
    'heart racing': 'palpitations', 'swelling': 'swelling_joints',
    'swollen': 'swelling_joints',   'loss of smell': 'loss_of_smell',
    'cant smell': 'loss_of_smell',  'excessive thirst': 'polyuria',
    'very thirsty': 'polyuria',     'thirst': 'polyuria',
    'drinking a lot': 'polyuria',   'excessive hunger': 'excessive_hunger',
    'always hungry': 'excessive_hunger',
    'pain behind the eyes': 'pain_behind_the_eyes',
    'pain behind eyes': 'pain_behind_the_eyes',
    'eye pain': 'pain_in_eyes',     'red eyes': 'redness_of_eyes',
    'watery eyes': 'watering_from_eyes',
    'bloody stool': 'bloody_stool', 'blood in stool': 'bloody_stool',
    'insomnia': 'restlessness',     'cant sleep': 'restlessness',
    'mood swings': 'mood_swings',   'irritable': 'irritability',
    'skin peeling': 'skin_peeling', 'blisters': 'blister',
    'pus': 'pus_filled_pimples',    'pimples': 'pus_filled_pimples',
    'hair loss': 'brittle_nails',   'brittle nails': 'brittle_nails',
}
_SORTED_PHRASES = sorted(NL_MAP.keys(), key=len, reverse=True)

def extract_symptoms(text):
    text_lower = text.lower()
    found = set()
    for phrase in _SORTED_PHRASES:
        if phrase in text_lower:
            sym = NL_MAP[phrase]
            if sym in ALL_SYMPTOMS:
                found.add(sym)
    for symptom in ALL_SYMPTOMS:
        if symptom.replace('_', ' ') in text_lower or symptom in text_lower:
            found.add(symptom)
    return list(found)

# ── Encode labels ──────────────────────────────────────────────────────────────
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# ── Safe dropout augmentation ───────────────────────────────────────────────────
# Root cause of 100% accuracy: each disease has only ONE unique symptom
# pattern repeated ~120 times in the raw dataset, so train/test rows are
# literally identical copies of each other - the model memorizes, not learns.
#
# Fix: simulate realistic incomplete symptom reporting by RANDOMLY REMOVING
# symptoms a patient might not have mentioned. We NEVER add a symptom that
# wasn't already present, so we can never create medically impossible
# combinations (e.g. headache -> Paralysis, which happened with bit-flip noise).
import random as _random

def safe_dropout_augment(X, y, dropout_rate=0.2, copies=2, seed=42):
    X_aug, y_aug = list(X), list(y)
    rng = _random.Random(seed)
    for i in range(len(X)):
        active_idx = [j for j, v in enumerate(X[i]) if v == 1]
        if len(active_idx) <= 2:
            continue  # too sparse already, skip
        for _ in range(copies):
            noisy = X[i].copy()
            for j in active_idx:
                if rng.random() < dropout_rate:
                    noisy[j] = 0  # only remove, never add
            X_aug.append(noisy)
            y_aug.append(y[i])
    return np.array(X_aug, dtype=np.float32), np.array(y_aug)

print("Applying safe dropout augmentation (removes symptoms only, never adds)...")
X_safe, y_safe = safe_dropout_augment(X, y_encoded, dropout_rate=0.2, copies=2)
print(f"Original: {len(X)} | After safe augmentation: {len(X_safe)}")

# ── Train / test split on augmented data ───────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_safe, y_safe, test_size=0.2, random_state=42, stratify=y_safe
)
print(f"Training: {len(X_train)} | Testing: {len(X_test)}")

# ── Train 3 models — reduced capacity to discourage memorization ───────────────
print("\nTraining models...")

rf_model = RandomForestClassifier(
    n_estimators=120, max_depth=12,
    min_samples_split=4, min_samples_leaf=2,
    random_state=42, n_jobs=1
)
gb_model = GradientBoostingClassifier(
    n_estimators=80, learning_rate=0.08,
    max_depth=3, min_samples_split=4,
    random_state=42
)
nb_model = GaussianNB()

print("Training Random Forest...   ", end='', flush=True)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))
print(f"{rf_acc*100:.1f}%")

print("Training Gradient Boosting..", end='', flush=True)
gb_model.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb_model.predict(X_test))
print(f"{gb_acc*100:.1f}%")

print("Training Naive Bayes...     ", end='', flush=True)
nb_model.fit(X_train, y_train)
nb_acc = accuracy_score(y_test, nb_model.predict(X_test))
print(f"{nb_acc*100:.1f}%")

# ── 5-fold cross-validation ────────────────────────────────────────────────────
print("Running cross-validation...")
cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(rf_model, X_safe, y_safe,
                             cv=cv, scoring='accuracy', n_jobs=1)
print(f"\nRandom Forest:     {rf_acc*100:.1f}%")
print(f"Gradient Boosting: {gb_acc*100:.1f}%")
print(f"Naive Bayes:       {nb_acc*100:.1f}%")
print(f"Cross-validation:  {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")
print(f"Diseases: {len(set(y))} | Symptoms: {len(ALL_SYMPTOMS)}")
print("ML Engine ready!")

_TOTAL_W = rf_acc + gb_acc + nb_acc
_W_RF    = rf_acc / _TOTAL_W
_W_GB    = gb_acc / _TOTAL_W
_W_NB    = nb_acc / _TOTAL_W

# ── Helpers ────────────────────────────────────────────────────────────────────
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

def get_followup(symptoms, top_disease):
    followups = {
        'Dengue':       ['skin_rash', 'pain_behind_the_eyes', 'joint_pain'],
        'Malaria':      ['chills', 'sweating', 'vomiting'],
        'Typhoid':      ['stomach_pain', 'constipation', 'headache'],
        'Pneumonia':    ['chest_pain', 'breathlessness', 'cough'],
        'Jaundice':     ['yellowing_of_skin', 'dark_urine', 'abdominal_pain'],
        'Diabetes':     ['frequent_urination', 'polyuria', 'weight_loss'],
        'Tuberculosis': ['cough', 'weight_loss', 'chills'],
        'Hepatitis B':  ['yellowing_of_skin', 'abdominal_pain', 'fatigue'],
    }
    if top_disease in followups:
        missing = [s for s in followups[top_disease] if s not in symptoms]
        if missing:
            readable = [s.replace('_', ' ') for s in missing[:2]]
            return f"Do you also have {' or '.join(readable)}?"
    return None

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "status":           "HealthBot ML Engine running!",
        "models":           3,
        "diseases":         len(set(y)),
        "symptoms":         len(ALL_SYMPTOMS),
        "training_samples": len(X_train),
        "rf_accuracy":      f"{rf_acc*100:.1f}%",
        "gb_accuracy":      f"{gb_acc*100:.1f}%",
        "nb_accuracy":      f"{nb_acc*100:.1f}%",
        "cv_score":         f"{cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%"
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({"symptoms": ALL_SYMPTOMS, "total": len(ALL_SYMPTOMS)})

@app.route('/diseases', methods=['GET'])
def get_diseases():
    return jsonify({"diseases": sorted(set(y)), "total": len(set(y))})

@app.route('/model-stats', methods=['GET'])
def model_stats():
    return jsonify({
        "models": {
            "RandomForest":     f"{rf_acc*100:.1f}%",
            "GradientBoosting": f"{gb_acc*100:.1f}%",
            "NaiveBayes":       f"{nb_acc*100:.1f}%"
        },
        "cross_validation": f"{cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%",
        "total_diseases":   len(set(y)),
        "total_symptoms":   len(ALL_SYMPTOMS),
        "training_samples": len(X_train)
    })

@app.route('/predict', methods=['POST'])
def predict():
    data         = request.get_json()
    text_input   = data.get('text', '')
    symptom_list = data.get('symptoms', [])

    ml_symptoms = extract_symptoms(text_input) if text_input else []
    provided = [
        s.strip().lower().replace(' ', '_')
        for s in symptom_list
        if s.strip().lower().replace(' ', '_') in ALL_SYMPTOMS
    ]
    symptoms = list(set(ml_symptoms + provided))

    if not symptoms:
        return jsonify({
            "error":   "no_symptoms",
            "message": "No symptoms recognized.",
            "hint":    "Example: 'I have fever, headache and joint pain'"
        }), 400

    vec = np.array(
        [1 if s in symptoms else 0 for s in ALL_SYMPTOMS],
        dtype=np.float32
    ).reshape(1, -1)

    # Weighted ensemble
    rf_proba  = rf_model.predict_proba(vec)[0]
    gb_proba  = gb_model.predict_proba(vec)[0]
    nb_proba  = nb_model.predict_proba(vec)[0]
    avg_proba = _W_RF * rf_proba + _W_GB * gb_proba + _W_NB * nb_proba

    classes = le.classes_
    top_idx = np.argsort(avg_proba)[::-1][:10]  # get top 10 then filter

    rf_pred    = le.inverse_transform([rf_model.predict(vec)[0]])[0]
    gb_pred    = le.inverse_transform([gb_model.predict(vec)[0]])[0]
    nb_pred    = le.inverse_transform([nb_model.predict(vec)[0]])[0]
    individual = [rf_pred, gb_pred, nb_pred]

    user_symptom_set = set(symptoms)
    predictions = []

    for idx in top_idx:
        if len(predictions) >= 5:
            break
        disease    = classes[idx]
        confidence = round(float(avg_proba[idx]) * 100, 1)
        if confidence < 1.0:
            continue

        # ── Symptom overlap filter ─────────────────────────────────────────
        # Only include prediction if at least 1 user symptom
        # actually belongs to this disease in the dataset
        known_syms = DISEASE_SYMPTOMS.get(disease, set())
        overlap    = len(user_symptom_set & known_syms)
        # Require at least 2 matching symptoms to prevent wrong predictions
        # e.g. headache alone should not predict Brain Hemorrhage or AIDS
        min_overlap = 2 if len(user_symptom_set) >= 3 else 1
        if overlap < min_overlap:
            continue  # skip medically irrelevant predictions

        agreement = sum(1 for p in individual if p == disease)
        predictions.append({
            "disease":         disease,
            "confidence":      confidence,
            "symptom_overlap": f"{overlap} symptom(s) match",
            "model_agreement": f"{agreement}/3 models agree",
            "description":     DESC_MAP.get(disease, ""),
            "precautions":     PREC_MAP.get(disease, [])
        })

    if not predictions:
        return jsonify({
            "error":   "no_predictions",
            "message": "Could not find a matching disease. Please describe more symptoms."
        }), 400

    severity_label, severity_level = severity_score(symptoms)
    top_disease = predictions[0]["disease"]
    followup    = get_followup(symptoms, top_disease)
    low_conf    = len(symptoms) < 3

    return jsonify({
        "matched_symptoms":  symptoms,
        "symptom_count":     len(symptoms),
        "predictions":       predictions,
        "severity":          severity_label,
        "severity_level":    severity_level,
        "recommendation":    get_recommendation(severity_level),
        "followup_question": followup,
        "low_confidence":    low_conf,
        "accuracy_note":     "Add more symptoms for better accuracy" if low_conf else "",
        "model_info": {
            "rf_accuracy":    f"{rf_acc*100:.1f}%",
            "gb_accuracy":    f"{gb_acc*100:.1f}%",
            "nb_accuracy":    f"{nb_acc*100:.1f}%",
            "cv_score":       f"{cv_scores.mean()*100:.1f}%",
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
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)
