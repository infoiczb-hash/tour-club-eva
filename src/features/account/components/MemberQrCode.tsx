"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface MemberQrCodeProps {
  bookingShortId: number;      // Booking.shortId (Int, уникальный)
  tourTitle: string;           // Tour.title
  tourStartDate?: Date | null; // TourDate.startDate (Date из Prisma)
  size?: number;
}

export default function MemberQrCode({
  bookingShortId,
  tourTitle,
  tourStartDate,
  size = 140,
}: MemberQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
const payload = `https://evatur.club/admin/scan?b=${bookingShortId}`;

    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch((err) => {
      console.error("[MemberQrCode]", err);
    });
  }, [bookingShortId, tourTitle, tourStartDate, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl"
      style={{ imageRendering: "pixelated" }}
      aria-label={`QR брони #${bookingShortId}`}
    />
  );
}