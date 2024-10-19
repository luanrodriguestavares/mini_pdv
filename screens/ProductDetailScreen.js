import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { firestore, auth } from '../FirebaseConfig'; 
import Icon from 'react-native-vector-icons/MaterialIcons';

const formatCurrency = (value) => {
    if (typeof value !== 'string') {
        value = String(value);
    }
    const cleanedValue = value.replace(/\D/g, ''); 
    const formattedValue = (cleanedValue / 100).toFixed(2).replace('.', ','); 
    return `R$ ${formattedValue}`;
};

const ProductDetailScreen = ({ route, navigation }) => {
    const { product, refreshProducts } = route.params; 
    const [isEditing, setIsEditing] = useState(false); 
    const [buyPrice, setBuyPrice] = useState(product.buyPrice ? formatCurrency(product.buyPrice) : 'R$ 0,00');
    const [sellPrice, setSellPrice] = useState(product.sellPrice ? formatCurrency(product.sellPrice) : 'R$ 0,00');
    const [quantity, setQuantity] = useState(String(product.quantity || ''));
    const [location, setLocation] = useState(product.location || '');
    const [loading, setLoading] = useState(false); 

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

    const handleDeleteProduct = async () => {
        const userId = auth.currentUser?.uid; 
        if (!userId) {
            Alert.alert('Erro', 'Usuário não está autenticado.');
            return;
        }

        try {
            const productRef = doc(firestore, `users/${userId}/produtos/${product.id}`); 
            await deleteDoc(productRef); 
            Alert.alert('Sucesso', 'Produto excluído com sucesso!');
            refreshProducts(); 
            navigation.goBack(); 
        } catch (error) {
            console.error('Erro ao excluir o produto:', error);
            Alert.alert('Erro', 'Não foi possível excluir o produto.');
        }
    };

    const handleSaveChanges = async () => {
        const userId = auth.currentUser?.uid; 
        if (!userId) {
            Alert.alert('Erro', 'Usuário não está autenticado.');
            return;
        }

        const updatedProduct = {
            ...product,
            buyPrice: buyPrice,
            sellPrice: sellPrice, 
            quantity: Number(quantity) || 0, 
            location: location || '',
        };

        try {
            const productRef = doc(firestore, `users/${userId}/produtos/${product.id}`);
            await updateDoc(productRef, updatedProduct);
            Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
            refreshProducts();
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao atualizar o produto:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o produto.');
        }
    };

    return (
        <View style={styles.container}>
            {loading ? ( 
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <>
                    {product.image && (
                        <Image source={{ uri: product.image }} style={styles.image} />
                    )}
                    <Text style={styles.productName}>
                        {isEditing ? 'Editar Produto' : product.name}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Valor de Compra:</Text>
                        <TextInput style={styles.input} value={isEditing ? buyPrice : formatCurrency(product.buyPrice)} onChangeText={isEditing ? handleBuyPriceChange : undefined} editable={isEditing} keyboardType="numeric"
                            onBlur={() => {
                                if (isEditing) {
                                    const cleanedValue = parseCurrency(buyPrice); 
                                    setBuyPrice(formatCurrency(cleanedValue)); 
                                }
                            }}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Valor de Venda:</Text>
                        <TextInput style={styles.input} value={isEditing ? sellPrice : formatCurrency(product.sellPrice)} onChangeText={isEditing ? handleSellPriceChange : undefined} editable={isEditing} keyboardType="numeric"
                            onBlur={() => {
                                if (isEditing) {
                                    const cleanedValue = parseCurrency(sellPrice); 
                                    setSellPrice(formatCurrency(cleanedValue)); 
                                }
                            }}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Quantidade:</Text>
                        <TextInput style={styles.input} value={String(quantity)} onChangeText={setQuantity} editable={isEditing} keyboardType="numeric"/>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Local de Compra:</Text>
                        <TextInput style={styles.input} value={location} onChangeText={setLocation} editable={isEditing} />
                    </View>
                    
                    <Text style={styles.productDetails}>
                        Data de Validade: {new Date(product.expiryDate).toLocaleDateString()}
                    </Text>

                    <View style={styles.buttonContainer}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
                                    <Icon name="save" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Salvar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => setIsEditing(false)}>
                                    <Icon name="cancel" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
                                    <Icon name="edit" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteProduct}>
                                    <Icon name="delete" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Excluir</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f4f7',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#007bff',
        alignItems: 'center',
        marginHorizontal: 5,
        flexDirection: 'row', 
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 5, 
    },
    deleteButton: {
        backgroundColor: '#D42B54', 
    },
    productDetails: {
        marginTop: 10,
        fontSize: 14,
        color: '#777',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
    },
});

export default ProductDetailScreen;
