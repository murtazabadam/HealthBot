from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import os

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

# ── Build maps ─────────────────────────────────────────────────────────────────
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

# ── Natural language to symptom mapping ────────────────────────────────────────
NL_MAP = {
    # Fever
    'fever': 'fever', 'high fever': 'high_fever', 'mild fever': 'mild_fever',
    'feverish': 'fever', 'feel hot': 'fever', 'temperature': 'fever',
    'high temperature': 'high_fever', 'burning up': 'high_fever',

    # Cough
    'cough': 'cough', 'coughing': 'cough', 'dry cough': 'cough',
    'wet cough': 'cough', 'persistent cough': 'cough',
    'mucus': 'mucoid_sputum', 'phlegm': 'mucoid_sputum',

    # Fatigue
    'fatigue': 'fatigue', 'tired': 'fatigue', 'exhausted': 'fatigue',
    'weakness': 'weakness_in_limbs', 'weak': 'fatigue', 'no energy': 'fatigue',
    'lethargic': 'lethargy', 'lethargy': 'lethargy',

    # Head
    'headache': 'headache', 'head pain': 'headache', 'head hurts': 'headache',
    'migraine': 'headache', 'head ache': 'headache',
    'severe headache': 'severe_headache',

    # Stomach
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

    # Breathing
    'breathlessness': 'breathlessness', 'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness', 'shortness of breath': 'breathlessness',
    'short of breath': 'breathlessness', 'wheezing': 'wheezing',
    'chest pain': 'chest_pain', 'chest hurts': 'chest_pain',
    'chest tightness': 'chest_pain',

    # Skin
    'rash': 'skin_rash', 'skin rash': 'skin_rash', 'red spots': 'skin_rash',
    'itching': 'itching', 'itchy': 'itching', 'itchy skin': 'itching',
    'yellow skin': 'yellowing_of_skin', 'yellow eyes': 'yellowing_of_eyes',
    'jaundice': 'yellowing_of_skin', 'pale skin': 'pale_skin',
    'blisters': 'blister', 'pimples': 'pus_filled_pimples',

    # Pain
    'joint pain': 'joint_pain', 'joints hurt': 'joint_pain',
    'muscle pain': 'muscle_pain', 'body ache': 'muscle_pain',
    'back pain': 'back_pain', 'lower back pain': 'back_pain',
    'neck pain': 'neck_pain', 'knee pain': 'knee_pain',
    'hip pain': 'hip_joint_pain',

    # Cold
    'runny nose': 'runny_nose', 'blocked nose': 'continuous_sneezing',
    'stuffy nose': 'continuous_sneezing', 'sneezing': 'continuous_sneezing',
    'sore throat': 'throat_irritation', 'throat pain': 'throat_irritation',
    'throat hurts': 'throat_irritation',
    'chills': 'chills', 'shivering': 'chills', 'feel cold': 'chills',
    'sweating': 'sweating', 'night sweats': 'sweating',

    # Urinary
    'frequent urination': 'frequent_urination', 'need to pee often': 'frequent_urination',
    'burning urination': 'burning_micturition', 'painful urination': 'burning_micturition',
    'dark urine': 'dark_urine', 'yellow urine': 'yellow_urine',

    # Eyes
    'blurry vision': 'blurred_and_distorted_vision', 'vision problems': 'blurred_and_distorted_vision',
    'watery eyes': 'watering_from_eyes', 'eye pain': 'pain_in_eyes',
    'red eyes': 'redness_of_eyes',

    # Other
    'weight loss': 'weight_loss', 'losing weight': 'weight_loss',
    'no appetite': 'loss_of_appetite', 'loss of appetite': 'loss_of_appetite',
    'not hungry': 'loss_of_appetite',
    'dizziness': 'dizziness', 'dizzy': 'dizziness', 'vertigo': 'dizziness',
    'lightheaded': 'dizziness',
    'anxiety': 'anxiety', 'anxious': 'anxiety',
    'depression': 'depression', 'depressed': 'depression',
    'mood swings': 'mood_swings', 'irritable': 'irritability',
    'palpitations': 'palpitations', 'heart racing': 'palpitations',
    'swollen': 'swelling_joints', 'swelling': 'swelling_joints',
    'numbness': 'loss_of_balance', 'tingling': 'drying_and_tingling_lips',
    'loss of smell': 'loss_of_smell', 'cant smell': 'loss_of_smell',
    'loss of taste': 'loss_of_smell',
    'hair loss': 'brittle_nails', 'hair fall': 'brittle_nails',
    'insomnia': 'restlessness', 'cant sleep': 'restlessness',
    'excessive thirst': 'polyuria',
'thirst': 'polyuria',
'drinking a lot': 'polyuria',
'excessive hunger': 'excessive_hunger',
}

