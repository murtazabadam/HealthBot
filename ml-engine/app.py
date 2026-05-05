from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
    AdaBoostClassifier,
    VotingClassifier
)
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
import os, joblib, warnings
warnings.filterwarnings('ignore')

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not available")

LIGHTGBM_AVAILABLE = False  # Disabled — not compatible with Railway

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')
MODELS_DIR = os.path.join(BASE, 'saved_models')
os.makedirs(MODELS_DIR, exist_ok=True)

# ── Load datasets ──────────────────────────────────────────────────────────────
print("Loading datasets...")

# Try merged dataset first, fall back to original
merged_path = os.path.join(DATA, 'merged_dataset.csv')
if os.path.exists(merged_path):
    print("Using merged dataset...")
    merged_df = pd.read_csv(merged_path)
    ALL_SYMPTOMS = [c for c in merged_df.columns if c != 'Disease']
    X = merged_df[ALL_SYMPTOMS].values
    y = merged_df['Disease'].values
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
    for _, row in df.iterrows():
        syms = set(row[col] for col in symptom_cols if row[col] != '')
        X.append([1 if s in syms else 0 for s in ALL_SYMPTOMS])
        y.append(row['Disease'].strip())
    X, y = np.array(X), np.array(y)

# ── Load description & precaution maps ────────────────────────────────────────
desc_df = pd.read_csv(os.path.join(DATA, 'symptom_Description.csv'))
prec_df = pd.read_csv(os.path.join(DATA, 'symptom_precaution.csv'))
sev_df  = pd.read_csv(os.path.join(DATA, 'Symptom-severity.csv'))

desc_df.columns = desc_df.columns.str.strip()
prec_df.columns = prec_df.columns.str.strip()
sev_df.columns  = sev_df.columns.str.strip()
sev_df['Symptom'] = sev_df['Symptom'].str.strip().str.replace(' ', '_').str.lower()

DESC_MAP, PREC_MAP = {}, {}
for _, row in desc_df.iterrows():
    DESC_MAP[row['Disease'].strip()] = row['Description'].strip()
for _, row in prec_df.iterrows():
    disease = row['Disease'].strip()
    precs = [str(row.get(f'Precaution_{i}', '')).strip()
             for i in range(1, 5)
             if str(row.get(f'Precaution_{i}', '')).strip()]
    PREC_MAP[disease] = precs
SEVERITY_MAP = dict(zip(sev_df['Symptom'], sev_df['weight']))

