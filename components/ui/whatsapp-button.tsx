"use client";
import { supportWaLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  context?: string;
}

export function WhatsAppButton({ context }: WhatsAppButtonProps) {
  const link = supportWaLink(context);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[4.5rem] right-3 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2.5 group"
      aria-label="Chat with ROSTER support on WhatsApp"
    >
      {/* Tooltip — visible on hover */}
      <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border text-text-primary text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
        Chat with us on WhatsApp
      </span>

      {/* Button */}
      <div
        className="w-11 h-11 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110"
        style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
      >
        {/* WhatsApp icon (SVG — no external dep) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-5 h-5 lg:w-7 lg:h-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.851L.057 23.5l5.799-1.522A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.674-.498-5.218-1.369l-.374-.222-3.44.902.919-3.352-.243-.387A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
      </div>
    </a>
  );
}
