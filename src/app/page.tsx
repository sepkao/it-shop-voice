"use client";

import { useEffect, useRef, useState } from "react";

type ApiResult = {
  transcript?: string;
  answer?: string;
  matches?: Array<any>;
  error?: string;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("พร้อมพูดแล้ว");
  const [result, setResult] = useState<ApiResult>({});

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // รองรับ Chrome: webkitSpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์นี้ไม่รองรับ Web Speech API (แนะนำ Chrome เท่านั้น)");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false; // เอาเฉพาะผลสุดท้าย
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("กำลังฟัง... พูดคำถามได้เลยครับ");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("หยุดฟังแล้ว");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`เกิดข้อผิดพลาด: ${e?.error || "unknown"}`);
      setResult({ error: e?.error || "speech error" });
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setStatus("ได้ข้อความแล้ว กำลังส่งไปถามระบบ...");
      setResult({ transcript });

      // ส่ง transcript ไป server (ไม่ส่งไฟล์เสียงแล้ว)
      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: ApiResult = await resp.json();
      setResult(data);
      setStatus(data.error ? "เกิดข้อผิดพลาด" : "เสร็จสิ้น");
    };

    recognitionRef.current = rec;
  }, []);

  function start() {
    setResult({});
    try {
      recognitionRef.current?.start();
    } catch {
      // บางครั้ง start ซ้ำเร็วเกิน จะ throw
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

 return (
  <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          🎙️ IT Shop Voice Q&A
        </h1>
        <p className="text-sm opacity-70 mt-2">
          กดเริ่มแล้วพูด เช่น “มี SSD 1TB ไหม ราคาเท่าไหร่”
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        {!isListening ? (
          <button
            onClick={start}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all font-medium shadow-lg"
          >
            ▶ เริ่มพูด
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 transition-all font-medium shadow-lg animate-pulse"
          >
            ⏹ หยุด
          </button>
        )}

        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm">
          {status}
        </div>
      </div>

      {/* Results */}
      <section className="mt-10 space-y-6">

        {/* Transcript */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="font-semibold text-lg mb-3">📝 ข้อความที่ถอดเสียง</div>
          <div className="text-sm opacity-90">
            {result.transcript || "—"}
          </div>
        </div>

        {/* Answer */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="font-semibold text-lg mb-3">💬 คำตอบ</div>
          <div className="text-sm whitespace-pre-line">
            {result.answer || "—"}
          </div>

          {result.error && (
            <div className="mt-4 text-red-400 text-sm">
              ⚠ {result.error}
            </div>
          )}
        </div>

        {/* Matches */}
        {result.matches && result.matches.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {result.matches.map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
              >
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm opacity-70 mt-1">
                  💰 {item.price?.toLocaleString()} บาท
                </div>
                <div className="text-sm opacity-70">
                  📦 คงเหลือ {item.stock}
                </div>
              </div>
            ))}
          </div>
        )}

      </section>
    </div>
  </main>
);

}
