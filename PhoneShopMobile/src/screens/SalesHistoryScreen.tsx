import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors, formatCurrency, formatDate} from '../utils/theme';

interface Sale {
  id: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  client: {name: string} | null;
  user: {name: string};
  items: {product: {name: string}; quantity: number; subtotal: number}[];
}

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      const res = await api.get(`/sales?search=${search}`);
      setSales(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const paymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash', card: 'Carte', mobile: 'Mobile', transfer: 'Virement',
    };
    return labels[method] || method;
  };

  const renderSale = ({item}: {item: Sale}) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View>
          <Text style={styles.saleId}>Vente #{item.id}</Text>
          <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.saleTotal}>{formatCurrency(item.total)}</Text>
      </View>

      <View style={styles.saleDetails}>
        <Text style={styles.saleClient}>
          Client: {item.client?.name || 'Anonyme'}
        </Text>
        <Text style={styles.saleSeller}>
          Vendeur: {item.user?.name}
        </Text>
        <Text style={styles.salePayment}>
          Paiement: {paymentLabel(item.payment_method)}
        </Text>
      </View>

      <View style={styles.saleItems}>
        {item.items?.map((saleItem, index) => (
          <Text key={index} style={styles.saleItemText}>
            {saleItem.quantity}x {saleItem.product?.name} - {formatCurrency(saleItem.subtotal)}
          </Text>
        ))}
      </View>

      <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusCompleted : styles.statusCancelled]}>
        <Text style={styles.statusText}>
          {item.status === 'completed' ? 'Terminée' : 'Annulée'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une vente..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textLight}
        />
      </View>
      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune vente trouvée</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  searchBar: {
    padding: 10, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  searchInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: colors.background,
  },
  list: {padding: 10},
  saleCard: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 14,
    marginBottom: 10, elevation: 1,
  },
  saleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleId: {fontSize: 16, fontWeight: 'bold', color: colors.text},
  saleDate: {fontSize: 12, color: colors.textSecondary, marginTop: 2},
  saleTotal: {fontSize: 18, fontWeight: 'bold', color: colors.success},
  saleDetails: {marginBottom: 8},
  saleClient: {fontSize: 13, color: colors.textSecondary},
  saleSeller: {fontSize: 13, color: colors.textSecondary},
  salePayment: {fontSize: 13, color: colors.textSecondary},
  saleItems: {borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8},
  saleItemText: {fontSize: 12, color: colors.textSecondary, marginBottom: 2},
  statusBadge: {
    alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8,
  },
  statusCompleted: {backgroundColor: '#E8F5E9'},
  statusCancelled: {backgroundColor: '#FFEBEE'},
  statusText: {fontSize: 11, fontWeight: 'bold'},
  emptyText: {textAlign: 'center', color: colors.textSecondary, marginTop: 40},
});
