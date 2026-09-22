"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { Users, Shield, Building2, Bell, CheckCircle, DollarSign, Grid3X3, UserPlus, Trash2, Power } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AddUserModal from "@/components/AddUserModal";

const roles = [
  { role:"Corporate Admin",  users:2, access:"Full access all properties" },
  { role:"General Manager",  users:1, access:"Full access own property" },
  { role:"HR Manager",       users:1, access:"Employee data + payroll read" },
  { role:"Department Head",  users:6, access:"Own department only" },
  { role:"Payroll Admin",    users:1, access:"Payroll + approvals" },
  { role:"Read Only",        users:3, access:"View dashboards only" },
];

const approvalRules = [
  { rule:"OT > 40 hours/week",             action:"Requires GM approval",          status:"Active" },
  { rule:"New hire onboarding",            action:"Auto-notify HR + Payroll",       status:"Active" },
  { rule:"Rate change > 10%",             action:"Requires Corporate approval",    status:"Active" },
  { rule:"Missing hours by Friday 5PM",   action:"Alert department head",          status:"Active" },
  { rule:"Weekly payroll > $20,000",      action:"Notify ownership group",         status:"Active" },
];

const notifRules = [
  { label:"Weekly Payroll Summary Email",        enabled:true,  recipients:"gm@lbvhotel.com, hr@lbvhotel.com" },
  { label:"OT Alert (threshold exceeded)",       enabled:true,  recipients:"gm@lbvhotel.com" },
  { label:"Pending Approval Reminder (Fri 3PM)", enabled:true,  recipients:"dept-heads@lbvhotel.com" },
  { label:"Missing Hours Alert",                 enabled:true,  recipients:"payroll@lbvhotel.com" },
  { label:"Monthly Payroll Report",              enabled:false, recipients:"ownership@lbvhotel.com" },
  { label:"HR Dashboard Summary",                enabled:true,  recipients:"corporate@lbvhotel.com" },
];

const companyFields = [
  ["Company Name","La Bella Vista Hotel"],
  ["Company ID","LBV"],
  ["Address","2450 Harbor Blvd, Costa Mesa, CA 92626"],
  ["Industry","Hospitality"],
  ["Total Employees","24"],
  ["Fiscal Year Start","January 1"],
  ["Payroll Frequency","Weekly"],
  ["Employment Burden Rate","27.5%"],
  ["Budget Labor %","34.2%"],
  ["Default Pay Period","Monday – Sunday"],
];

const payrollSettings = [
  ["Overtime Threshold","40 hrs/week"],
  ["OT Multiplier","1.5x"],
  ["Holiday Multiplier","1.5x"],
  ["Burden Rate","27.5%"],
  ["Payroll Cut-off","Friday 5:00 PM"],
  ["Pay Date","Following Wednesday"],
];

