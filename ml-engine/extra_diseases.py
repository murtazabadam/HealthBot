# Extended disease database with modern diseases not in Kaggle dataset

EXTRA_DISEASES = {
    "COVID-19": {
        "symptoms": [
            "fever", "cough", "fatigue", "loss_of_smell",
            "loss_of_taste", "breathlessness", "chest_pain",
            "headache", "muscle_pain", "diarrhoea"
        ],
        "description": "COVID-19 is an infectious disease caused by the SARS-CoV-2 virus affecting the respiratory system.",
        "precautions": [
            "Isolate immediately from others",
            "Wear a well-fitted mask",
            "Get tested for COVID-19",
            "Stay hydrated and rest"
        ],
        "severity": 4
    },
    "Monkeypox": {
        "symptoms": [
            "fever", "skin_rash", "itching", "fatigue",
            "muscle_pain", "headache", "chills", "sweating"
        ],
        "description": "Monkeypox is a viral zoonotic disease that causes rash, fever, and flu-like symptoms.",
        "precautions": [
            "Avoid contact with infected persons",
            "Isolate until fully recovered",
            "Seek immediate medical care",
            "Wear gloves when handling infected materials"
        ],
        "severity": 3
    },
    "Anxiety Disorder": {
        "symptoms": [
            "fatigue", "lack_of_concentration", "restlessness",
            "muscle_pain", "headache", "dizziness", "sweating",
            "palpitations", "irritability"
        ],
        "description": "Anxiety disorder is a mental health condition characterized by persistent excessive worry and fear.",
        "precautions": [
            "Practice daily relaxation and meditation",
            "Regular physical exercise",
            "Seek professional therapy or counseling",
            "Limit caffeine and alcohol intake"
        ],
        "severity": 2
    },
    "Kidney Stones": {
        "symptoms": [
            "back_pain", "burning_micturition", "frequent_urination",
            "nausea", "vomiting", "dark_urine", "abdominal_pain"
        ],
        "description": "Kidney stones are hard mineral deposits that form in the kidneys causing severe pain.",
        "precautions": [
            "Drink at least 8 glasses of water daily",
            "Reduce salt and protein intake",
            "Consult a urologist immediately",
            "Avoid foods high in oxalate"
        ],
        "severity": 3
    },
    "Migraine": {
        "symptoms": [
            "headache", "nausea", "vomiting", "sensitivity_to_light",
            "blurred_and_distorted_vision", "dizziness", "fatigue"
        ],
        "description": "Migraine is a neurological condition causing intense recurring headaches often with nausea and light sensitivity.",
        "precautions": [
            "Rest in a quiet dark room",
            "Take prescribed pain relief medication",
            "Stay hydrated and avoid triggers",
            "Keep a migraine diary to identify triggers"
        ],
        "severity": 2
    },
    "Thyroid Disorder": {
        "symptoms": [
            "fatigue", "weight_loss", "sweating", "palpitations",
            "irritability", "muscle_weakness", "diarrhoea", "anxiety"
        ],
        "description": "Thyroid disorders affect the thyroid gland's ability to produce hormones regulating metabolism.",
        "precautions": [
            "Get thyroid function tests done",
            "Take prescribed thyroid medication regularly",
            "Maintain a balanced iodine diet",
            "Regular endocrinologist visits"
        ],
        "severity": 3
    },
    "Appendicitis": {
        "symptoms": [
            "stomach_pain", "nausea", "vomiting", "fever",
            "loss_of_appetite", "abdominal_pain", "fatigue"
        ],
        "description": "Appendicitis is inflammation of the appendix causing severe abdominal pain requiring emergency care.",
        "precautions": [
            "Seek emergency medical attention immediately",
            "Do not eat or drink anything",
            "Avoid pain medication until diagnosed",
            "Get an ultrasound or CT scan"
        ],
        "severity": 4
    },
    "Sleep Apnea": {
        "symptoms": [
            "fatigue", "headache", "lack_of_concentration",
            "irritability", "depression", "mood_swings"
        ],
        "description": "Sleep apnea is a disorder where breathing repeatedly stops during sleep causing poor sleep quality.",
        "precautions": [
            "Use a CPAP machine as prescribed",
            "Maintain a healthy weight",
            "Sleep on your side instead of back",
            "Avoid alcohol and sedatives before bed"
        ],
        "severity": 2
    },
    "Dengue Fever": {
        "symptoms": [
            "high_fever", "severe_headache", "joint_pain",
            "muscle_pain", "skin_rash", "fatigue", "nausea",
            "vomiting", "pain_behind_the_eyes"
        ],
        "description": "Dengue is a mosquito-borne viral infection causing high fever, severe headache and joint pain.",
        "precautions": [
            "Use mosquito repellent consistently",
            "Eliminate standing water around home",
            "Seek immediate medical attention",
            "Stay hydrated with oral rehydration salts"
        ],
        "severity": 4
    },
    "Sciatica": {
        "symptoms": [
            "back_pain", "knee_pain", "weakness_in_limbs",
            "fatigue", "muscle_weakness", "hip_joint_pain"
        ],
        "description": "Sciatica is pain radiating along the sciatic nerve from the lower back through the hip and down the leg.",
        "precautions": [
            "Apply ice and heat alternately",
            "Do gentle stretching exercises",
            "Avoid prolonged sitting",
            "Consult a physiotherapist"
        ],
        "severity": 2
    }
}