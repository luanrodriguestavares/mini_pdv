import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { auth, firestore } from '../FirebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const Label = ({ text }) => (
    <Text style={styles.label}>{text}</Text>
);

const categories = [
    { label: 'Grãos e Cereais', value: 'graos_cereais' },
    { label: 'Doces e Snacks', value: 'doces_snacks' },
    { label: 'Bebidas', value: 'bebidas' },
    { label: 'Laticínios', value: 'laticinios' },
    { label: 'Carnes e Peixes', value: 'carnes_peixes' },
    { label: 'Frutas e Verduras', value: 'frutas_verduras' },
    { label: 'Produtos de Limpeza', value: 'produtos_limpeza' },
    { label: 'Higiene Pessoal', value: 'higiene_pessoal' },
];

export default function RegisterProductScreen() {
    const [name, setName] = useState('');
    const [buyPrice, setBuyPrice] = useState('R$ 0,00');
    const [sellPrice, setSellPrice] = useState('R$ 0,00'); 
    const [quantity, setQuantity] = useState('');
    const [location, setLocation] = useState('');
    const [expiryDate, setExpiryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [category, setCategory] = useState('');
    const [showModal, setShowModal] = useState(false);

    const formatCurrency = (value) => {
        const cleanedValue = value.replace(/\D/g, ''); 
        const formattedValue = (cleanedValue / 100).toFixed(2).replace('.', ','); 
        return `R$ ${formattedValue}`;
    };

    const handleBuyPriceChange = (value) => {
        if (value === '') {
            setBuyPrice('R$ 0,00');
        } else {
            setBuyPrice(formatCurrency(value)); 
        }
    };

    const handleSellPriceChange = (value) => {
        if (value === '') {
            setSellPrice('R$ 0,00'); 
        } else {
            setSellPrice(formatCurrency(value));
        }
    };

    const showDateSelector = () => {
        setShowDatePicker(true);
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || expiryDate;
        setShowDatePicker(false);
        setExpiryDate(currentDate);
    };

    const handleRegisterProduct = async () => {
        const userId = auth.currentUser?.uid; 
        if (!userId) {
            Alert.alert('Erro', 'Usuário não está autenticado.');
            return;
        }
    
        const product = {
            name,
            buyPrice,
            sellPrice,
            quantity,
            location,
            category,
            expiryDate: expiryDate.toISOString(),
        };

        try {
            const productCollectionRef = collection(firestore, `users/${userId}/produtos`);
            
            await addDoc(productCollectionRef, product);
    
            Alert.alert('Produto registrado com sucesso!');
            resetForm();
        } catch (error) {
            console.error('Erro ao registrar o produto:', error);
            Alert.alert('Erro ao registrar o produto!');
        }
    };

    const resetForm = () => {
        setName('');
        setBuyPrice('R$ 0,00');
        setSellPrice('R$ 0,00');
        setQuantity('');
        setLocation('');
        setExpiryDate(new Date());
        setCategory('');
        setShowModal(false); 
    };

    const selectCategory = (value) => {
        setCategory(value); 
        setShowModal(false); 
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
            <View style={styles.innerContainer}>
                <Label text="Nome do Produto" />
                <TextInput value={name} onChangeText={setName} style={styles.input} />

                <View style={styles.row}>
                    <View style={styles.inputContainer}>
                        <Label text="Valor de Compra" />
                        <TextInput value={buyPrice} onChangeText={handleBuyPriceChange} keyboardType="numeric" style={styles.input} />
                    </View>
                    <View style={styles.inputContainer}>
                        <Label text="Valor de Venda" />
                        <TextInput value={sellPrice} onChangeText={handleSellPriceChange} keyboardType="numeric" style={styles.input} />
                    </View>
                </View>

                <Label text="Quantidade" />
                <TextInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} />

                <Label text="Local de Compra" />
                <TextInput value={location} onChangeText={setLocation} style={styles.input} />

                <Label text="Categoria" />
                <TouchableOpacity style={styles.input} onPress={() => setShowModal(true)}>
                    <Text>{category ? category : 'Selecione uma categoria...'}</Text>
                </TouchableOpacity>

                <Modal visible={showModal} transparent={true} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <FlatList data={categories} keyExtractor={(item) => item.value} renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => selectCategory(item.value)}>
                                    <Text style={styles.modalItem}>{item.label}</Text> 
                                </TouchableOpacity>
                            )} />
                        </View>
                    </View>
                </Modal>

                <Label text="Data de Validade" />
                <TouchableOpacity onPress={showDateSelector} style={styles.dateInput}>
                    <Text style={styles.dateText}>
                        {expiryDate.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker value={expiryDate} mode="date" display="default" onChange={onDateChange}/>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleRegisterProduct}>
                    <FontAwesome name="check" size={24} color="white" />
                    <Text style={styles.primaryButtonText}>
                        Registrar Produto
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    innerContainer: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        flex: 1,
        marginRight: 10,
    },
    dateInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
    },
    dateText: {
        fontSize: 14,
        color: '#333',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
    },
    modalItem: {
        padding: 10,
        fontSize: 16,
    },
});
