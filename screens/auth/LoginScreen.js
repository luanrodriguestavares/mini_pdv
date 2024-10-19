import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Label = ({ text }) => (
    <Text style={styles.label}>{text}</Text>
);

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [loading, setLoading] = useState(false); 

    const handleLogin = async () => {
        setLoading(true); 
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("User UID:", user.uid);

            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(firestore, 'users', user.uid), {
                    businessName: businessName,
                    email: email,
                });
            }

            await AsyncStorage.setItem('isLoggedIn', 'true');
            await AsyncStorage.setItem('businessName', businessName);

            navigation.navigate('Home', { businessName: businessName });
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <Label text="Email" />
            <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="#aaa" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Digite seu email"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>
            <Label text="Senha" />
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#aaa" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            <Label text="Nome do Comércio" />
            <View style={styles.inputContainer}>
                <Icon name="building" size={20} color="#aaa" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Digite o nome do comércio"
                    value={businessName}
                    onChangeText={setBusinessName}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f0f4f7',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 10,
        fontSize: 14,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
