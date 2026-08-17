import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors, formatCurrency} from '../utils/theme';

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: {id: number; name: string};
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '', brand: '', model: '', sku: '',
    price: '', cost: '', stock: '',
    category_id: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get(`/products?search=${search}`),
        api.get('/categories'),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name, brand: product.brand, model: product.model,
        sku: product.sku, price: String(product.price),
        cost: String(product.cost), stock: String(product.stock),
        category_id: String(product.category?.id || ''),
      });
    } else {
      setEditingProduct(null);
      setForm({name: '', brand: '', model: '', sku: '', price: '', cost: '', stock: '', category_id: ''});
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost),
        stock: parseInt(form.stock, 10),
        category_id: parseInt(form.category_id, 10),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Supprimer', `Supprimer ${product.name} ?`, [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${product.id}`);
            fetchData();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const renderProduct = ({item}: {item: Product}) => (
    <TouchableOpacity style={styles.productCard} onPress={() => openModal(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetail}>{item.brand} {item.model}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productCategory}>{item.category?.name}</Text>
      </View>
      <View style={styles.productRight}>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <View style={[styles.stockBadge, item.stock <= 5 && styles.stockLow]}>
          <Text style={styles.stockText}>Stock: {item.stock}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit trouvé</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </Text>

              <TextInput style={styles.modalInput} placeholder="Nom" value={form.name}
                onChangeText={v => setForm({...form, name: v})} />
              <TextInput style={styles.modalInput} placeholder="Marque" value={form.brand}
                onChangeText={v => setForm({...form, brand: v})} />
              <TextInput style={styles.modalInput} placeholder="Modèle" value={form.model}
                onChangeText={v => setForm({...form, model: v})} />
              <TextInput style={styles.modalInput} placeholder="SKU" value={form.sku}
                onChangeText={v => setForm({...form, sku: v})} />

              <Text style={styles.label}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, form.category_id === String(cat.id) && styles.categoryChipActive]}
                    onPress={() => setForm({...form, category_id: String(cat.id)})}>
                    <Text style={[styles.categoryChipText, form.category_id === String(cat.id) && styles.categoryChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput style={styles.modalInput} placeholder="Prix de vente" value={form.price}
                onChangeText={v => setForm({...form, price: v})} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="Prix d'achat" value={form.cost}
                onChangeText={v => setForm({...form, cost: v})} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="Stock" value={form.stock}
                onChangeText={v => setForm({...form, stock: v})} keyboardType="numeric" />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  searchBar: {
    flexDirection: 'row', padding: 10, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: colors.background, marginRight: 10,
  },
  addButton: {
    backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {color: '#FFF', fontWeight: 'bold', fontSize: 14},
  list: {padding: 10},
  productCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10,
    padding: 14, marginBottom: 10, elevation: 1,
  },
  productInfo: {flex: 1},
  productName: {fontSize: 16, fontWeight: 'bold', color: colors.text},
  productDetail: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
  productSku: {fontSize: 12, color: colors.textLight, marginTop: 2},
  productCategory: {fontSize: 12, color: colors.primary, marginTop: 4},
  productRight: {alignItems: 'flex-end', justifyContent: 'space-between'},
  productPrice: {fontSize: 16, fontWeight: 'bold', color: colors.success},
  stockBadge: {
    backgroundColor: colors.success, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  stockLow: {backgroundColor: colors.error},
  stockText: {color: '#FFF', fontSize: 11, fontWeight: 'bold'},
  deleteBtn: {marginTop: 8},
  deleteBtnText: {color: colors.error, fontSize: 12},
  emptyText: {textAlign: 'center', color: colors.textSecondary, marginTop: 40},
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20, maxHeight: '80%',
  },
  modalTitle: {fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16},
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: colors.background,
  },
  label: {fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8},
  categoryScroll: {marginBottom: 12},
  categoryChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
  },
  categoryChipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  categoryChipText: {fontSize: 13, color: colors.text},
  categoryChipTextActive: {color: '#FFF'},
  modalButtons: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 10},
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 14, alignItems: 'center', marginRight: 10,
  },
  cancelBtnText: {color: colors.textSecondary},
  saveBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 8,
    padding: 14, alignItems: 'center',
  },
  saveBtnText: {color: '#FFF', fontWeight: 'bold'},
});