# ── Natural language mapping ───────────────────────────────────────────────────
NL_MAP = {
    'fever': 'fever', 'high fever': 'high_fever', 'mild fever': 'mild_fever',
    'feverish': 'fever', 'feel hot': 'fever', 'temperature': 'fever',
    'high temperature': 'high_fever', 'burning up': 'high_fever',
    'cough': 'cough', 'coughing': 'cough', 'dry cough': 'cough',
    'mucus': 'mucoid_sputum', 'phlegm': 'mucoid_sputum',
    'fatigue': 'fatigue', 'tired': 'fatigue', 'exhausted': 'fatigue',
    'weakness': 'fatigue', 'weak': 'fatigue', 'no energy': 'fatigue',
    'lethargy': 'lethargy', 'lethargic': 'lethargy',
    'headache': 'headache', 'head pain': 'headache', 'head hurts': 'headache',
    'migraine': 'headache', 'severe headache': 'severe_headache',
    'nausea': 'nausea', 'feel sick': 'nausea', 'nauseated': 'nausea',
    'vomiting': 'vomiting', 'throwing up': 'vomiting', 'vomit': 'vomiting',
    'stomach pain': 'stomach_pain', 'stomach ache': 'stomach_pain',
    'belly pain': 'stomach_pain', 'tummy ache': 'stomach_pain',
    'abdominal pain': 'abdominal_pain', 'stomach hurts': 'stomach_pain',
    'diarrhea': 'diarrhoea', 'diarrhoea': 'diarrhoea',
    'loose motion': 'diarrhoea', 'loose stool': 'diarrhoea',
    'constipation': 'constipation', 'indigestion': 'indigestion',
    'acidity': 'acidity', 'heartburn': 'acidity',
    'bloating': 'distention_of_abdomen', 'bloated': 'distention_of_abdomen',
    'breathlessness': 'breathlessness', 'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness', 'shortness of breath': 'breathlessness',
    'short of breath': 'breathlessness', 'wheezing': 'wheezing',
    'chest pain': 'chest_pain', 'chest hurts': 'chest_pain',
    'chest tightness': 'chest_pain',
    'rash': 'skin_rash', 'skin rash': 'skin_rash', 'red spots': 'skin_rash',
    'itching': 'itching', 'itchy': 'itching', 'itchy skin': 'itching',
    'yellow skin': 'yellowing_of_skin', 'yellow eyes': 'yellowing_of_eyes',
    'jaundice': 'yellowing_of_skin', 'pale skin': 'pale_skin',
    'joint pain': 'joint_pain', 'joints hurt': 'joint_pain',
    'muscle pain': 'muscle_pain', 'body ache': 'muscle_pain',
    'back pain': 'back_pain', 'lower back pain': 'back_pain',
    'neck pain': 'neck_pain', 'knee pain': 'knee_pain',
    'hip pain': 'hip_joint_pain',
    'runny nose': 'runny_nose', 'blocked nose': 'continuous_sneezing',
    'stuffy nose': 'continuous_sneezing', 'sneezing': 'continuous_sneezing',
    'sore throat': 'throat_irritation', 'throat pain': 'throat_irritation',
    'throat hurts': 'throat_irritation',
    'chills': 'chills', 'shivering': 'chills', 'feel cold': 'chills',
    'sweating': 'sweating', 'night sweats': 'sweating',
    'frequent urination': 'frequent_urination',
    'burning urination': 'burning_micturition',
    'painful urination': 'burning_micturition',
    'dark urine': 'dark_urine', 'yellow urine': 'yellow_urine',
    'blurry vision': 'blurred_and_distorted_vision',
    'weight loss': 'weight_loss', 'losing weight': 'weight_loss',
    'no appetite': 'loss_of_appetite', 'loss of appetite': 'loss_of_appetite',
    'not hungry': 'loss_of_appetite',
    'dizziness': 'dizziness', 'dizzy': 'dizziness', 'vertigo': 'dizziness',
    'anxiety': 'anxiety', 'anxious': 'anxiety',
    'depression': 'depression', 'depressed': 'depression',
    'palpitations': 'palpitations', 'heart racing': 'palpitations',
    'swelling': 'swelling_joints', 'swollen': 'swelling_joints',
    'loss of smell': 'loss_of_smell', 'cant smell': 'loss_of_smell',
    'excessive thirst': 'polyuria', 'thirst': 'polyuria',
    'very thirsty': 'polyuria', 'drinking a lot': 'polyuria',
    'excessive hunger': 'excessive_hunger', 'always hungry': 'excessive_hunger',
    'pain behind eyes': 'pain_behind_the_eyes',
    'pain behind the eyes': 'pain_behind_the_eyes',
    'eye pain': 'pain_in_eyes', 'red eyes': 'redness_of_eyes',
    'watery eyes': 'watering_from_eyes',
    'bloody stool': 'bloody_stool', 'blood in stool': 'bloody_stool',
    'insomnia': 'restlessness', 'cant sleep': 'restlessness',
    'mood swings': 'mood_swings', 'irritable': 'irritability',
    'skin peeling': 'skin_peeling', 'blisters': 'blister',
    'pus': 'pus_filled_pimples', 'pimples': 'pus_filled_pimples',
    'hair loss': 'brittle_nails', 'brittle nails': 'brittle_nails',
}

def extract_symptoms(text):
    text_lower = text.lower()
    found = set()
    sorted_phrases = sorted(NL_MAP.keys(), key=len, reverse=True)
    for phrase in sorted_phrases:
        if phrase in text_lower:
            sym = NL_MAP[phrase]
            if sym in ALL_SYMPTOMS:
                found.add(sym)
    for symptom in ALL_SYMPTOMS:
        readable = symptom.replace('_', ' ')
        if readable in text_lower or symptom in text_lower:
            found.add(symptom)
    return list(found)

