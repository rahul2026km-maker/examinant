import { useContext, useState, useEffect, createContext, type ReactNode } from 'react';
import { auth, db } from '../firebase';
import { type User, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    userRole: 'student' | 'admin' | null;
    profileData: any;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const resetPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    useEffect(() => {
        if (!auth) {
            console.warn("Auth service not available");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role as 'student' | 'admin');
                        setProfileData(data);
                    } else {
                        // Default to student if document doesn't exist but user is auth'd
                        setUserRole('student');
                        setProfileData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole('student'); // Fail safe
                    setProfileData(null);
                }
            } else {
                setUserRole(null);
                setProfileData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        userRole,
        profileData,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
