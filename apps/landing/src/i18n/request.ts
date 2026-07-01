import {notFound} from 'next/navigation';

import {routing} from './routing';
export default async function config({requestLocale}: any) {
  const locale = await requestLocale;
  // @ts-ignore
  if (!routing.locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
}
