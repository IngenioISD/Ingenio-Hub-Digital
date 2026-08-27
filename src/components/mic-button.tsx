import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type MicButtonProps = {
  /** Se llama con el texto reconocido; recibe el texto final acumulado. */
  onResult: (texto: string) => void;
  className?: string;
  title?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Botón de dictado por voz. Usa la API nativa del navegador.
 * Si no está disponible (Firefox, Opera) avisa por toast y no rompe nada.
 */
export function MicButton({ onResult, className, title = "Dictar" }: MicButtonProps) {
  const [grabando, setGrabando] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const alternar = () => {
    if (grabando) {
      recognitionRef.current?.stop();
      setGrabando(false);
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error("Reconocimiento de voz no disponible en este navegador");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let texto = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) texto += event.results[i][0].transcript;
      }
      if (texto.trim()) onResult(texto.trim());
    };
    recognition.onerror = () => {
      setGrabando(false);
    };
    recognition.onend = () => {
      setGrabando(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setGrabando(true);
    } catch {
      toast.error("Reconocimiento de voz no disponible en este navegador");
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      className={`btn-voice${grabando ? " recording" : ""}${className ? ` ${className}` : ""}`}
      title={grabando ? "Detener dictado" : title}
      aria-label={grabando ? "Detener dictado" : title}
    >
      {grabando ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}

export default MicButton;
