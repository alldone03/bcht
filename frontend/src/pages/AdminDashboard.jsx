import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { formatDateWithAge } from '../utils/dateUtils';
import { Users, FileSpreadsheet, Plus, Trash2, ShieldCheck, Mail, UserPlus, Edit2, Calendar, Hash } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Create state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('PESERTA');
  const [newTanggalLahir, setNewTanggalLahir] = useState('');
  const [newParticipantId, setNewParticipantId] = useState('');

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('PESERTA');
  const [editTanggalLahir, setEditTanggalLahir] = useState('');
  const [editParticipantId, setEditParticipantId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const u = await api.getUsers();
      const f = await api.getForms();
      const r = await api.getFormResponses();
      setUsers(u);
      setForms(f);
      setResponses(r);
    } catch (e) {
      console.error("Gagal mengambil data admin", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) || 
        (u.participant_id && u.participant_id.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'role') {
        valA = a.role && a.role.name ? a.role.name : (a.role || '');
        valB = b.role && b.role.name ? b.role.name : (b.role || '');
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, sortField, sortDirection]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        tanggal_lahir: newTanggalLahir || null,
        participant_id: newParticipantId || null
      });
      window.alert('User berhasil ditambahkan!');
      fetchData();
      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('PESERTA');
      setNewTanggalLahir('');
      setNewParticipantId('');
      setShowAddModal(false);
    } catch (err) {
      window.alert('Gagal menambahkan user: ' + err.message);
    }
  };

  const handleOpenEdit = (user) => {
    setEditUserId(user.id);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditRole(user.role && user.role.name ? user.role.name : (user.role || 'PESERTA'));
    setEditTanggalLahir(user.tanggal_lahir || '');
    setEditParticipantId(user.participant_id || '');
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editUserId, {
        name: editName,
        email: editEmail,
        password: editPassword || undefined,
        role: editRole,
        tanggal_lahir: editTanggalLahir || null,
        participant_id: editParticipantId || null
      });
      window.alert('User berhasil diperbarui!');
      fetchData();
      setShowEditModal(false);
    } catch (err) {
      window.alert('Gagal memperbarui user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await api.deleteUser(id);
        window.alert('User berhasil dihapus!');
        fetchData();
      } catch (err) {
        window.alert('Gagal menghapus user: ' + err.message);
      }
    }
  };

  const usersCount = users.length;
  const formsCount = forms.length;
  const submissionsCount = responses.length;

  const roleBadgeColor = (roleStr) => {
    switch (roleStr) {
      case 'ADMIN': return 'badge-error';
      case 'DOKTER': return 'badge-primary';
      case 'PESERTA': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  const renderSortableHeader = (label, field) => {
    const isCurrent = sortField === field;
    return (
      <th 
        onClick={() => handleRequestSort(field)} 
        className="cursor-pointer hover:bg-base-200 select-none transition-colors py-3"
      >
        <div className="flex items-center gap-1">
          {label}
          {isCurrent ? (
            sortDirection === 'asc' ? '▲' : '▼'
          ) : (
            <span className="opacity-30">↕</span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-black text-neutral">Admin Control Panel</h1>
        <p className="text-sm text-neutral-500 mt-1">Mengelola pengguna, formulir penapisan kesehatan, dan analisis metrik.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner text-primary" />
          <p className="text-xs text-neutral-500 mt-2">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body flex-row items-center gap-4">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total User</p>
                  <h2 className="text-3xl font-heading font-black text-neutral mt-1">{usersCount}</h2>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body flex-row items-center gap-4">
                <div className="p-4 bg-secondary/10 text-secondary rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Form Screening</p>
                  <h2 className="text-3xl font-heading font-black text-neutral mt-1">{formsCount}</h2>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body flex-row items-center gap-4">
                <div className="p-4 bg-accent/10 text-accent rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Submisi</p>
                  <h2 className="text-3xl font-heading font-black text-neutral mt-1">{submissionsCount}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Users Management */}
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
                <h3 className="font-heading font-bold text-lg text-neutral">Daftar Pengguna Sistem</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1 max-w-xl justify-end">
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau ID..."
                    className="input input-bordered input-sm rounded-xl text-xs w-full sm:max-w-xs focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm rounded-xl font-bold gap-1 px-4 text-white">
                    <UserPlus className="w-4 h-4" /> Tambah User
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="table w-full">
                  <thead>
                    <tr>
                      {renderSortableHeader('Nama Lengkap', 'name')}
                      {renderSortableHeader('Email / ID Peserta', 'email')}
                      {renderSortableHeader('Tanggal Lahir', 'tanggal_lahir')}
                      {renderSortableHeader('Role', 'role')}
                      {renderSortableHeader('Tanggal Daftar', 'created_at')}
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedUsers.map((user) => {
                      const currentRoleName = user.role && user.role.name ? user.role.name : (user.role || 'PESERTA');
                      return (
                        <tr key={user.id} className="hover">
                          <td>
                            <div className="font-bold text-sm text-neutral">{user.name}</div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-neutral-500">{user.email}</span>
                              {user.participant_id && (
                                <span className="badge badge-ghost badge-xs font-mono text-[9px] px-1.5 py-1 rounded">
                                  ID: {user.participant_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-xs font-medium text-neutral-600">
                              {formatDateWithAge(user.tanggal_lahir)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-sm font-bold uppercase rounded-lg px-2.5 py-1.5 ${roleBadgeColor(currentRoleName)}`}>
                              {currentRoleName}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-neutral-500">
                              {new Date(user.created_at || user.updated_at).toLocaleDateString('id-ID')}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleOpenEdit(user)} 
                                className="btn btn-ghost btn-xs text-primary p-1"
                                title="Edit User / Assign Role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)} 
                                className="btn btn-ghost btn-xs text-error p-1"
                                disabled={user.id === 1} // Can't delete main admin
                                title="Hapus User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAndSortedUsers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-neutral-500 text-xs">
                          Tidak ada pengguna ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-3xl border border-base-200 shadow-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-neutral mb-4">Tambah Pengguna Baru</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Nama Lengkap</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">ID Peserta</span></label>
                <input 
                  type="text" 
                  placeholder="Contoh: PT-2026-098"
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={newParticipantId} 
                  onChange={(e) => setNewParticipantId(e.target.value)} 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Tanggal Lahir</span></label>
                <input 
                  type="date" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={newTanggalLahir} 
                  onChange={(e) => setNewTanggalLahir(e.target.value)} 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Email</span></label>
                <input 
                  type="email" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Role</span></label>
                <select 
                  className="select select-bordered w-full rounded-xl text-sm" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="PESERTA">PESERTA</option>
                  <option value="DOKTER">DOKTER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TIM_KESEHATAN">TIM_KESEHATAN</option>
                  <option value="PENANGGUNG_JAWAB_TIM">PENANGGUNG_JAWAB_TIM</option>
                  <option value="PETUGAS_KESEHATAN">PETUGAS_KESEHATAN</option>
                  <option value="TEMAN_PENDAMPING">TEMAN_PENDAMPING</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost rounded-xl">Batal</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold text-white px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-3xl border border-base-200 shadow-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-neutral mb-4">Edit / Ubah Peran Pengguna</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Nama Lengkap</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">ID Peserta</span></label>
                <input 
                  type="text" 
                  placeholder="Contoh: PT-2026-098"
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={editParticipantId} 
                  onChange={(e) => setEditParticipantId(e.target.value)} 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Tanggal Lahir</span></label>
                <input 
                  type="date" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={editTanggalLahir} 
                  onChange={(e) => setEditTanggalLahir(e.target.value)} 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Email</span></label>
                <input 
                  type="email" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-bold">Password Baru</span>
                  <span className="label-text-alt text-[9px] text-neutral-400">Kosongkan jika tidak ingin diubah</span>
                </label>
                <input 
                  type="password" 
                  className="input input-bordered w-full rounded-xl text-sm" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs font-bold">Role (Assign Role)</span></label>
                <select 
                  className="select select-bordered w-full rounded-xl text-sm" 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="PESERTA">PESERTA</option>
                  <option value="DOKTER">DOKTER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TIM_KESEHATAN">TIM_KESEHATAN</option>
                  <option value="PENANGGUNG_JAWAB_TIM">PENANGGUNG_JAWAB_TIM</option>
                  <option value="PETUGAS_KESEHATAN">PETUGAS_KESEHATAN</option>
                  <option value="TEMAN_PENDAMPING">TEMAN_PENDAMPING</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost rounded-xl">Batal</button>
                <button type="submit" className="btn btn-primary rounded-xl font-bold text-white px-6">Perbarui</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
