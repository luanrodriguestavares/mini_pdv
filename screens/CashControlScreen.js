import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../FirebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons'; 

const CashControlScreen = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [filteredSales, setFilteredSales] = useState([]);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);

    const loadSalesFromFirestore = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                alert('Usuário não autenticado.');
                return;
            }

            const salesCollectionRef = collection(firestore, `users/${userId}/vendas`);
            const querySnapshot = await getDocs(salesCollectionRef);
            const salesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesList);
            setFilteredSales(salesList);
        } catch (error) {
            console.error('Erro ao carregar as vendas:', error);
            alert('Erro ao carregar as vendas do Firebase.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalesFromFirestore();
    }, []);

    const filterSalesByDate = () => {
        if (!startDate || !endDate) {
            alert('Por favor, selecione tanto a data de início quanto a data de término.');
            return;
        }
        
        const filtered = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        setFilteredSales(filtered);
    };

    const resetFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setFilteredSales(sales);
        setIsFiltering(false);
    };

    const renderSaleItem = ({ item }) => (
        <View style={styles.saleItem}>
            <Text style={styles.saleText}>Data: {item.date}</Text>
            <Text style={styles.saleText}>Total: R$ {item.totalAmount.toFixed(2)}</Text>
            <Text style={styles.saleText}>Método de Pagamento: {item.paymentMethod}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterContainer}>
                {!isFiltering ? (
                    // Ícones de "Exibir Todas" e "Filtrar" compactos
                    <View style={styles.iconContainer}>
                        <TouchableOpacity onPress={resetFilter} style={styles.iconButton}>
                            <FontAwesome name="list" size={24} color="#007bff" />
                            <Text style={styles.iconText}>Exibir todas</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setIsFiltering(true)} style={styles.iconButton}>
                            <FontAwesome name="filter" size={24} color="#007bff" />
                            <Text style={styles.iconText}>Filtrar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Filtro de datas compacto
                    <View style={styles.datePickerContainer}>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.datePickerButton}>
                            <Text style={styles.datePickerText}>
                                {startDate ? startDate.toLocaleDateString() : 'Data de Início'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.datePickerButton}>
                            <Text style={styles.datePickerText}>
                                {endDate ? endDate.toLocaleDateString() : 'Data de Término'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <TouchableOpacity onPress={filterSalesByDate} style={styles.iconButton}>
                                <FontAwesome name="check" size={24} color="#007bff" />
                                <Text style={styles.iconText}>Aplicar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={resetFilter} style={styles.iconButton}>
                                <FontAwesome name="times" size={24} color="red" />
                                <Text style={styles.iconText}>Resetar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {showStartPicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        if (selectedDate) setStartDate(selectedDate);
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        if (selectedDate) setEndDate(selectedDate);
                    }}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : filteredSales.length === 0 ? (
                <Text style={styles.noSalesText}>Nenhuma venda encontrada no período selecionado.</Text>
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSaleItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    filterContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    iconText: {
        marginLeft: 5,
        color: '#007bff',
        fontSize: 16,
    },
    datePickerContainer: {
        marginTop: 10,
    },
    datePickerButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    datePickerText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    saleItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    saleText: {
        fontSize: 16,
        color: '#333',
    },
    noSalesText: {
        textAlign: 'center',
        fontSize: 18,
        color: '#333',
        marginTop: 20,
    },
    list: {
        paddingBottom: 20,
    },
});

export default CashControlScreen;
