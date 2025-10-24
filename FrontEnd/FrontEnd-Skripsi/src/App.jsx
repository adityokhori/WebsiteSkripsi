import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function SentimentAnalyzer() {
  // State untuk menyimpan input teks dari user
  const [text, setText] = useState('');
  
  // State untuk menyimpan hasil analisis dari backend (2 model)
  const [result, setResult] = useState(null);
  
  // State untuk menandai apakah sedang loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk menyimpan pesan error
  const [error, setError] = useState('');

  // Fungsi untuk menentukan warna berdasarkan sentimen
  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positif') return 'text-green-500';
    if (sentiment === 'negatif') return 'text-red-500';
    return 'text-gray-500';
  };

  // Fungsi untuk menentukan warna background badge
  const getSentimentBgColor = (sentiment) => {
    if (sentiment === 'positif') return 'bg-green-100';
    if (sentiment === 'negatif') return 'bg-red-100';
    return 'bg-gray-100';
  };

  // Fungsi untuk menangani klik tombol analisis
  const handleAnalyze = async () => {
    // Validasi: cek apakah input kosong
    if (!text.trim()) {
      setError('Masukkan teks terlebih dahulu.');
      return;
    }

    // Reset error dan result sebelumnya
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      // Kirim POST request ke backend FastAPI
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      // Cek apakah response berhasil
      if (!response.ok) {
        throw new Error('Gagal menganalisis sentimen. Pastikan backend aktif.');
      }

      // Parse hasil response
      const data = await response.json();
      setResult(data);
    } catch (err) {
      // Tangani error jika terjadi kesalahan
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      // Matikan loading state
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani tombol Enter di textarea
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header / Judul Aplikasi */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Uji Sentimen Komentar
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Perbandingan Model Imbalanced vs Balanced Data
        </p>

        {/* Textarea untuk input teks */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Masukkan Komentar atau Ulasan
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Contoh: Produk ini sangat bagus dan berkualitas!"
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tips: Tekan Ctrl+Enter untuk analisis cepat
          </p>
        </div>

        {/* Tombol Analisis */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              {/* Loading Spinner */}
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Menganalisis...
            </>
          ) : (
            'Analisis Sentimen'
          )}
        </button>

        {/* Tampilkan Error jika ada */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tampilkan Hasil Analisis - 2 Model Side by Side */}
        {result && (
          <div className="mt-8 grid md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Model 1: Imbalanced Data */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Model Imbalanced
                </h2>
                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-semibold">
                  Model 1
                </span>
              </div>
              
              {/* Label Sentimen Imbalanced */}
              <div className="text-center mb-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-xl font-bold ${getSentimentColor(
                    result.imbalanced?.predicted_sentiment || result.predicted_sentiment
                  )} ${getSentimentBgColor(result.imbalanced?.predicted_sentiment || result.predicted_sentiment)}`}
                >
                  {(result.imbalanced?.predicted_sentiment || result.predicted_sentiment).toUpperCase()}
                </span>
              </div>

              {/* Confidence Score Imbalanced */}
              <div>
                <p className="text-gray-600 text-sm mb-2 text-center">Tingkat Keyakinan</p>
                <p className="text-3xl font-bold text-gray-800 text-center mb-3">
                  {((result.imbalanced?.confidence || result.confidence) * 100).toFixed(2)}%
                </p>
                
                {/* Progress Bar untuk Confidence */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(result.imbalanced?.confidence || result.confidence) * 100}%` }}
                  />
                </div>
                
                {/* Detail Probabilitas Semua Kelas */}
                {result.imbalanced?.probabilities && (
                  <div className="mt-4 space-y-2 text-xs">
                    <p className="font-semibold text-gray-700 mb-2">Detail Probabilitas:</p>
                    {Object.entries(result.imbalanced.probabilities).map(([sentiment, prob]) => (
                      <div key={sentiment} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{sentiment}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                sentiment === 'positif' ? 'bg-green-500' : 
                                sentiment === 'negatif' ? 'bg-red-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Model 2: Balanced Data */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Model Balanced
                </h2>
                <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full font-semibold">
                  Model 2
                </span>
              </div>
              
              {/* Label Sentimen Balanced */}
              <div className="text-center mb-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-xl font-bold ${getSentimentColor(
                    result.balanced?.predicted_sentiment || result.predicted_sentiment
                  )} ${getSentimentBgColor(result.balanced?.predicted_sentiment || result.predicted_sentiment)}`}
                >
                  {(result.balanced?.predicted_sentiment || result.predicted_sentiment).toUpperCase()}
                </span>
              </div>

              {/* Confidence Score Balanced */}
              <div>
                <p className="text-gray-600 text-sm mb-2 text-center">Tingkat Keyakinan</p>
                <p className="text-3xl font-bold text-gray-800 text-center mb-3">
                  {((result.balanced?.confidence || result.confidence) * 100).toFixed(2)}%
                </p>
                
                {/* Progress Bar untuk Confidence */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(result.balanced?.confidence || result.confidence) * 100}%` }}
                  />
                </div>
                
                {/* Detail Probabilitas Semua Kelas */}
                {result.balanced?.probabilities && (
                  <div className="mt-4 space-y-2 text-xs">
                    <p className="font-semibold text-gray-700 mb-2">Detail Probabilitas:</p>
                    {Object.entries(result.balanced.probabilities).map(([sentiment, prob]) => (
                      <div key={sentiment} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{sentiment}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                sentiment === 'positif' ? 'bg-green-500' : 
                                sentiment === 'negatif' ? 'bg-red-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Perbandingan Kesimpulan (jika hasil berbeda) */}
        {result && result.imbalanced && result.balanced && 
         result.imbalanced.predicted_sentiment !== result.balanced.predicted_sentiment && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-fadeIn">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ <strong>Perbedaan Prediksi:</strong> Model menghasilkan sentimen yang berbeda. 
              Model Balanced cenderung lebih stabil pada data dengan distribusi merata.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by FastAPI Backend • Dual Model Comparison</p>
        </div>
      </div>

      {/* CSS untuk Animasi Fade In */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}