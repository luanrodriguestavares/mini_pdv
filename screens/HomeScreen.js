import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen({ navigation, route }) {
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            e.preventDefault();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RegisterSale')}>
                    <Icon name="shopping-cart" size={40} color="#fff" />
                    <Text style={styles.buttonText}>Registrar Venda</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RegisterProduct')}>
                    <Icon name="add-box" size={40} color="#fff" />
                    <Text style={styles.buttonText}>Cadastrar Produto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StockControl')}>
                    <Icon name="inventory" size={40} color="#fff" />
                    <Text style={styles.buttonText}>Controle de Estoque</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CashControl')}>
                    <Icon name="attach-money" size={40} color="#fff" />
                    <Text style={styles.buttonText}>Controle de Caixa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
        justifyContent: 'center',
    },
    grid: {
        padding: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    button: {
        width: '48%',
        height: '48%',
        aspectRatio: 1,
        backgroundColor: '#007bff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        marginTop: 10,
    },
});