export default function SettingsPage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [teamUsers, setTeamUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadUsers = useCallback(() => {
    if (currentUser?.role !== "Admin") return;
    setUsersLoading(true);
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setUsersError(data.error);
        else setTeamUsers(data.users || []);
      })
      .catch(() => setUsersError("Failed to load team access."))
      .finally(() => setUsersLoading(false));
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-change
    loadUsers();
  }, [loadUsers]);

  async function handleRoleChange(user, newRole) {
    setActionError("");
    const res = await fetch(`/api/auth/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const json = await res.json();
    if (!res.ok) setActionError(json.error);
    loadUsers();
  }

  async function handleToggleActive(user) {
    setActionError("");
    const res = await fetch(`/api/auth/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    const json = await res.json();
    if (!res.ok) setActionError(json.error);
    loadUsers();
  }

  async function handleDelete(user) {
    setActionError("");
    const res = await fetch(`/api/auth/users/${user.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) setActionError(json.error);
    loadUsers();
  }

  return (
    <AppLayout>
      <Header title="Settings" subtitle="HRMS configuration, roles & payroll settings" />
      <main className="main-content" style={{ flex:1,overflowY:"auto",padding:"16px 20px",background:"#f0f4f8" }}>

        <div className="grid-2col">
          {/* Company Information */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",alignItems:"center",gap:6 }}>
              <Building2 size={13}/> Company Information
            </div>
            <div style={{ padding:14 }}>
              {companyFields.map(([label, value], i)=>(
                <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8,alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"#64748b",fontWeight:500 }}>{label}</span>
                  <input defaultValue={value} style={{ padding:"4px 8px",border:"1px solid #e2e8f0",borderRadius:5,fontSize:11,color:"#0f172a",outline:"none",width:"100%" }}/>
                </div>
              ))}
              <button style={{ marginTop:6,background:"#2563eb",color:"white",border:"none",borderRadius:5,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>

          {/* Payroll Settings */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",alignItems:"center",gap:6 }}>
              <DollarSign size={13}/> Payroll Settings
            </div>
            <div style={{ padding:14 }}>
              {payrollSettings.map(([label, value], i)=>(
                <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8,alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"#64748b",fontWeight:500 }}>{label}</span>
                  <input defaultValue={value} style={{ padding:"4px 8px",border:"1px solid #e2e8f0",borderRadius:5,fontSize:11,color:"#0f172a",outline:"none",width:"100%" }}/>
                </div>
              ))}
              <button style={{ marginTop:6,background:"#2563eb",color:"white",border:"none",borderRadius:5,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>

          {/* Team Access — real self-service user management, Admin-only */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",alignItems:"center",gap:6 }}><Users size={13}/> Team Access</div>
              {currentUser?.role === "Admin" && (
                <button onClick={() => setAddUserOpen(true)} style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#2563eb",color:"white",border:"none",borderRadius:5,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                  <UserPlus size={12}/> Add User
                </button>
              )}
            </div>
            {actionError && (
              <div style={{ padding:"8px 14px",fontSize:11,color:"#b91c1c",background:"#fef2f2",borderBottom:"1px solid #fecaca" }}>{actionError}</div>
            )}
            {userLoading || usersLoading ? (
              <div style={{ padding:"16px 14px",fontSize:12,color:"#94a3b8" }}>Loading...</div>
            ) : currentUser?.role !== "Admin" ? (
              <div style={{ padding:"16px 14px",fontSize:12,color:"#94a3b8" }}>Only Admins can view team access. Signed in as {currentUser?.name} ({currentUser?.role}).</div>
            ) : usersError ? (
              <div style={{ padding:"16px 14px",fontSize:12,color:"#b91c1c" }}>{usersError}</div>
            ) : (
            <div className="table-scroll">
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:420 }}>
                <thead><tr style={{ background:"#f8fafc" }}>
                  {["Name","Username","Role","Status",""].map(h=><th key={h} style={{ padding:"7px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {teamUsers.map((u)=>(
                    <tr key={u.id} style={{ borderBottom:"1px solid #f8fafc", opacity: u.active ? 1 : 0.5 }}>
                      <td style={{ padding:"8px 14px",fontSize:13,fontWeight:600,color:"#0f172a" }}>{u.name}</td>
                      <td style={{ padding:"8px 14px",fontSize:12,color:"#475569" }}>{u.username}</td>
                      <td style={{ padding:"8px 14px",fontSize:11 }}>
                        <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}
                          style={{ background: u.role === "Admin" ? "#dbeafe" : u.role === "Payroll Manager" ? "#fef9c3" : "#f1f5f9", color: u.role === "Admin" ? "#1d4ed8" : u.role === "Payroll Manager" ? "#a16207" : "#64748b", padding:"2px 6px", borderRadius:4, fontWeight:600, border:"none", fontSize:11 }}>
                          <option value="Admin">Admin</option>
                          <option value="Payroll Manager">Payroll Manager</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                      <td style={{ padding:"8px 14px",fontSize:11 }}>
                        <span style={{ background: u.active ? "#dcfce7" : "#f1f5f9", color: u.active ? "#16a34a" : "#94a3b8", padding:"2px 7px", borderRadius:999, fontWeight:600 }}>{u.active ? "Active" : "Inactive"}</span>
                      </td>
                      <td style={{ padding:"8px 14px", whiteSpace:"nowrap" }}>
                        <button onClick={() => handleToggleActive(u)} title={u.active ? "Deactivate" : "Activate"} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", marginRight:8 }}>
                          <Power size={13} />
                        </button>
                        <button onClick={() => handleDelete(u)} title="Delete" style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Approval Rules (Payroll & Employee) */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",alignItems:"center",gap:6 }}>
              <Shield size={13}/> Payroll Approval Rules
            </div>
            <div className="table-scroll">
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:320 }}>
                <thead><tr style={{ background:"#f8fafc" }}>
                  {["Trigger Rule","Action","Status"].map(h=><th key={h} style={{ padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {approvalRules.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid #f8fafc" }}>
                      <td style={{ padding:"8px 12px",fontSize:12,fontWeight:600,color:"#0f172a" }}>{r.rule}</td>
                      <td style={{ padding:"8px 12px",fontSize:11,color:"#64748b" }}>{r.action}</td>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ background:"#dcfce7",color:"#16a34a",padding:"2px 7px",borderRadius:999,fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3 }}>
                          <CheckCircle size={9}/> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notification Settings */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",gridColumn:"1 / -1" }}>
            <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",alignItems:"center",gap:6 }}>
              <Bell size={13}/> Notification Settings
            </div>
            <div style={{ padding:14,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:4 }}>
              {notifRules.map((n,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,background:"#f8fafc" }}>
                  <div style={{ width:34,height:18,background:n.enabled?"#2563eb":"#e2e8f0",borderRadius:9,position:"relative",cursor:"pointer",flexShrink:0 }}>
                    <div style={{ position:"absolute",width:14,height:14,borderRadius:"50%",background:"white",top:2,left:n.enabled?18:2,transition:"left 0.2s",boxShadow:"0 1px 2px rgba(0,0,0,0.2)" }}/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:n.enabled?"#0f172a":"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{n.label}</div>
                    <div style={{ fontSize:10,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{n.recipients}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {addUserOpen && (
        <AddUserModal onClose={() => setAddUserOpen(false)} onCreated={loadUsers} />
      )}
    </AppLayout>
  );
}
