import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors, formatCurrency} from '../utils/theme';

interface ReportsData {
  sales_by_date: {date: string; total: number; count: number}[];
  sales_by_payment: {payment_method: string; total: number; count: number}[];
}

interface ProductsData {
  top_products: {id: number; name: string; brand: string; total_sold: number}[];
  low_stock_products: {id: number; name: string; stock: number; category: {name: string}}[];
}

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<'sales' | 'products'>('sales');
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState<ReportsData | null>(null);
  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get(`/reports/sales?period=${period}`),
        api.get('/reports/products'),
      ]);
      setSalesData(salesRes.data);
      setProductsData(productsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const paymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash', card: 'Carte', mobile: 'Mobile', transfer: 'Virement',
    };
    return labels[method] || method;
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
          onPress={() => setActiveTab('sales')}>
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>Ventes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}>
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Produits</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sales' && (
        <View style={styles.content}>
          <View style={styles.periodBar}>
            {['week', 'month', 'year'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodActive]}
                onPress={() => setPeriod(p)}>
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ventes par jour</Text>
            {salesData?.sales_by_date?.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{item.date}</Text>
                <Text style={styles.dataValue}>{formatCurrency(item.total)}</Text>
                <Text style={styles.dataCount}>{item.count} vente(s)</Text>
              </View>
            ))}
            {(!salesData?.sales_by_date || salesData.sales_by_date.length === 0) && (
              <Text style={styles.emptyText}>Aucune donnée</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Par mode de paiement</Text>
            {salesData?.sales_by_payment?.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{paymentLabel(item.payment_method)}</Text>
                <Text style={styles.dataValue}>{formatCurrency(item.total)}</Text>
                <Text style={styles.dataCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'products' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top 10 Produits vendus</Text>
            {productsData?.top_products?.map((item, index) => (
              <View key={item.id} style={styles.dataRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <View style={styles.dataInfo}>
                  <Text style={styles.dataLabel}>{item.name}</Text>
                  <Text style={styles.dataSub}>{item.brand}</Text>
                </View>
                <Text style={styles.dataValue}>{item.total_sold} vendu(s)</Text>
              </View>
            ))}
            {(!productsData?.top_products || productsData.top_products.length === 0) && (
              <Text style={styles.emptyText}>Aucune donnée</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stock bas</Text>
            {productsData?.low_stock_products?.map(item => (
              <View key={item.id} style={styles.dataRow}>
                <View style={styles.dataInfo}>
                  <Text style={styles.dataLabel}>{item.name}</Text>
                  <Text style={styles.dataSub}>{item.category?.name}</Text>
                </View>
                <View style={[styles.stockBadge, item.stock === 0 && styles.stockOut]}>
                  <Text style={styles.stockText}>{item.stock}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  tab: {flex: 1, padding: 14, alignItems: 'center'},
  tabActive: {borderBottomWidth: 3, borderBottomColor: colors.primary},
  tabText: {fontSize: 15, color: colors.textSecondary},
  tabTextActive: {color: colors.primary, fontWeight: 'bold'},
  content: {padding: 10},
  periodBar: {flexDirection: 'row', gap: 8, marginBottom: 12},
  periodBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  periodActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  periodText: {fontSize: 13, color: colors.text},
  periodTextActive: {color: '#FFF', fontWeight: 'bold'},
  card: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 1,
  },
  cardTitle: {fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 12},
  dataRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rank: {fontSize: 14, fontWeight: 'bold', color: colors.primary, marginRight: 10, width: 30},
  dataInfo: {flex: 1},
  dataLabel: {fontSize: 14, fontWeight: '600', color: colors.text},
  dataSub: {fontSize: 12, color: colors.textSecondary},
  dataValue: {fontSize: 14, fontWeight: 'bold', color: colors.success},
  dataCount: {fontSize: 12, color: colors.textSecondary, marginLeft: 8},
  stockBadge: {
    backgroundColor: colors.warning, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  stockOut: {backgroundColor: colors.error},
  stockText: {color: '#FFF', fontSize: 12, fontWeight: 'bold'},
  emptyText: {textAlign: 'center', color: colors.textSecondary, padding: 20},
});