# ── Encode labels ──────────────────────────────────────────────────────────────
le = LabelEncoder()
y_encoded = le.fit_transform(y)


# ── Train/test split ───────────────────────────────────────────────────────────
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# ── Train all models (NO SMOTE - data is already balanced) ────────────────────
print("\nTraining all models...")

models = {
    'RandomForest': RandomForestClassifier(
        n_estimators=200, max_depth=None,
        min_samples_split=2, random_state=42, n_jobs=1
    ),
    'GradientBoosting': GradientBoostingClassifier(
        n_estimators=150, learning_rate=0.1,
        max_depth=5, random_state=42
    ),
    'SVM': SVC(
        kernel='rbf', probability=True,
        random_state=42, C=10
    ),
    'ExtraTrees': ExtraTreesClassifier(
        n_estimators=200, random_state=42, n_jobs=1
    ),
    'NaiveBayes': GaussianNB(),
    'DecisionTree': DecisionTreeClassifier(random_state=42),
}

if XGBOOST_AVAILABLE:
    models['XGBoost'] = XGBClassifier(
        n_estimators=150, learning_rate=0.1,
        max_depth=4, random_state=42,
        eval_metric='mlogloss', n_jobs=1,
        tree_method='hist'
    )



# ── Train and evaluate ─────────────────────────────────────────────────────────
trained_models = {}
model_scores = {}

for name, model in models.items():
    try:
        print(f"Training {name}...", end=' ', flush=True)
        model.fit(X_train, y_train)
        acc = accuracy_score(y_test, model.predict(X_test))
        model_scores[name] = acc
        trained_models[name] = model
        print(f"{acc*100:.1f}%")
    except Exception as e:
        print(f"Failed: {e}")

# ── Cross-validation on best model ────────────────────────────────────────────
best_model_name = max(model_scores, key=model_scores.get)
best_model = trained_models[best_model_name]
print(f"\nBest model: {best_model_name} ({model_scores[best_model_name]*100:.1f}%)")

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(
    best_model, X, y_encoded, cv=cv, scoring='accuracy', n_jobs=-1
)
print(f"Cross-validation: {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")

# ── Build final ensemble from top 5 models ─────────────────────────────────────
print("\nBuilding final ensemble from top models...")
sorted_models = sorted(model_scores.items(), key=lambda x: x[1], reverse=True)
top5 = sorted_models[:5]
print("Top 5 models:")
for name, score in top5:
    print(f"  {name}: {score*100:.1f}%")

ensemble_estimators = [(name, trained_models[name]) for name, _ in top5]
ensemble_weights = [score for _, score in top5]

ensemble = VotingClassifier(
    estimators=ensemble_estimators,
    voting='soft',
    weights=ensemble_weights,
    n_jobs=-1
)
print("Training final ensemble...")
ensemble.fit(X_train, y_train)
ensemble_acc = accuracy_score(y_test, ensemble.predict(X_test))
print(f"Ensemble accuracy: {ensemble_acc*100:.1f}%")

print(f"\nTotal diseases: {len(set(y))}")
print(f"Total symptoms: {len(ALL_SYMPTOMS)}")
print("ML Engine ready!")

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
        'Dengue': ['skin_rash', 'pain_behind_the_eyes', 'joint_pain'],
        'Malaria': ['chills', 'sweating', 'vomiting'],
        'Typhoid': ['stomach_pain', 'constipation', 'headache'],
        'Pneumonia': ['chest_pain', 'breathlessness', 'cough'],
        'Jaundice': ['yellowing_of_skin', 'dark_urine', 'abdominal_pain'],
        'Diabetes': ['frequent_urination', 'polyuria', 'weight_loss'],
        'Tuberculosis': ['cough', 'weight_loss', 'blood_in_sputum'],
        'Hepatitis B': ['yellowing_of_skin', 'abdominal_pain', 'fatigue'],
        'COVID-19': ['loss_of_smell', 'breathlessness', 'chest_pain'],
        'Dengue Fever': ['skin_rash', 'pain_behind_the_eyes', 'joint_pain'],
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
        "status":        "HealthBot ML Engine running!",
        "diseases":      len(set(y)),
        "symptoms":      len(ALL_SYMPTOMS),
        "models_trained": list(model_scores.keys()),
        "model_scores":  {k: f"{v*100:.1f}%" for k, v in model_scores.items()},
        "best_model":    best_model_name,
        "ensemble_acc":  f"{ensemble_acc*100:.1f}%",
        "cv_score":      f"{cv_scores.mean()*100:.1f}%"
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
        "models": {k: f"{v*100:.1f}%" for k, v in model_scores.items()},
        "best_model": best_model_name,
        "ensemble_accuracy": f"{ensemble_acc*100:.1f}%",
        "cross_validation": f"{cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%",
        "total_diseases": len(set(y)),
        "total_symptoms": len(ALL_SYMPTOMS),
        "training_samples": len(X_train_bal)
    })

