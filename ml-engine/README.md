---
title: HealthBot ML Engine
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# HealthBot ML Engine

Medical symptom analysis API for HealthBot chatbot.

## Models
- Random Forest
- Gradient Boosting
- Naive Bayes

(Trained fresh from `data/merged_dataset.csv` on every startup — see
`app.py` — there's no persisted model file, so `saved_models/` is
currently unused.)

## Endpoints
- GET / — Engine status and accuracy
- POST /predict — Predict disease from symptoms
- GET /symptoms — List all symptoms
- GET /diseases — List all diseases
- GET /model-stats — Model accuracy details