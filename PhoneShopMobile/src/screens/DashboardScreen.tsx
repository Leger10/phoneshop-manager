import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import api from '../services/api';
import {colors, formatCurrency} from '../utils/theme';
import {useAuth} from '../context/AuthContext';

interface DashboardData {
  today_sales: number;
  month_sales: number;
  total_products: number;
  low_stock_products: number;
  total_clients: number;
  total_employees: number;
  today_transactions: number;
  recent_sales: any[];
}

export default function DashboardScreen({navigation}: any) {
  const {user} = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user?.name}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.primary}]}
          onPress={() => navigation.navigate('Sales')}>
          <Text style={styles.statValue}>{formatCurrency(data?.today_sales || 0)}</Text>
          <Text style={styles.statLabel}>Ventes aujourd'hui</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.success}]}
          onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.statValue}>{formatCurrency(data?.month_sales || 0)}</Text>
          <Text style={styles.statLabel}>Ce mois</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.accent}]}
          onPress={() => navigation.navigate('Inventory')}>
          <Text style={styles.statValue}>{data?.total_products || 0}</Text>
          <Text style={styles.statLabel}>Produits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.warning}]}
          onPress={() => navigation.navigate('Inventory')}>
          <Text style={styles.statValue}>{data?.low_stock_products || 0}</Text>
          <Text style={styles.statLabel}>Stock bas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data?.today_transactions || 0}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data?.total_clients || 0}</Text>
            <Text style={styles.summaryLabel}>Clients</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data?.total_employees || 0}</Text>
            <Text style={styles.summaryLabel}>Employés</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ventes récentes</Text>
        {data?.recent_sales?.map((sale: any) => (
          <View key={sale.id} style={styles.saleItem}>
            <View>
              <Text style={styles.saleClient}>{sale.client?.name || 'Client anonyme'}</Text>
              <Text style={styles.saleDate}>
                {new Date(sale.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.saleAmount}>{formatCurrency(sale.total)}</Text>
          </View>
        ))}
        {(!data?.recent_sales || data.recent_sales.length === 0) && (
          <Text style={styles.emptyText}>Aucune vente récente</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    margin: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  saleClient: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  saleDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 20,
  },
});