def extract_symptoms(text):
    """Extract symptoms from natural language using NL mapping and direct matching"""
    text_lower = text.lower()
    found = set()

    # Step 1: Natural language mapping (multi-word phrases first)
    sorted_phrases = sorted(NL_MAP.keys(), key=len, reverse=True)
    for phrase in sorted_phrases:
        if phrase in text_lower:
            symptom = NL_MAP[phrase]
            if symptom in ALL_SYMPTOMS:
                found.add(symptom)

    # Step 2: Direct symptom name matching
    for symptom in ALL_SYMPTOMS:
        readable = symptom.replace('_', ' ')
        if readable in text_lower or symptom in text_lower:
            found.add(symptom)

    return list(found)

# ── Build feature matrix ───────────────────────────────────────────────────────
print("Building feature matrix...")
X, y = [], []
for _, row in df.iterrows():
    symptoms_in_row = set(row[col] for col in symptom_cols if row[col] != '')
    features = [1 if s in symptoms_in_row else 0 for s in ALL_SYMPTOMS]
    X.append(features)
    y.append(row['Disease'].strip())

X = np.array(X)
y = np.array(y)

# ── Train 3-model ensemble ─────────────────────────────────────────────────────
print("Training optimized ensemble models...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

rf_model = RandomForestClassifier(
    n_estimators=300, max_depth=None,
    min_samples_split=2, min_samples_leaf=1,
    random_state=42, n_jobs=-1
)
gb_model = GradientBoostingClassifier(
    n_estimators=150, learning_rate=0.1,
    max_depth=5, random_state=42
)
svm_model = SVC(kernel='rbf', probability=True, random_state=42, C=10)

rf_model.fit(X_train, y_train)
gb_model.fit(X_train, y_train)
svm_model.fit(X_train, y_train)

rf_acc  = accuracy_score(y_test, rf_model.predict(X_test))
gb_acc  = accuracy_score(y_test, gb_model.predict(X_test))
svm_acc = accuracy_score(y_test, svm_model.predict(X_test))
cv_scores = cross_val_score(rf_model, X, y, cv=5)

print(f"Random Forest:      {rf_acc*100:.1f}%")
print(f"Gradient Boosting:  {gb_acc*100:.1f}%")
print(f"SVM:                {svm_acc*100:.1f}%")
print(f"Cross-validation:   {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")
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

def get_followup_questions(symptoms, top_disease):
    """Generate follow-up questions to improve accuracy"""
    disease_symptoms = {
        'Dengue': ['skin_rash', 'joint_pain', 'pain_behind_the_eyes'],
        'Malaria': ['chills', 'sweating', 'vomiting'],
        'Typhoid': ['stomach_pain', 'constipation', 'headache'],
        'Pneumonia': ['chest_pain', 'breathlessness', 'cough'],
        'Jaundice': ['yellowing_of_skin', 'dark_urine', 'abdominal_pain'],
        'Diabetes': ['frequent_urination', 'excessive_thirst', 'weight_loss'],
        'Tuberculosis': ['cough', 'weight_loss', 'night_sweats'],
        'Hepatitis B': ['yellowing_of_skin', 'abdominal_pain', 'fatigue'],
    }
    if top_disease in disease_symptoms:
        missing = [s for s in disease_symptoms[top_disease] if s not in symptoms]
        if missing:
            readable = [s.replace('_', ' ') for s in missing[:2]]
            return f"Do you also have {' or '.join(readable)}?"
    return None

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "status":    "HealthBot ML Engine running!",
        "diseases":  len(set(y)),
        "symptoms":  len(ALL_SYMPTOMS),
        "rf_acc":    f"{rf_acc*100:.1f}%",
        "gb_acc":    f"{gb_acc*100:.1f}%",
        "svm_acc":   f"{svm_acc*100:.1f}%",
        "cv_score":  f"{cv_scores.mean()*100:.1f}%"
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({"symptoms": ALL_SYMPTOMS, "total": len(ALL_SYMPTOMS)})

@app.route('/diseases', methods=['GET'])
def get_diseases():
    return jsonify({"diseases": sorted(set(y)), "total": len(set(y))})

@app.route('/predict', methods=['POST'])
def predict():
    data        = request.get_json()
    text_input  = data.get('text', '')
    symptom_list = data.get('symptoms', [])

    # Extract symptoms
    if text_input:
        symptoms = extract_symptoms(text_input)
    else:
        symptoms = [s.strip().lower().replace(' ', '_') for s in symptom_list]
        symptoms = [s for s in symptoms if s in ALL_SYMPTOMS]

    if not symptoms:
        return jsonify({
            "error": "no_symptoms",
            "message": "No symptoms recognized. Please describe your symptoms more clearly.",
            "hint": "Example: 'I have fever, headache and joint pain'"
        }), 400

    # Build vector
    vec = np.array([1 if s in symptoms else 0 for s in ALL_SYMPTOMS]).reshape(1, -1)

    # Weighted ensemble prediction
    rf_proba  = rf_model.predict_proba(vec)[0]
    gb_proba  = gb_model.predict_proba(vec)[0]
    svm_proba = svm_model.predict_proba(vec)[0]
    classes   = rf_model.classes_

    avg_proba = (rf_proba * 0.45) + (gb_proba * 0.35) + (svm_proba * 0.20)
    top_idx   = np.argsort(avg_proba)[::-1][:5]

    predictions = []
    for idx in top_idx:
        disease    = classes[idx]
        confidence = round(float(avg_proba[idx]) * 100, 1)
        if confidence < 1.0:
            continue
        predictions.append({
            "disease":     disease,
            "confidence":  confidence,
            "description": DESC_MAP.get(disease, ""),
            "precautions": PREC_MAP.get(disease, [])
        })

    if not predictions:
        return jsonify({"error": "No predictions", "message": "Please provide more symptoms."}), 400

    severity_label, severity_level = severity_score(symptoms)
    top_disease = predictions[0]["disease"]
    followup    = get_followup_questions(symptoms, top_disease)

    # Confidence warning for single symptom
    low_confidence = len(symptoms) < 3

    return jsonify({
        "matched_symptoms":  symptoms,
        "symptom_count":     len(symptoms),
        "predictions":       predictions,
        "severity":          severity_label,
        "severity_level":    severity_level,
        "recommendation":    get_recommendation(severity_level),
        "followup_question": followup,
        "low_confidence":    low_confidence,
        "accuracy_note":     "Add more symptoms for better accuracy" if low_confidence else "",
        "model_info": {
            "rf_accuracy":   f"{rf_acc*100:.1f}%",
            "gb_accuracy":   f"{gb_acc*100:.1f}%",
            "svm_accuracy":  f"{svm_acc*100:.1f}%",
            "cv_score":      f"{cv_scores.mean()*100:.1f}%",
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