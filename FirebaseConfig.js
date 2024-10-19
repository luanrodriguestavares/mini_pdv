import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDj5IJo4hPTjZh3DGQ-ywTQ07BfyllNAvo",
    authDomain: "mini-pdv.firebaseapp.com",
    projectId: "mini-pdv",
    storageBucket: "mini-pdv.appspot.com",
    messagingSenderId: "418867402811",
    appId: "1:418867402811:web:4fe7a5ffb22811cd5a241e",
    measurementId: "G-2VC6PP092M"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const firestore = getFirestore(app);

export { auth, firestore };
