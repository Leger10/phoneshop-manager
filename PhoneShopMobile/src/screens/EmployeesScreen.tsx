import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import {colors, formatDate} from '../utils/theme';

interface Employee {
  id: number;
  boutique_name: string;
  phone: string;
  salary: number;
  hire_date: string;
  status: string;
  user: {id: number; name: string; email: string};
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', boutique_name: '',
    phone: '', salary: '', hire_date: '',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get(`/employees?search=${search}`);
      setEmployees(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSave = async () => {
    try {
      await api.post('/employees', {
        ...form,
        salary: form.salary ? parseFloat(form.salary) : null,
      });
      setModalVisible(false);
      setForm({name: '', email: '', password: '', boutique_name: '', phone: '', salary: '', hire_date: ''});
      fetchEmployees();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur');
    }
  };

  const handleDeactivate = (employee: Employee) => {
    Alert.alert('Désactiver', `Désactiver ${employee.user.name} ?`, [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Désactiver', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/employees/${employee.id}`); fetchEmployees(); }
          catch { Alert.alert('Erreur', 'Impossible de désactiver'); }
        },
      },
    ]);
  };

  const renderEmployee = ({item}: {item: Employee}) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.user.name}</Text>
        <Text style={styles.cardDetail}>Boutique: {item.boutique_name}</Text>
        <Text style={styles.cardDetail}>Email: {item.user.email}</Text>
        {item.phone && <Text style={styles.cardDetail}>Tel: {item.phone}</Text>}
        <Text style={styles.cardDetail}>Embauché: {formatDate(item.hire_date)}</Text>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.active : styles.inactive]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'Actif' : 'Inactif'}</Text>
        </View>
      </View>
      {item.status === 'active' && (
        <TouchableOpacity style={styles.deactivateBtn} onPress={() => handleDeactivate(item)}>
          <Text style={styles.deactivateBtnText}>Desactiver</Text>
        </TouchableOpacity>
      )}
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
          placeholder="Rechercher un employé..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun employé trouvé</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Nouvel employé</Text>
              <TextInput style={styles.modalInput} placeholder="Nom complet" value={form.name}
                onChangeText={v => setForm({...form, name: v})} />
              <TextInput style={styles.modalInput} placeholder="Email" value={form.email}
                onChangeText={v => setForm({...form, email: v})} keyboardType="email-address" />
              <TextInput style={styles.modalInput} placeholder="Mot de passe" value={form.password}
                onChangeText={v => setForm({...form, password: v})} secureTextEntry />
              <TextInput style={styles.modalInput} placeholder="Nom de la boutique" value={form.boutique_name}
                onChangeText={v => setForm({...form, boutique_name: v})} />
              <TextInput style={styles.modalInput} placeholder="Téléphone" value={form.phone}
                onChangeText={v => setForm({...form, phone: v})} keyboardType="phone-pad" />
              <TextInput style={styles.modalInput} placeholder="Salaire" value={form.salary}
                onChangeText={v => setForm({...form, salary: v})} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="Date d'embauche (YYYY-MM-DD)" value={form.hire_date}
                onChangeText={v => setForm({...form, hire_date: v})} />
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
  statusBadge: {alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6},
  active: {backgroundColor: '#E8F5E9'},
  inactive: {backgroundColor: '#FFEBEE'},
  statusText: {fontSize: 11, fontWeight: 'bold'},
  deactivateBtn: {padding: 8},
  deactivateBtnText: {color: colors.error, fontSize: 12},
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
