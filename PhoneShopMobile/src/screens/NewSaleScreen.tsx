import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors, formatCurrency} from '../utils/theme';

interface Product {
  id: number; name: string; brand: string; model: string;
  price: number; stock: number; category: {name: string};
}

interface CartItem {
  product: Product; quantity: number;
}

export default function NewSaleScreen({navigation}: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [clientId, setClientId] = useState('');
  const [showCart, setShowCart] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get(`/products?search=${search}&per_page=50`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Indisponible', 'Ce produit est en rupture de stock');
      return;
    }
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        Alert.alert('Stock max', 'Stock maximum atteint');
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? {...item, quantity: item.quantity + 1}
          : item
      ));
    } else {
      setCart([...cart, {product, quantity: 1}]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.stock) return item;
        return {...item, quantity: newQty};
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits au panier');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/sales', {
        client_id: clientId || null,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });
      Alert.alert('Succès', 'Vente enregistrée !', [
        {text: 'OK', onPress: () => { setCart([]); navigation.goBack(); }},
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la vente');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProduct = ({item}: {item: Product}) => (
    <TouchableOpacity style={styles.productItem} onPress={() => addToCart(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetail}>{item.brand} {item.model}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
      </View>
      <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.productList}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity style={styles.cartToggle} onPress={() => setShowCart(true)}>
            <Text style={styles.cartToggleText}>Panier ({cart.length})</Text>
            <Text style={styles.cartTotal}>{formatCurrency(getTotal())}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCart} animationType="slide">
        <View style={styles.cartModal}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Panier</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Text style={styles.closeBtn}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cart}
            keyExtractor={item => String(item.product.id)}
            renderItem={({item}) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>{formatCurrency(item.product.price)}</Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                    <Text style={styles.removeBtnText}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Panier vide</Text>}
          />

          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>Mode de paiement</Text>
            <View style={styles.paymentOptions}>
              {[
                {key: 'cash', label: 'Cash'},
                {key: 'card', label: 'Carte'},
                {key: 'mobile', label: 'Mobile'},
                {key: 'transfer', label: 'Virement'},
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.paymentOption, paymentMethod === option.key && styles.paymentActive]}
                  onPress={() => setPaymentMethod(option.key)}>
                  <Text style={[styles.paymentText, paymentMethod === option.key && styles.paymentTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.clientInput}
              placeholder="ID Client (optionnel)"
              value={clientId}
              onChangeText={setClientId}
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saleBtn, submitting && styles.saleBtnDisabled]}
              onPress={handleSale}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saleBtnText}>Enregistrer la vente</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  searchBar: {
    padding: 10, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  searchInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: colors.background,
  },
  productList: {padding: 10},
  productItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 8,
    elevation: 1,
  },
  productInfo: {flex: 1},
  productName: {fontSize: 15, fontWeight: 'bold', color: colors.text},
  productDetail: {fontSize: 12, color: colors.textSecondary},
  productStock: {fontSize: 11, color: colors.textLight, marginTop: 2},
  productPrice: {fontSize: 16, fontWeight: 'bold', color: colors.primary},
  cartBar: {
    backgroundColor: colors.primary, padding: 16,
  },
  cartToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cartToggleText: {color: '#FFF', fontSize: 18, fontWeight: 'bold'},
  cartTotal: {color: '#FFF', fontSize: 18, fontWeight: 'bold'},
  cartModal: {flex: 1, backgroundColor: colors.surface},
  cartHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cartTitle: {fontSize: 20, fontWeight: 'bold', color: colors.text},
  closeBtn: {color: colors.primary, fontSize: 16},
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cartItemInfo: {flex: 1},
  cartItemName: {fontSize: 15, fontWeight: '600', color: colors.text},
  cartItemPrice: {fontSize: 13, color: colors.textSecondary},
  cartItemActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: {color: '#FFF', fontSize: 18, fontWeight: 'bold'},
  qtyText: {fontSize: 16, fontWeight: 'bold', minWidth: 24, textAlign: 'center'},
  removeBtnText: {color: colors.error, fontSize: 16, fontWeight: 'bold', marginLeft: 8},
  emptyText: {textAlign: 'center', color: colors.textSecondary, padding: 40},
  paymentSection: {padding: 16, borderTopWidth: 1, borderTopColor: colors.divider},
  paymentLabel: {fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.text},
  paymentOptions: {flexDirection: 'row', gap: 8, marginBottom: 12},
  paymentOption: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  paymentActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  paymentText: {fontSize: 13, color: colors.text},
  paymentTextActive: {color: '#FFF', fontWeight: 'bold'},
  clientInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, marginBottom: 12, backgroundColor: colors.background,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  totalLabel: {fontSize: 18, fontWeight: 'bold', color: colors.text},
  totalValue: {fontSize: 20, fontWeight: 'bold', color: colors.success},
  saleBtn: {
    backgroundColor: colors.success, borderRadius: 8, padding: 16, alignItems: 'center',
  },
  saleBtnDisabled: {opacity: 0.7},
  saleBtnText: {color: '#FFF', fontSize: 18, fontWeight: 'bold'},
});
