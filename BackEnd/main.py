from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import uvicorn
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Sentiment Analysis API",
    description="API untuk menganalisis sentimen teks menggunakan 2 model Naive Bayes (Imbalanced vs Balanced)",
    version="2.0"
)

# ======================
# 1️⃣ Load Model Imbalanced
# ======================
with open("nb_model-IMBALANCED.pkl", "rb") as f:
    nb_model_imbalanced = pickle.load(f)

# ======================
# 2️⃣ Load Model Balanced
# ======================
with open("nb_model-BALANCED.pkl", "rb") as f:
    nb_model_balanced = pickle.load(f)

# ======================
# 3️⃣ Load TF-IDF Vectorizer (shared untuk kedua model)
# ======================
with open("tfidf_vectorizer-NEW.pkl", "rb") as f:
    tfidf_vectorizer = pickle.load(f)

# ======================
# 4️⃣ Pydantic Model untuk Input
# ======================
class TextInput(BaseModel):
    text: str

# ======================
# 5️⃣ CORS Middleware
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Untuk production, ganti dengan domain spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# 6️⃣ Endpoint Root
# ======================
@app.get("/")
def read_root():
    return {
        "message": "API Sentimen aktif dengan 2 model (Imbalanced vs Balanced).",
        "endpoints": {
            "/predict": "POST - Analisis sentimen dengan kedua model",
            "/docs": "GET - Dokumentasi interaktif API"
        }
    }

# ======================
# 7️⃣ Endpoint Prediksi (Dual Model) - UPDATED
# ======================
@app.post("/predict")
def predict_sentiment(input: TextInput):
    """
    Memprediksi sentimen menggunakan 2 model:
    - Model Imbalanced (trained dengan data tidak seimbang)
    - Model Balanced (trained dengan data seimbang)
    
    Mengembalikan detail probabilitas untuk setiap kelas sentimen
    """
    text = input.text

    # Transform teks jadi TF-IDF vector
    X_new = tfidf_vectorizer.transform([text])

    # ========================================
    # Prediksi dengan Model IMBALANCED
    # ========================================
    prediction_imbalanced = nb_model_imbalanced.predict(X_new)[0]
    proba_imbalanced = nb_model_imbalanced.predict_proba(X_new)[0]  # Array probabilitas untuk semua kelas
    
    # Dapatkan nama kelas dari model
    classes_imbalanced = nb_model_imbalanced.classes_
    
    # Buat dictionary probabilitas untuk setiap kelas
    probabilities_imbalanced = {
        str(class_name): round(float(prob), 4) 
        for class_name, prob in zip(classes_imbalanced, proba_imbalanced)
    }
    
    # Confidence adalah probabilitas tertinggi
    confidence_imbalanced = float(proba_imbalanced.max())

    # ========================================
    # Prediksi dengan Model BALANCED
    # ========================================
    prediction_balanced = nb_model_balanced.predict(X_new)[0]
    proba_balanced = nb_model_balanced.predict_proba(X_new)[0]  # Array probabilitas untuk semua kelas
    
    # Dapatkan nama kelas dari model
    classes_balanced = nb_model_balanced.classes_
    
    # Buat dictionary probabilitas untuk setiap kelas
    probabilities_balanced = {
        str(class_name): round(float(prob), 4) 
        for class_name, prob in zip(classes_balanced, proba_balanced)
    }
    
    # Confidence adalah probabilitas tertinggi
    confidence_balanced = float(proba_balanced.max())

    # ========================================
    # Return hasil dari kedua model dengan detail probabilitas
    # ========================================
    return {
        "input_text": text,
        "imbalanced": {
            "predicted_sentiment": prediction_imbalanced,
            "confidence": round(confidence_imbalanced, 4),
            "probabilities": probabilities_imbalanced  # Detail semua probabilitas
        },
        "balanced": {
            "predicted_sentiment": prediction_balanced,
            "confidence": round(confidence_balanced, 4),
            "probabilities": probabilities_balanced  # Detail semua probabilitas
        }
    }

# ======================
# 8️⃣ Endpoint Prediksi Single Model (Opsional)
# ======================
@app.post("/predict/imbalanced")
def predict_imbalanced_only(input: TextInput):
    """Prediksi hanya menggunakan model Imbalanced dengan detail probabilitas"""
    text = input.text
    X_new = tfidf_vectorizer.transform([text])
    
    prediction = nb_model_imbalanced.predict(X_new)[0]
    proba = nb_model_imbalanced.predict_proba(X_new)[0]
    classes = nb_model_imbalanced.classes_
    
    probabilities = {
        str(class_name): round(float(prob), 4) 
        for class_name, prob in zip(classes, proba)
    }

    return {
        "input_text": text,
        "model": "imbalanced",
        "predicted_sentiment": prediction,
        "confidence": round(float(proba.max()), 4),
        "probabilities": probabilities
    }

@app.post("/predict/balanced")
def predict_balanced_only(input: TextInput):
    """Prediksi hanya menggunakan model Balanced dengan detail probabilitas"""
    text = input.text
    X_new = tfidf_vectorizer.transform([text])
    
    prediction = nb_model_balanced.predict(X_new)[0]
    proba = nb_model_balanced.predict_proba(X_new)[0]
    classes = nb_model_balanced.classes_
    
    probabilities = {
        str(class_name): round(float(prob), 4) 
        for class_name, prob in zip(classes, proba)
    }

    return {
        "input_text": text,
        "model": "balanced",
        "predicted_sentiment": prediction,
        "confidence": round(float(proba.max()), 4),
        "probabilities": probabilities
    }

# ======================
# 9️⃣ Endpoint Info Model
# ======================
@app.get("/models/info")
def get_models_info():
    """Informasi tentang model yang tersedia"""
    return {
        "total_models": 2,
        "models": [
            {
                "name": "Imbalanced Model",
                "file": "nb_model-IMBALANCED.pkl",
                "description": "Model trained dengan data tidak seimbang (original distribution)",
                "classes": list(nb_model_imbalanced.classes_)
            },
            {
                "name": "Balanced Model",
                "file": "nb_model-BALANCED.pkl",
                "description": "Model trained dengan data seimbang (balanced distribution)",
                "classes": list(nb_model_balanced.classes_)
            }
        ],
        "vectorizer": "tfidf_vectorizer-NEW.pkl"
    }

# ======================
# 🔟 Menjalankan Server
# ======================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)