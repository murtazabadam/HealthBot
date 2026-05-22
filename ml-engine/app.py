from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import os, random, warnings
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
    merged_df   = pd.read_csv(merged_path)
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

# ── Load description / precaution / severity maps ─────────────────────────────
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
    'high fever': 'high_fever', 'mild fever': 'mild_fever',
    'fever': 'high_fever', 'feverish': 'high_fever',
    'feel hot': 'high_fever', 'high temperature': 'high_fever',
    'cough': 'cough', 'coughing': 'cough', 'dry cough': 'cough',
    'mucus': 'mucoid_sputum', 'phlegm': 'mucoid_sputum',
    'fatigue': 'fatigue', 'tired': 'fatigue', 'exhausted': 'fatigue',
    'weakness': 'fatigue', 'weak': 'fatigue', 'no energy': 'fatigue',
    'lethargy': 'lethargy', 'lethargic': 'lethargy',
    'severe headache': 'severe_headache',
    'headache': 'headache', 'head pain': 'headache', 'head hurts': 'headache',
    'migraine': 'headache',
    'nausea': 'nausea', 'feel sick': 'nausea', 'nauseated': 'nausea',
    'vomiting': 'vomiting', 'throwing up': 'vomiting', 'vomit': 'vomiting',
    'stomach pain': 'stomach_pain', 'stomach ache': 'stomach_pain',
    'belly pain': 'stomach_pain', 'tummy ache': 'stomach_pain',
    'abdominal pain': 'abdominal_pain', 'stomach hurts': 'stomach_pain',
    'diarrhoea': 'diarrhoea', 'diarrhea': 'diarrhoea',
    'loose motion': 'diarrhoea', 'loose stool': 'diarrhoea',
    'constipation': 'constipation', 'indigestion': 'indigestion',
    'acidity': 'acidity', 'heartburn': 'acidity',
    'bloating': 'distention_of_abdomen', 'bloated': 'distention_of_abdomen',
    'breathlessness': 'breathlessness', 'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness',
    'shortness of breath': 'breathlessness',
    'short of breath': 'breathlessness',
    'wheezing': 'wheezing',
    'chest pain': 'chest_pain', 'chest hurts': 'chest_pain',
    'chest tightness': 'chest_pain',
    'skin rash': 'skin_rash', 'rash': 'skin_rash', 'red spots': 'skin_rash',
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
    'night sweats': 'sweating', 'sweating': 'sweating',
    'frequent urination': 'frequent_urination',
    'burning urination': 'burning_micturition',
    'painful urination': 'burning_micturition',
    'dark urine': 'dark_urine', 'yellow urine': 'yellow_urine',
    'blurry vision': 'blurred_and_distorted_vision',
    'weight loss': 'weight_loss', 'losing weight': 'weight_loss',
    'no appetite': 'loss_of_appetite',
    'loss of appetite': 'loss_of_appetite',
    'not hungry': 'loss_of_appetite',
    'dizziness': 'dizziness', 'dizzy': 'dizziness', 'vertigo': 'dizziness',
    'anxiety': 'anxiety', 'anxious': 'anxiety',
    'depression': 'depression', 'depressed': 'depression',
    'palpitations': 'palpitations', 'heart racing': 'palpitations',
    'swelling': 'swelling_joints', 'swollen': 'swelling_joints',
    'loss of smell': 'loss_of_smell', 'cant smell': 'loss_of_smell',
    'excessive thirst': 'polyuria', 'very thirsty': 'polyuria',
    'thirst': 'polyuria', 'drinking a lot': 'polyuria',
    'excessive hunger': 'excessive_hunger', 'always hungry': 'excessive_hunger',
    'pain behind the eyes': 'pain_behind_the_eyes',
    'pain behind eyes': 'pain_behind_the_eyes',
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

# ── Add noise to get realistic accuracy ───────────────────────────────────────
print("Adding realistic noise to training data...")

def add_noise(X, y, noise_level=0.15, augment_factor=2):
    """
    Flip symptom bits randomly to simulate real-world variation.
    noise_level = probability of flipping each bit (0.15 = 15%)
    augment_factor = extra noisy copies per original sample
    """
    X_aug = list(X)
    y_aug = list(y)
    for i in range(len(X)):
        for _ in range(augment_factor):
            noisy = X[i].copy()
            for j in range(len(noisy)):
                if random.random() < noise_level:
                    noisy[j] = 1 - noisy[j]
            X_aug.append(noisy)
            y_aug.append(y[i])
    return np.array(X_aug), np.array(y_aug)

X_noisy, y_noisy = add_noise(X, y_encoded, noise_level=0.15, augment_factor=2)
print(f"Original: {len(X)} samples | After augmentation: {len(X_noisy)} samples")

