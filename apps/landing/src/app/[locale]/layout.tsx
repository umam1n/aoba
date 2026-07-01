import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AOBA — Workforce Intelligence Platform",
  description: "AI-powered attrition prediction and HR analytics for Indonesian enterprises.",
};

export default async function RootLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
  }
) {
  const params = await props.params;
  const {
    locale
  } = params;

  // @ts-ignore
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} data-theme="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC" now={new Date()}>
          {props.children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
