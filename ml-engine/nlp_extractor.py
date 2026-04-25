import re
import string
from difflib import SequenceMatcher

# Natural language to symptom mappings
NL_MAP = {
    # Fever related
    'feverish': 'fever',
    'high temperature': 'high_fever',
    'burning up': 'high_fever',
    'running a fever': 'fever',
    'feel hot': 'fever',
    'body is hot': 'fever',
    'temperature is high': 'high_fever',

    # Breathing
    'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness',
    'difficulty breathing': 'breathlessness',
    'shortness of breath': 'breathlessness',
    'out of breath': 'breathlessness',
    'chest tightness': 'chest_pain',
    'chest hurts': 'chest_pain',
    'chest pain': 'chest_pain',
    'chest is tight': 'chest_pain',

    # Stomach
    'stomach hurts': 'stomach_pain',
    'belly pain': 'stomach_pain',
    'abdominal pain': 'abdominal_pain',
    'tummy ache': 'stomach_pain',
    'stomach ache': 'stomach_pain',
    'upset stomach': 'indigestion',
    'feel nauseous': 'nausea',
    'feel sick': 'nausea',
    'want to vomit': 'vomiting',
    'throwing up': 'vomiting',
    'threw up': 'vomiting',

    # Fatigue
    'tired': 'fatigue',
    'exhausted': 'fatigue',
    'no energy': 'fatigue',
    'feeling weak': 'fatigue',
    'feel weak': 'weakness_in_limbs',
    'always sleepy': 'fatigue',
    'feeling drained': 'fatigue',
    'lethargic': 'fatigue',

    # Head
    'head hurts': 'headache',
    'head is pounding': 'headache',
    'migraine': 'headache',
    'head pain': 'headache',
    'feel dizzy': 'dizziness',
    'spinning': 'dizziness',
    'lightheaded': 'dizziness',
    'loss of balance': 'loss_of_balance',

    # Skin
    'skin rash': 'skin_rash',
    'rash on skin': 'skin_rash',
    'itchy skin': 'itching',
    'skin is itchy': 'itching',
    'red spots': 'skin_rash',
    'blisters': 'blister',
    'yellow skin': 'yellowing_of_skin',
    'yellow eyes': 'yellowing_of_eyes',
    'skin turned yellow': 'yellowing_of_skin',

    # Joints & Muscles
    'joint pain': 'joint_pain',
    'joints hurt': 'joint_pain',
    'muscle pain': 'muscle_pain',
    'body ache': 'muscle_pain',
    'muscles ache': 'muscle_pain',
    'back pain': 'back_pain',
    'lower back pain': 'back_pain',
    'knee pain': 'knee_pain',
    'neck pain': 'neck_pain',
    'neck stiffness': 'stiff_neck',

    # Cold & Flu
    'runny nose': 'runny_nose',
    'blocked nose': 'congestion',
    'stuffy nose': 'congestion',
    'sneezing': 'continuous_sneezing',
    'sore throat': 'throat_irritation',
    'throat pain': 'throat_irritation',
    'throat hurts': 'throat_irritation',
    'feel cold': 'chills',
    'shivering': 'chills',
    'chills': 'chills',
    'sweating': 'sweating',
    'night sweats': 'sweating',

    # Urinary
    'frequent urination': 'frequent_urination',
    'need to pee often': 'frequent_urination',
    'painful urination': 'burning_micturition',
    'burning urination': 'burning_micturition',
    'dark urine': 'dark_urine',
    'blood in urine': 'bloody_stool',

    # Digestive
    'diarrhea': 'diarrhoea',
    'loose stools': 'diarrhoea',
    'constipation': 'constipation',
    'cant poop': 'constipation',
    'bloated': 'distention_of_abdomen',
    'bloating': 'distention_of_abdomen',
    'acidity': 'acidity',
    'heartburn': 'acidity',

    # Eyes
    'blurry vision': 'blurred_and_distorted_vision',
    'cant see clearly': 'blurred_and_distorted_vision',
    'watery eyes': 'watering_from_eyes',
    'eye pain': 'pain_in_eyes',
    'red eyes': 'redness_of_eyes',

    # Weight & Appetite
    'losing weight': 'weight_loss',
    'lost weight': 'weight_loss',
    'not hungry': 'loss_of_appetite',
    'no appetite': 'loss_of_appetite',
    'dont want to eat': 'loss_of_appetite',

    # Mental
    'cant concentrate': 'lack_of_concentration',
    'trouble concentrating': 'lack_of_concentration',
    'memory loss': 'lack_of_concentration',
    'anxious': 'anxiety',
    'depressed': 'depression',
    'mood swings': 'mood_swings',
    'irritable': 'irritability',
}

