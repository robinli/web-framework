import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome</h1>
      <p>Go to the login page to access the dashboard.</p>
      <Link href="/login">Login</Link>
    </main>
  );
}
