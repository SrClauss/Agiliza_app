'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { useAuthStore } from '@/stores/authStore';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "336362092732-0mh18n5bmpidmbs6n40v1llu05a16brv.apps.googleusercontent.com";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.context);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Ignorar rotas públicas (Landing, Login, Cadastro)
    if (pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/cadastro')) {
      return;
    }

    if (!token || !user) {
      if (pathname?.startsWith('/pro')) {
        router.push('/login/profissional');
      } else if (pathname?.startsWith('/cliente')) {
        router.push('/login/cliente');
      }
      return;
    }

    // REGRA DE SEGURANÇA 1: Profissionais são estritamente proibidos de acessar rotas /cliente/*
    if (role === 'PROFESSIONAL' && pathname?.startsWith('/cliente')) {
      console.warn(`[RoleGuard] Acesso negado: Profissional tentou acessar ${pathname}. Redirecionando para /pro.`);
      router.push('/pro');
      return;
    }

    // REGRA DE SEGURANÇA 2: Clientes são estritamente proibidos de acessar rotas /pro/*
    if (role === 'CLIENT' && pathname?.startsWith('/pro')) {
      console.warn(`[RoleGuard] Acesso negado: Cliente tentou acessar ${pathname}. Redirecionando para /cliente.`);
      router.push('/cliente');
      return;
    }
  }, [pathname, router, role, token, user]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