# Symptom synonyms for fuzzy matching boost
SYMPTOM_SYNONYMS = {
    'fever': ['temperature', 'febrile', 'pyrexia'],
    'cough': ['coughing', 'dry cough', 'wet cough', 'persistent cough'],
    'fatigue': ['tiredness', 'exhaustion', 'weakness', 'lethargy'],
    'headache': ['head pain', 'cephalalgia', 'migraine'],
    'nausea': ['queasiness', 'sick feeling', 'nauseated'],
    'vomiting': ['puking', 'throwing up', 'emesis'],
    'dizziness': ['vertigo', 'lightheadedness', 'spinning feeling'],
    'rash': ['skin eruption', 'hives', 'dermatitis'],
    'breathlessness': ['dyspnea', 'shortness of breath', 'breathing difficulty'],
}

def clean_text(text):
    """Clean and normalize input text"""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fuzzy_match_symptom(word, symptom_list, threshold=0.80):
    """Find closest symptom using fuzzy string matching"""
    best_match = None
    best_score = 0
    word_clean = word.replace(' ', '_').lower()

    for symptom in symptom_list:
        # Direct ratio
        score = SequenceMatcher(None, word_clean, symptom).ratio()
        if score > best_score and score >= threshold:
            best_score = score
            best_match = symptom

        # Also check readable version
        readable = symptom.replace('_', ' ')
        score2 = SequenceMatcher(None, word.lower(), readable).ratio()
        if score2 > best_score and score2 >= threshold:
            best_score = score2
            best_match = symptom

    return best_match, best_score

def extract_symptoms_from_text(text, all_symptoms):
    """
    Main NLP function — extracts symptoms from natural language text.
    Returns: (matched_symptoms, unmatched_words, confidence_scores)
    """
    found = {}  # symptom -> confidence score
    text_clean = clean_text(text)

    # Step 1 — Natural language phrase matching (highest priority)
    for phrase, symptom in NL_MAP.items():
        if phrase in text_clean and symptom in all_symptoms:
            found[symptom] = max(found.get(symptom, 0), 0.95)

    # Step 2 — Direct symptom name matching
    for symptom in all_symptoms:
        readable = symptom.replace('_', ' ')
        if readable in text_clean:
            found[symptom] = max(found.get(symptom, 0), 0.99)
        elif symptom in text_clean:
            found[symptom] = max(found.get(symptom, 0), 0.99)

    # Step 3 — Synonym matching
    for symptom, synonyms in SYMPTOM_SYNONYMS.items():
        if symptom in all_symptoms:
            for syn in synonyms:
                if syn in text_clean:
                    found[symptom] = max(found.get(symptom, 0), 0.90)

    # Step 4 — Fuzzy matching on individual words and bigrams
    words = text_clean.split()
    # Single words
    for word in words:
        if len(word) > 4 and word not in ['have', 'been', 'feel', 'felt', 'very',
                                            'some', 'with', 'from', 'this', 'that',
                                            'also', 'like', 'much', 'more', 'only']:
            match, score = fuzzy_match_symptom(word, all_symptoms)
            if match and match not in found:
                found[match] = score * 0.85  # slight penalty for fuzzy

    # Bigrams (two word combinations)
    for i in range(len(words) - 1):
        bigram = f"{words[i]} {words[i+1]}"
        match, score = fuzzy_match_symptom(bigram, all_symptoms, threshold=0.75)
        if match:
            found[match] = max(found.get(match, 0), score * 0.90)

    # Filter by minimum confidence
    filtered = {s: c for s, c in found.items() if c >= 0.75}

    return list(filtered.keys()), filtered

def get_symptom_suggestions(partial_text, all_symptoms, limit=10):
    """Get symptom suggestions as user types"""
    partial = partial_text.lower().replace(' ', '_')
    suggestions = []
    for symptom in all_symptoms:
        if partial in symptom:
            suggestions.append(symptom.replace('_', ' ').title())
        if len(suggestions) >= limit:
            break
    return suggestions