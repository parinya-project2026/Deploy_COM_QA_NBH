import type { Metadata } from 'next';
import type React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบบันทึกข้อมูล QA',
  description: 'แบบฟอร์มบันทึกข้อมูลคุณภาพโรงพยาบาล',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-slate-100 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
