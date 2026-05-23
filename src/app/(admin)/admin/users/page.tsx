import { createServiceClient } from '@/lib/supabase/service';

export default async function AdminUsersPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id,username,email,role,display_balance,total_deposited_real,total_withdrawn_real,status,created_at')
    .order('id', { ascending: false })
    .limit(100);

  const users = (data ?? []) as Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    display_balance: number;
    total_deposited_real: number;
    total_withdrawn_real: number;
    status: string;
    created_at: string;
  }>;

  return (
    <div>
      <h2 className="mb-4">Users</h2>
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Balance</th>
                <th className="text-left p-3">Deposited</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3"><small>{u.email}</small></td>
                  <td className="p-3"><span className="badge badge-info">{u.role}</span></td>
                  <td className="p-3">{Number(u.display_balance).toFixed(6)}</td>
                  <td className="p-3">{Number(u.total_deposited_real).toFixed(6)}</td>
                  <td className="p-3">
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'banned' ? 'badge-danger' : 'badge-warning'}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
