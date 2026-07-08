import { useContext, useState, useEffect, createContext, type ReactNode } from 'react';
import { auth, db } from '../firebase';
import { type User, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    userRole: 'student' | 'admin' | null;
    profileData: any;
    resetPassword: (email: string) => Promise<void>;
    selectedExam: string;
    setSelectedExam: (exam: string) => void;
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
    const [selectedExam, setSelectedExamState] = useState<string>(() => localStorage.getItem('selectedTargetExam') || 'SSC');

    const setSelectedExam = (exam: string) => {
        setSelectedExamState(exam);
        localStorage.setItem('selectedTargetExam', exam);
    };

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
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role as 'student' | 'admin');
                        setProfileData(data);
                    } else {
                        // Create the missing document in Firestore using their Auth details
                        const newProfile = {
                            fullName: user.displayName || 'Student',
                            email: user.email || 'student@example.com',
                            role: 'student',
                            status: 'active',
                            createdAt: new Date(),
                            joinedDate: new Date()
                        };
                        await setDoc(userDocRef, newProfile);
                        setUserRole('student');
                        setProfileData(newProfile);
                    }
                } catch (error) {
                    console.error("Error fetching or creating user profile:", error);
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
        resetPassword,
        selectedExam,
        setSelectedExam
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
