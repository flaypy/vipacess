'use client';

import { useEffect } from 'react';
import { authAPI } from '@/lib/api';

export default function SessionManager() {
    useEffect(() => {
        const initializeSession = async () => {
            // Verifique se já existe um token
            const token = localStorage.getItem('auth_token');

            // Se não houver token, crie uma sessão de convidado
            if (!token) {
                console.log('No token found, creating guest session...');
                await authAPI.createGuestSession();
            }
        };

        initializeSession();
    }, []); // O array vazio [] garante que isso rode apenas uma vez, na montagem do componente

    return null; // Este componente não renderiza nada na tela
}