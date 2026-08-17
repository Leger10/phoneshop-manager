import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {colors} from '../utils/theme';
import {Text, View, ActivityIndicator} from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import ClientsScreen from '../screens/ClientsScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Dashboard: 'Dashboard',
    Inventaire: 'Stock',
    Vente: 'POS',
    Clients: 'People',
    Plus: '+',
    Historique: 'List',
    Employes: 'Team',
    Stats: 'Stats',
  };
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{
        fontSize: focused ? 16 : 12,
        fontWeight: focused ? 'bold' : 'normal',
        color: focused ? colors.primary : colors.textSecondary,
      }}>
        {icons[label] || label}
      </Text>
      <Text style={{
        fontSize: 10,
        color: focused ? colors.primary : colors.textSecondary,
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: '#FFF',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: 4,
          height: 60,
        },
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Dashboard" focused={focused} />,
          title: 'Tableau de bord',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Inventaire" focused={focused} />,
          title: 'Inventaire',
        }}
      />
      <Tab.Screen
        name="NewSale"
        component={NewSaleScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <View style={{
              backgroundColor: colors.primary, borderRadius: 28,
              width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
              marginBottom: 10, elevation: 4,
            }}>
              <Text style={{color: '#FFF', fontSize: 24, fontWeight: 'bold'}}>+</Text>
            </View>
          ),
          title: 'Nouvelle Vente',
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Clients" focused={focused} />,
          title: 'Clients',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({focused}) => <TabIcon label="Employes" focused={focused} />,
          title: 'Plus',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: colors.primary}, headerTintColor: '#FFF'}}>
      <Stack.Screen name="EmployeesList" component={EmployeesScreen} options={{title: 'Employés'}} />
      <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{title: 'Historique Ventes'}} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{title: 'Rapports'}} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
