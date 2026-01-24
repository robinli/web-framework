'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAccessToken, getAccessToken } from '../../lib/auth';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type MeResponse = {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchMe = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearAccessToken();
          router.replace('/login');
          return;
        }

        const data = (await response.json()) as MeResponse;
        setUser(data);
      } catch (err) {
        setError('Unable to load user profile.');
      }
    };

    void fetchMe();
  }, [router]);

  const handleLogout = async () => {
    const token = getAccessToken();
    if (token) {
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    clearAccessToken();
    router.replace('/login');
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <section style={{ marginTop: '1rem' }}>
            <h2>Roles</h2>
            {user.roles.length ? (
              <ul>
                {user.roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            ) : (
              <p>No roles assigned.</p>
            )}
          </section>
          <section style={{ marginTop: '1rem' }}>
            <h2>Permissions</h2>
            {user.permissions.length ? (
              <ul>
                {user.permissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            ) : (
              <p>No permissions assigned.</p>
            )}
          </section>
          {user.permissions.includes('user.read') ? (
            <section
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                border: '1px solid #4b9d5f',
                borderRadius: '8px',
              }}
            >
              <h2>Protected Content</h2>
              <p>This section is visible because you have user.read.</p>
            </section>
          ) : null}
        </>
      ) : (
        <p>Loading profile...</p>
      )}
      <button type="button" onClick={handleLogout} style={{ marginTop: '1rem' }}>
        Logout
      </button>
    </main>
  );
}
