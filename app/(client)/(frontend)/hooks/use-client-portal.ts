 
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/_common/hooks/use-auth';

export function useClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/client/dashboard?clientId=${user.id}`)
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
  }, [user]);

  return { data, loading, error };
}

export function useClientPatrimoine() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/client/patrimoine?clientId=${user.id}`)
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
  }, [user]);

  return { data, loading, error };
}

export function useClientObjectives(status?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const url = `/api/client/objectives?clientId=${user.id}${status ? `&status=${status}` : ''}`;
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
  }, [user, status]);

  return { data, loading, error };
}