@app.route('/predict', methods=['POST'])
def predict():
    data         = request.get_json()
    text_input   = data.get('text', '')
    symptom_list = data.get('symptoms', [])

    if text_input:
        symptoms = extract_symptoms(text_input)
    else:
        symptoms = [s.strip().lower().replace(' ', '_') for s in symptom_list]
        symptoms = [s for s in symptoms if s in ALL_SYMPTOMS]

    if not symptoms:
        return jsonify({
            "error":   "no_symptoms",
            "message": "No symptoms recognized.",
            "hint":    "Example: 'I have fever, headache and joint pain'"
        }), 400

    vec = np.array([1 if s in symptoms else 0 for s in ALL_SYMPTOMS]).reshape(1, -1)

    # Get ensemble prediction
    try:
        ensemble_proba = ensemble.predict_proba(vec)[0]
        classes = le.classes_

        # Also get individual model predictions for confidence
        individual_predictions = {}
        for name, model in trained_models.items():
            try:
                pred = le.inverse_transform([model.predict(vec)[0]])[0]
                individual_predictions[name] = pred
            except:
                pass

        top_idx   = np.argsort(ensemble_proba)[::-1][:5]
        predictions = []
        for idx in top_idx:
            disease    = classes[idx]
            confidence = round(float(ensemble_proba[idx]) * 100, 1)
            if confidence < 1.0:
                continue
            # Count how many models agree
            model_agreement = sum(
                1 for pred in individual_predictions.values()
                if pred == disease
            )
            predictions.append({
                "disease":        disease,
                "confidence":     confidence,
                "model_agreement": f"{model_agreement}/{len(individual_predictions)} models agree",
                "description":    DESC_MAP.get(disease, ""),
                "precautions":    PREC_MAP.get(disease, [])
            })

    except Exception as e:
        print(f"Ensemble error: {e}, falling back to best model")
        proba   = best_model.predict_proba(vec)[0]
        classes = le.classes_
        top_idx = np.argsort(proba)[::-1][:5]
        predictions = []
        for idx in top_idx:
            disease    = classes[idx]
            confidence = round(float(proba[idx]) * 100, 1)
            if confidence < 1.0:
                continue
            predictions.append({
                "disease":     disease,
                "confidence":  confidence,
                "description": DESC_MAP.get(disease, ""),
                "precautions": PREC_MAP.get(disease, [])
            })

    if not predictions:
        return jsonify({
            "error":   "no_predictions",
            "message": "Please provide more symptoms for accurate prediction."
        }), 400

    severity_label, severity_level = severity_score(symptoms)
    top_disease = predictions[0]["disease"]
    followup    = get_followup(symptoms, top_disease)
    low_conf    = len(symptoms) < 3

    return jsonify({
        "matched_symptoms":   symptoms,
        "symptom_count":      len(symptoms),
        "predictions":        predictions,
        "severity":           severity_label,
        "severity_level":     severity_level,
        "recommendation":     get_recommendation(severity_level),
        "followup_question":  followup,
        "low_confidence":     low_conf,
        "accuracy_note":      "Add more symptoms for better accuracy" if low_conf else "",
        "model_info": {
            "ensemble_accuracy": f"{ensemble_acc*100:.1f}%",
            "cv_score":         f"{cv_scores.mean()*100:.1f}%",
            "models_used":      len(trained_models),
            "best_model":       best_model_name,
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