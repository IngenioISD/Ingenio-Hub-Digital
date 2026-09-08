import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser, Upload } from "lucide-react";

export type SignaturePadHandle = {
  /** Dibuja una imagen dentro del lienzo, sustituyendo lo que haya. */
  setFromImage: (url: string) => void;
};

type SignaturePadProps = {
  /** Devuelve el dataURL PNG de la firma, o null si se ha limpiado. */
  onChange: (dataUrl: string | null) => void;
  valorInicial?: string | null;
  height?: number;
};

/**
 * Panel de firma: se puede firmar a mano (Pointer Events) o subir una imagen.
 * El color del trazo se lee del sistema de diseño, no está fijado a un hex.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ onChange, valorInicial = null, height = 180 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dibujando = useRef(false);
    const [tieneTrazo, setTieneTrazo] = useState(Boolean(valorInicial));

    const dibujarImagen = (url: string) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.clientWidth, height);
        setTieneTrazo(true);
      };
      img.src = url;
    };

    useImperativeHandle(ref, () => ({
      setFromImage: dibujarImagen,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = window.devicePixelRatio || 1;
      const ancho = canvas.clientWidth;
      canvas.width = ancho * ratio;
      canvas.height = height * ratio;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const navy = getComputedStyle(document.documentElement)
        .getPropertyValue("--navy-deep")
        .trim();
      const navyFallback = getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-navy-deep")
        .trim();
      ctx.strokeStyle = navy || navyFallback || "#001e38";

      if (valorInicial) {
        dibujarImagen(valorInicial);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    const puntoDesdeEvento = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dibujando.current = true;
      const { x, y } = puntoDesdeEvento(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dibujando.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = puntoDesdeEvento(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onPointerUp = () => {
      if (!dibujando.current) return;
      dibujando.current = false;
      setTieneTrazo(true);
      const canvas = canvasRef.current;
      if (canvas) onChange(canvas.toDataURL("image/png"));
    };

    const limpiar = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setTieneTrazo(false);
      onChange(null);
    };

    const subirImagen = (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        dibujarImagen(dataUrl);
        const canvas = canvasRef.current;
        if (canvas) onChange(canvas.toDataURL("image/png"));
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="flex flex-col gap-2">
        <canvas
          ref={canvasRef}
          style={{
            height,
            width: "100%",
            backgroundColor: "var(--bg-surface)",
            border: "var(--border-width-thin) dashed var(--border-default)",
            borderRadius: "var(--radius-md)",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={limpiar}>
            <Eraser size={14} /> Limpiar
          </button>
          <label className="btn btn-secondary btn-sm cursor-pointer">
            <Upload size={14} /> Subir imagen
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirImagen(file);
                e.target.value = "";
              }}
            />
          </label>
          {!tieneTrazo ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              Firma con el dedo o el ratón, o sube una imagen.
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);

export default SignaturePad;
