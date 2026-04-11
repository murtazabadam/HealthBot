from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle, os, json
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import numpy as np

app = Flask(__name__)
CORS(app)

# ── Disease / symptom data (built-in, no CSV needed) ──────────────────────────
DISEASES = {
    "Common Cold":     ["sneezing","runny_nose","sore_throat","cough","fatigue"],
    "Flu":             ["fever","chills","body_ache","fatigue","cough","headache"],
    "Malaria":         ["fever","chills","sweating","headache","nausea","vomiting"],
    "Typhoid":         ["high_fever","weakness","stomach_pain","headache","nausea"],
    "Pneumonia":       ["fever","cough","chest_pain","shortness_of_breath","fatigue"],
    "Dengue":          ["high_fever","severe_headache","joint_pain","rash","fatigue"],
    "Diabetes":        ["frequent_urination","excessive_thirst","fatigue","blurred_vision","slow_healing"],
    "Hypertension":    ["headache","dizziness","chest_pain","shortness_of_breath","fatigue"],
    "Asthma":          ["shortness_of_breath","wheezing","chest_tightness","cough","fatigue"],
    "Migraine":        ["severe_headache","nausea","vomiting","sensitivity_to_light","blurred_vision"],
    "Gastroenteritis": ["nausea","vomiting","diarrhea","stomach_pain","fever"],
    "Anemia":          ["fatigue","weakness","pale_skin","shortness_of_breath","dizziness"],
    "UTI":             ["frequent_urination","burning_urination","lower_back_pain","fever","nausea"],
    "Jaundice":        ["yellowing_of_skin","dark_urine","fatigue","nausea","abdominal_pain"],
    "Chickenpox":      ["rash","fever","itching","fatigue","headache"],
}

SEVERITY = {
    "Common Cold":1,"Flu":2,"Malaria":4,"Typhoid":4,"Pneumonia":4,
    "Dengue":4,"Diabetes":3,"Hypertension":3,"Asthma":3,"Migraine":2,
    "Gastroenteritis":2,"Anemia":2,"UTI":2,"Jaundice":3,"Chickenpox":2,
}

# Gather all unique symptoms
ALL_SYMPTOMS = sorted({s for symptoms in DISEASES.values() for s in symptoms})

def build_training_data():
    X, y = [], []
    for disease, symptoms in DISEASES.items():
        for _ in range(30):  # 30 samples per disease
            row = [1 if s in symptoms else 0 for s in ALL_SYMPTOMS]
            # Add slight noise
            for i in range(len(row)):
                if row[i] == 0 and np.random.random() < 0.05:
                    row[i] = 1
            X.append(row)
            y.append(disease)
    return np.array(X), np.array(y)

# Train model on startup
print("Training model...")
X, y = build_training_data()
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)
print("Model ready!")

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({"message": "HealthBot ML Engine running!"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    symptoms = data.get('symptoms', [])
    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    # Build feature vector
    input_vec = [1 if s in symptoms else 0 for s in ALL_SYMPTOMS]
    proba = model.predict_proba([input_vec])[0]
    classes = model.classes_

    # Top 3 predictions
    top3_idx = np.argsort(proba)[::-1][:3]
    predictions = []
    for idx in top3_idx:
        disease = classes[idx]
        confidence = round(float(proba[idx]) * 100, 1)
        if confidence > 1:
            predictions.append({
                "disease": disease,
                "confidence": confidence,
                "severity": SEVERITY.get(disease, 1)
            })

    severity = predictions[0]["severity"] if predictions else 1
    severity_label = {1:"Mild",2:"Moderate",3:"Serious",4:"Severe"}.get(severity,"Unknown")

    return jsonify({
        "predictions": predictions,
        "severity": severity_label,
        "recommendation": get_recommendation(severity)
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({"symptoms": ALL_SYMPTOMS})

def get_recommendation(severity):
    if severity == 1: return "Rest at home, drink plenty of fluids."
    if severity == 2: return "Monitor symptoms. Visit a clinic if no improvement in 2 days."
    if severity == 3: return "Consult a doctor soon. Do not ignore these symptoms."
    return "Seek immediate medical attention!"

if __name__ == '__main__':
    app.run(port=5001, debug=True)