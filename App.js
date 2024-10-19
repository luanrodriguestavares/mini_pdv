import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import RegisterSaleScreen from './screens/RegisterSaleScreen';
import RegisterProductScreen from './screens/RegisterProductScreen';
import StockControlScreen from './screens/StockControlScreen';
import ProductDetailScreen from './screens/ProductDetailScreen'; 
import CashControlScreen from './screens/CashControlScreen'; 
import LoginScreen from './screens/auth/LoginScreen'; 

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#007bff' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }}}>
                <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Mini PDV' }} />
                <Stack.Screen 
                    name="Home" 
                    component={HomeScreen} 
                    options={({ route }) => ({ 
                        title: route.params.businessName,
                        headerBackVisible: false, 
                    })} 
                />                
                <Stack.Screen name="RegisterSale" component={RegisterSaleScreen} options={{ title: 'Registrar Venda' }} />
                <Stack.Screen name="RegisterProduct" component={RegisterProductScreen} options={{ title: 'Cadastrar Produto' }} />
                <Stack.Screen name="StockControl" component={StockControlScreen} options={{ title: 'Controle de Estoque' }} />
                <Stack.Screen name="ProductDetailScreen" component={ProductDetailScreen} options={{ title: 'Detalhes do Produto' }} /> 
                <Stack.Screen name="CashControl" component={CashControlScreen} options={{ title: 'Controle de Caixa' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
