import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useClientDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/client/dashboard?clientId=${session.user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.json();
        })
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  return { data, loading, error };
}

export function useClientPatrimoine() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/client/patrimoine?clientId=${session.user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.json();
        })
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  return { data, loading, error };
}

export function useClientObjectives(status?: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const url = `/api/client/objectives?clientId=${session.user.id}${status ? `&status=${status}` : ''}`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.json();
        })
        .then(data => {
          setData(data.objectives || []);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session, status]);

  return { data, loading, error };
}
