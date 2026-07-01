import { createTranslator } from 'use-intl/core';
import { routing } from './routing';
import { notFound } from 'next/navigation';

export async function getTranslations(options: { locale: string; namespace?: string }) {
  const { locale, namespace } = options;
  if (!routing.locales.includes(locale as any)) notFound();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace });
}

export async function getMessages(options: { locale: string }) {
  const { locale } = options;
  if (!routing.locales.includes(locale as any)) notFound();
  return (await import(`../../messages/${locale}.json`)).default;
}
