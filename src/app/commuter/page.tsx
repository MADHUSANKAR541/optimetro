import { redirect } from 'next/navigation';

export default function CommuterIndexPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  for (const key in searchParams || {}) {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (typeof value === 'string') {
      params.set(key, value);
    }
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  redirect(`/commuter/dashboard${suffix}`);
}


