import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const useAuthStatusAndRole = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // [MODIFICADO] Ya no verificamos user.emailVerified
                setLoggedIn(true);

                try {
                    // Obtener rol desde Firestore
                    const userRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setIsAdmin(data.role === 'admin');
                    }
                } catch (error) {
                    console.error("Error obteniendo rol de usuario:", error);
                }

            } else {
                setLoggedIn(false);
                setIsAdmin(false);
                setUserData(null);
            }
            setCheckingStatus(false);
        });

        return () => unsubscribe();
    }, []);

    return { loggedIn, checkingStatus, isAdmin, userData };
};