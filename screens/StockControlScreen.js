import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { firestore, auth } from '../FirebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons'; 

const categories = [
    { label: 'Todos', value: '' },
    { label: 'Grãos e Cereais', value: 'graos_cereais' },
    { label: 'Doces e Snacks', value: 'doces_snacks' },
    { label: 'Bebidas', value: 'bebidas' },
    { label: 'Laticínios', value: 'laticinios' },
    { label: 'Carnes e Peixes', value: 'carnes_peixes' },
    { label: 'Frutas e Verduras', value: 'frutas_verduras' },
    { label: 'Produtos de Limpeza', value: 'produtos_limpeza' },
    { label: 'Higiene Pessoal', value: 'higiene_pessoal' },
];

const StockControlScreen = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showExpiringSoon, setShowExpiringSoon] = useState(false);  // Novo estado para o filtro de validade
    const [loading, setLoading] = useState(true); 
    const navigation = useNavigation();

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
            filterProducts(productsList, searchTerm, selectedCategory, showExpiringSoon);
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

    const filterProducts = (productsList = products, searchTerm = '', category = '', expiringSoon = false) => {
        const currentMonth = new Date().getMonth();  // Mês atual
        const currentYear = new Date().getFullYear(); // Ano atual

        const filtered = productsList.filter(product => {
            const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = category ? product.category === category : true;

            // Filtro para produtos com validade próxima (mês atual)
            const expiryDate = new Date(product.expiryDate);
            const matchesExpiry = !expiringSoon || (expiryDate.getMonth() === currentMonth && expiryDate.getFullYear() === currentYear);

            return matchesSearchTerm && matchesCategory && matchesExpiry;
        });

        setFilteredProducts(filtered);
    };

    const handleSearch = (text) => {
        setSearchTerm(text);
        filterProducts(products, text, selectedCategory, showExpiringSoon);
    };

    const handleCategorySelect = (value) => {
        setSelectedCategory(value);
        filterProducts(products, searchTerm, value, showExpiringSoon);
        setShowFilterModal(false);
    };

    const toggleExpiringSoon = () => {
        const newExpiringSoon = !showExpiringSoon;
        setShowExpiringSoon(newExpiringSoon);
        filterProducts(products, searchTerm, selectedCategory, newExpiringSoon);
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity style={styles.productContainer} onPress={() => navigation.navigate('ProductDetailScreen', { product: item, refreshProducts: loadProductsFromFirestore })}>
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDetails}>Preço de Venda: {item.sellPrice}</Text>
                <Text style={styles.productDetails}>Quantidade: {item.quantity}</Text>
                <Text style={styles.productDetails}>Validade: {new Date(item.expiryDate).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TextInput style={styles.searchInput} placeholder="Buscar produto" value={searchTerm} onChangeText={handleSearch}/>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setShowFilterModal(true)}>
                    <Icon name="filter" size={20} color="#fff" style={styles.icon} />
                    <Text style={styles.primaryButtonText}>Filtrar por Categoria</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.expiryButton} onPress={toggleExpiringSoon}>
                    <Icon name="time-outline" size={20} color="#fff" style={styles.icon} />
                    <Text style={styles.primaryButtonText}>{showExpiringSoon ? 'Mostrar Todos' : 'Próximos à Validade'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showFilterModal} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.value}
                                style={styles.categoryButton}
                                onPress={() => handleCategorySelect(category.value)}
                            >
                                <Text style={styles.categoryText}>{category.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowFilterModal(false)}>
                            <Text style={styles.secondaryButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProductItem}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
        padding: 20,
    },
    buttonRow: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 20,
    },
    expiryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        flex: 1,  
    },
    searchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    productContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginVertical: 6,
    },
    productInfo: {
        flexDirection: 'column',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    productDetails: {
        fontSize: 14,
        color: '#555',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    categoryButton: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    categoryText: {
        fontSize: 16,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        flex: 1,
        marginRight: 10, 
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
    icon: {
        marginRight: 10,
    },
});

export default StockControlScreen;
