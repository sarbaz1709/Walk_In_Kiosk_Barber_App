import QRCode from "react-qr-code";
import { shop } from "@/config/shop";

export function QrBlock() {
  return (
    <div className="flex items-center gap-6">
      <QRCode
        value={shop.bookingUrl}
        size={112}
        fgColor="var(--color-ink)"
        bgColor="var(--color-bg)"
        title="Book another day"
      />
      <div>
        <p className="text-body">Book another day</p>
        <p className="text-small text-muted">Scan with your phone camera</p>
      </div>
    </div>
  );
}
