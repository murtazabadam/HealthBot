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
- SVM (RBF kernel)

## Endpoints
- GET / — Engine status and accuracy
- POST /predict — Predict disease from symptoms
- GET /symptoms — List all symptoms
- GET /diseases — List all diseases
- GET /model-stats — Model accuracy details