import React, { useState } from 'react';
import { getDb, saveDb } from '../mockDb';
import { Users, FileSpreadsheet, Plus, Trash2, ShieldCheck, Mail, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const [db, setDb] = useState(getDb());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('PESERTA');

  const usersCount = db.users.length;
  const formsCount = db.forms.length;
  const submissionsCount = db.results.length;

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    const newUser = {
      id: db.users.length + 1,
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      created_at: new Date().toISOString()
    };

    const updatedDb = { ...db, users: [...db.users, newUser] };
    setDb(updatedDb);
    saveDb(updatedDb);

    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('PESERTA');
    setShowAddModal(false);
  };

  const handleDeleteUser = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      const updatedUsers = db.users.filter(u => u.id !== id);
      const updatedDb = { ...db, users: updatedUsers };
      setDb(updatedDb);
      saveDb(updatedDb);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-black text-neutral">Admin Control Panel</h1>
        <p className="text-sm text-neutral-500 mt-1">Supervising users, metadata screening forms, and metrics.</p>
      </div>

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
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading font-bold text-lg text-neutral">Daftar Pengguna Sistem</h3>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm rounded-lg">
              <UserPlus className="w-4 h-4 mr-1.5" /> Tambah User
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tanggal Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {db.users.map((user) => (
                  <tr key={user.id} className="hover">
                    <td>
                      <div className="font-bold text-sm">{user.name}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{user.email}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm font-semibold rounded-md ${
                        user.role === 'ADMIN' ? 'badge-error' : user.role === 'DOKTER' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-neutral-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="btn btn-ghost btn-xs text-error"
                        disabled={user.id === 1} // Can't delete main admin
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-2xl">
            <h3 className="font-heading font-bold text-lg text-neutral mb-4">Tambah Pengguna Baru</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Nama Lengkap</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full rounded-lg" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input 
                  type="email" 
                  className="input input-bordered w-full rounded-lg" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full rounded-lg" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Role</span></label>
                <select 
                  className="select select-bordered w-full rounded-lg" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="PESERTA">PESERTA</option>
                  <option value="DOKTER">DOKTER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">Batal</button>
                <button type="submit" className="btn btn-primary rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
