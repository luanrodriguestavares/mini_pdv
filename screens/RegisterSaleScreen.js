import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, getDocs, addDoc, doc, writeBatch } from 'firebase/firestore';
import { auth, firestore } from '../FirebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const paymentMethods = [
    { label: 'Espécie', value: 'cash' },
    { label: 'Cartão Débito', value: 'debit_card' },
    { label: 'Cartão Crédito', value: 'credit_card' },
    { label: 'Pix', value: 'pix' },
];

const RegisterSaleScreen = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false); // State to track if the sale is being finalized

    const loadProductsFromFirestore = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Erro', 'Usuário não está autenticado.');
                return;
            }

            const productsCollectionRef = collection(firestore, `users/${userId}/produtos`);
            const querySnapshot = await getDocs(productsCollectionRef);
            const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setProducts(productsList);
        } catch (error) {
            console.error('Erro ao carregar produtos do Firestore:', error);
            Alert.alert('Erro', 'Não foi possível carregar os produtos do Firebase.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProductsFromFirestore();
        }, [])
    );

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => {
            const price = parseFloat(item.sellPrice.replace('R$ ', '').replace(',', '.')) || 0; 
            return sum + (price * item.quantity);
        }, 0);
        setTotalAmount(newTotal);
    }, [cart]);

    const addToCart = (product) => {
        if (product.quantity <= 0) {
            Alert.alert('Erro', 'Produto não disponível para venda (quantidade insuficiente).');
            return;
        }

        setCart(prevCart => {
            const productExists = prevCart.find(item => item.name === product.name);
            if (productExists) {
                if (productExists.quantity + 1 > product.quantity) {
                    Alert.alert('Erro', 'Quantidade máxima disponível atingida.');
                    return prevCart; 
                }
                return prevCart.map(item =>
                    item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateProductQuantities = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Erro', 'Usuário não está autenticado.');
            return;
        }

        const batch = writeBatch(firestore); 
        for (const product of products) {
            const cartItem = cart.find(item => item.name === product.name);
            if (cartItem) {
                const productRef = doc(firestore, `users/${userId}/produtos`, product.id);
                const newQuantity = product.quantity - cartItem.quantity;
                batch.update(productRef, { quantity: newQuantity });
            }
        }
        await batch.commit(); 
    };

    const finalizeSale = async () => {
        if (cart.length === 0) {
            Alert.alert('Erro', 'Seu carrinho está vazio. Adicione produtos antes de finalizar a venda.');
            return;
        }

        if (!paymentMethod) {
            Alert.alert('Erro', 'Selecione um método de pagamento.');
            return;
        }

        const currentDate = new Date();
        const date = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

        const saleDetails = { totalAmount, paymentMethod, date, items: cart };

        setIsFinalizing(true); // Start the loading state
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Erro', 'Usuário não está autenticado.');
                return;
            }

            const salesCollectionRef = collection(firestore, `users/${userId}/vendas`);
            await addDoc(salesCollectionRef, saleDetails);

            const existingSales = await AsyncStorage.getItem('vendas');
            const salesList = existingSales ? JSON.parse(existingSales) : [];
            salesList.push(saleDetails);
            await AsyncStorage.setItem('vendas', JSON.stringify(salesList));

            await updateProductQuantities(); 
            await loadProductsFromFirestore(); 

            Alert.alert('Sucesso', 'Venda registrada com sucesso!');
            setCart([]);
            setTotalAmount(0);
            setPaymentMethod('');
        } catch (error) {
            console.error('Erro ao registrar a venda:', error);
            Alert.alert('Erro', 'Não foi possível registrar a venda.');
        } finally {
            setIsFinalizing(false); 
        }
    };

    const renderProductItem = ({ item }) => {
        return (
            <TouchableOpacity onPress={() => addToCart(item)} style={styles.productContainer}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDetails}>
                    Preço de Venda: R$ {item.sellPrice ? parseFloat(item.sellPrice.replace('R$ ', '').replace(',', '.')).toFixed(2) : 'N/A'}
                </Text>
                <Text style={styles.productDetails}>Quantidade disponível: {item.quantity}</Text>
            </TouchableOpacity>
        );
    };

    const selectPaymentMethod = (value) => {
        setPaymentMethod(value);
        setShowPaymentModal(false);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.sectionTitle}>Carrinho</Text>
            <View style={styles.cartContainer}>
                <FlatList data={cart} keyExtractor={(item) => item.name} renderItem={({ item }) => (
                        <View style={styles.cartItem}>
                            <Text>{item.name} - Quantidade: {item.quantity}</Text>
                        </View>
                    )}
                />
            </View>

            <Text style={styles.sectionTitle}>Produtos Disponíveis</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.name}
                renderItem={renderProductItem}
                contentContainerStyle={styles.productList}
            />

            <Text style={styles.totalAmount}>Total: R$ {totalAmount.toFixed(2)}</Text>

            <TouchableOpacity onPress={() => setShowPaymentModal(true)} style={styles.paymentButton}>
                <MaterialIcons name="payment" size={24} color="#000" />
                <Text style={styles.paymentButtonText}>
                    {paymentMethod ? `Método de pagamento: ${paymentMethod}` : 'Selecione um método de pagamento'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={finalizeSale} style={styles.finalizeButton}>
                {isFinalizing ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.finalizeButtonText}>Finalizar Venda</Text>
                )}
            </TouchableOpacity>

            <Modal visible={showPaymentModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <FlatList data={paymentMethods} keyExtractor={(item) => item.value} renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => selectPaymentMethod(item.label)}>
                                    <Text style={styles.modalItem}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f4f7',
    },
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    productContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 1,
    },
    productName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    productDetails: {
        fontSize: 14,
        color: '#555',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        alignSelf: 'flex-end',
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginVertical: 10,
    },
    paymentButtonText: {
        color: '#333',
        marginLeft: 10,
    },
    finalizeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        marginVertical: 10,
    },
    finalizeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    cartContainer: {
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 1,
        padding: 10,
        marginVertical: 10,
    },
    cartItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: '#80807F',
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    productList: {
        paddingBottom: 20,
    },
});

export default RegisterSaleScreen;