# ── Train / test split on noisy data ──────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_noisy, y_noisy, test_size=0.2, random_state=42, stratify=y_noisy
)
print(f"Training: {len(X_train)} | Testing: {len(X_test)}")

# ── Train 3 models ─────────────────────────────────────────────────────────────
print("\nTraining models...")

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=1
)

gb_model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    min_samples_split=5,
    random_state=42
)

svm_model = SVC(
    kernel='rbf',
    C=5,
    probability=True,
    random_state=42
)

print("Training Random Forest...  ", end='', flush=True)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))
print(f"{rf_acc * 100:.1f}%")

print("Training Gradient Boosting...", end='', flush=True)
gb_model.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb_model.predict(X_test))
print(f"{gb_acc * 100:.1f}%")

print("Training SVM...            ", end='', flush=True)
svm_model.fit(X_train, y_train)
svm_acc = accuracy_score(y_test, svm_model.predict(X_test))
print(f"{svm_acc * 100:.1f}%")

# ── 5-fold cross-validation on Random Forest ──────────────────────────────────
print("Running cross-validation...")
cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(rf_model, X_noisy, y_noisy,
                             cv=cv, scoring='accuracy', n_jobs=1)
print(f"CV: {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")

print(f"\nRandom Forest:     {rf_acc*100:.1f}%")
print(f"Gradient Boosting: {gb_acc*100:.1f}%")
print(f"SVM:               {svm_acc*100:.1f}%")
print(f"Cross-validation:  {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")
print(f"Diseases: {len(set(y))} | Symptoms: {len(ALL_SYMPTOMS)}")
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
        "status":            "HealthBot ML Engine running!",
        "models":            3,
        "diseases":          len(set(y)),
        "symptoms":          len(ALL_SYMPTOMS),
        "training_samples":  len(X_train),
        "rf_accuracy":       f"{rf_acc*100:.1f}%",
        "gb_accuracy":       f"{gb_acc*100:.1f}%",
        "svm_accuracy":      f"{svm_acc*100:.1f}%",
        "cv_score":          f"{cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%",
        "note": "Evaluated on noise-augmented data for realistic accuracy"
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
            "RandomForest":      f"{rf_acc*100:.1f}%",
            "GradientBoosting":  f"{gb_acc*100:.1f}%",
            "SVM":               f"{svm_acc*100:.1f}%"
        },
        "cross_validation":  f"{cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%",
        "total_diseases":    len(set(y)),
        "total_symptoms":    len(ALL_SYMPTOMS),
        "training_samples":  len(X_train),
        "noise_level":       "15% bit-flip augmentation"
    })

@app.route('/predict', methods=['POST'])
def predict():
    data         = request.get_json()
    text_input   = data.get('text', '')
    symptom_list = data.get('symptoms', [])

    # Extract from text
    ml_symptoms = extract_symptoms(text_input) if text_input else []

    # Merge with any symptoms sent from backend
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

    # Feature vector
    vec = np.array([1 if s in symptoms else 0
                    for s in ALL_SYMPTOMS]).reshape(1, -1)

    # Weighted ensemble of 3 models
    rf_proba  = rf_model.predict_proba(vec)[0]
    gb_proba  = gb_model.predict_proba(vec)[0]
    svm_proba = svm_model.predict_proba(vec)[0]

    # Weights proportional to test accuracy
    total_w   = rf_acc + gb_acc + svm_acc
    avg_proba = (rf_proba  * (rf_acc  / total_w) +
                 gb_proba  * (gb_acc  / total_w) +
                 svm_proba * (svm_acc / total_w))

    classes = le.classes_
    top_idx = np.argsort(avg_proba)[::-1][:5]

    # Model agreement
    rf_pred  = le.inverse_transform([rf_model.predict(vec)[0]])[0]
    gb_pred  = le.inverse_transform([gb_model.predict(vec)[0]])[0]
    svm_pred = le.inverse_transform([svm_model.predict(vec)[0]])[0]
    individual = [rf_pred, gb_pred, svm_pred]

    predictions = []
    for idx in top_idx:
        disease    = classes[idx]
        confidence = round(float(avg_proba[idx]) * 100, 1)
        if confidence < 1.0:
            continue
        agreement = sum(1 for p in individual if p == disease)
        predictions.append({
            "disease":         disease,
            "confidence":      confidence,
            "model_agreement": f"{agreement}/3 models agree",
            "description":     DESC_MAP.get(disease, ""),
            "precautions":     PREC_MAP.get(disease, [])
        })

    if not predictions:
        return jsonify({
            "error":   "no_predictions",
            "message": "Please provide more symptoms."
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
            "svm_accuracy":   f"{svm_acc*100:.1f}%",
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