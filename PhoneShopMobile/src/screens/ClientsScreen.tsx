import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors} from '../utils/theme';

interface Client {
  id: number; name: string; phone: string;
  email: string | null; address: string | null;
  sales_count: number;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({name: '', phone: '', email: '', address: ''});

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get(`/clients?search=${search}`);
      setClients(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setForm({name: client.name, phone: client.phone, email: client.email || '', address: client.address || ''});
    } else {
      setEditingClient(null);
      setForm({name: '', phone: '', email: '', address: ''});
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, form);
      } else {
        await api.post('/clients', form);
      }
      setModalVisible(false);
      fetchClients();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = (client: Client) => {
    Alert.alert('Supprimer', `Supprimer ${client.name} ?`, [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/clients/${client.id}`); fetchClients(); }
          catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
        },
      },
    ]);
  };

  const renderClient = ({item}: {item: Client}) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardDetail}>Tel: {item.phone}</Text>
        {item.email && <Text style={styles.cardDetail}>Email: {item.email}</Text>}
        <Text style={styles.cardSales}>{item.sales_count || 0} achat(s)</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Text style={styles.deleteBtnText}>X</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun client trouvé</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </Text>
              <TextInput style={styles.modalInput} placeholder="Nom" value={form.name}
                onChangeText={v => setForm({...form, name: v})} />
              <TextInput style={styles.modalInput} placeholder="Téléphone" value={form.phone}
                onChangeText={v => setForm({...form, phone: v})} keyboardType="phone-pad" />
              <TextInput style={styles.modalInput} placeholder="Email (optionnel)" value={form.email}
                onChangeText={v => setForm({...form, email: v})} keyboardType="email-address" />
              <TextInput style={styles.modalInput} placeholder="Adresse (optionnel)" value={form.address}
                onChangeText={v => setForm({...form, address: v})} multiline numberOfLines={3} />
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
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10,
    padding: 14, marginBottom: 10, elevation: 1, alignItems: 'center',
  },
  cardInfo: {flex: 1},
  cardName: {fontSize: 16, fontWeight: 'bold', color: colors.text},
  cardDetail: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
  cardSales: {fontSize: 12, color: colors.primary, marginTop: 4},
  deleteBtn: {padding: 8},
  deleteBtnText: {color: colors.error, fontSize: 16, fontWeight: 'bold'},
  emptyText: {textAlign: 'center', color: colors.textSecondary, marginTop: 40},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20,
  },
  modalTitle: {fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16},
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: colors.background,
  },
  modalButtons: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
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
