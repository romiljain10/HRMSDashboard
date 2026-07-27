"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { usePayrollDataset } from "@/hooks/usePayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

const DAY_HOURS = (emp) => {
  const total = emp.regularHours + emp.otHours;
  if (total === 0) return [0,0,0,0,0,0,0];
  const base = (emp.regularHours / 5);
  const days = [base, base + emp.otHours, base, base, base, 0, 0];
  return days.map(d => Math.round(d * 100) / 100);
};

export default function EmployeeProfile({ params }) {
  const { id } = use(params);
  const { data, loading, error, retry } = usePayrollDataset();
  const emp = data?.employees?.find(e => e.id === id);

  if (loading || error) {
    return (
      <AppLayout>
        <Header title="Employee Profile" subtitle="La Bella Vista Hotel Group" />
        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
          <DataStateBanner loading={loading} error={error} onRetry={retry} />
        </main>
      </AppLayout>
    );
  }

  if (!emp) return <AppLayout><div style={{ padding:40,color:"#64748b" }}>Employee not found.</div></AppLayout>;

  const days = DAY_HOURS(emp);
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <AppLayout>
      <Header title={emp.name} subtitle={`${emp.title}  |  ${emp.departmentGroup}  |  ${emp.employeeNumber}`} />
      <main className="main-content" style={{ flex:1,overflowY:"auto",padding:"16px 20px",background:"#f0f4f8" }}>
        <Link href="/employees" style={{ display:"inline-flex",alignItems:"center",gap:5,color:"#2563eb",fontSize:12,textDecoration:"none",marginBottom:14 }}>
          <ArrowLeft size={13}/> Back to Directory
        </Link>

        <div className="grid-2col">
          {/* Info Card */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",padding:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
              <div style={{ width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#1e40af,#2563eb)",color:"white",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {emp.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:"#0f172a" }}>{emp.name}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>{emp.title}</div>
                <div style={{ display:"flex",gap:6,marginTop:4 }}>
                  <span style={{ background:"#dbeafe",color:"#1d4ed8",padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:600 }}>{emp.departmentGroup}</span>
                  <span style={{ background:emp.status==="Active"?"#dcfce7":"#f1f5f9",color:emp.status==="Active"?"#16a34a":"#64748b",padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:600 }}>{emp.status}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[
                ["Employee Number",  emp.employeeNumber],
                ["Department",       emp.department],
                ["Property",         "La Bella Vista Hotel"],
                ["Employment Type",  "Full-Time"],
                ["Base Pay Rate",    "$"+emp.baseRate.toFixed(2)+"/hr"],
                ["Burden Rate",      (emp.burden*100).toFixed(1)+"%"],
              ].map(([label,value],i)=>(
                <div key={i} style={{ padding:"9px 12px",background:"#f8fafc",borderRadius:6 }}>
                  <div style={{ fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.04em" }}>{label}</div>
                  <div style={{ fontSize:12,fontWeight:600,color:"#0f172a",marginTop:2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payroll Summary */}
          <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",padding:20 }}>
            <div style={{ fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:12 }}>Weekly Payroll Summary — Apr 27–May 3, 2026</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14 }}>
              {[
                { label:"Regular Hours",value:emp.regularHours.toFixed(2),color:"#2563eb" },
                { label:"OT Hours",     value:emp.otHours.toFixed(2),     color:emp.otHours>0?"#dc2626":"#94a3b8" },
                { label:"Holiday Hours",value:emp.holidayHours.toFixed(2),color:"#7c3aed" },
                { label:"Total Hours",  value:(emp.regularHours+emp.otHours+emp.holidayHours).toFixed(2),color:"#0f172a" },
              ].map((s,i)=>(
                <div key={i} style={{ padding:"10px 12px",background:"#f8fafc",borderRadius:6,textAlign:"center" }}>
                  <div style={{ fontSize:18,fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10,color:"#64748b",fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop:"1px solid #f1f5f9",paddingTop:12 }}>
              {[
                ["Fully Loaded RT Rate","$"+emp.fullyLoadedRT.toFixed(4)+"/hr"],
                ["Fully Loaded OT Rate","$"+emp.fullyLoadedOT.toFixed(4)+"/hr"],
              ].map(([label,value],i)=>(
                <div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                  <span style={{ fontSize:12,color:"#64748b" }}>{label}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:"#0f172a" }}>{value}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"2px solid #e2e8f0" }}>
                <span style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>Weekly Total Cost</span>
                <span style={{ fontSize:17,fontWeight:800,color:emp.totalCost>0?"#1e40af":"#94a3b8" }}>
                  {emp.totalCost>0?"$"+emp.totalCost.toLocaleString("en-US",{minimumFractionDigits:2}):"—"}
                </span>
              </div>
            </div>
            <div style={{ marginTop:12,padding:"9px 12px",background:emp.approvalStatus==="Approved"?"#dcfce7":"#fef9c3",borderRadius:6,display:"flex",alignItems:"center",gap:8 }}>
              {emp.approvalStatus==="Approved"?<CheckCircle size={14} color="#16a34a"/>:<Clock size={14} color="#a16207"/>}
              <span style={{ fontSize:12,fontWeight:600,color:emp.approvalStatus==="Approved"?"#15803d":"#78350f" }}>
                Payroll {emp.approvalStatus}{emp.approvalStatus==="Pending"?" — Awaiting manager sign-off":""}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Hours */}
        <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",marginTop:14,overflow:"hidden" }}>
          <div style={{ padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a" }}>Daily Hours Breakdown</div>
          <div className="table-scroll">
            <table style={{ width:"100%",borderCollapse:"collapse",minWidth:400 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {dayNames.map(d=><th key={d} style={{ padding:"7px 14px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>{d}</th>)}
                  <th style={{ padding:"7px 14px",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {days.map((h,i)=>(
                    <td key={i} style={{ padding:"12px 14px",textAlign:"center",fontSize:14,fontWeight:700,color:h===0?"#94a3b8":"#0f172a",background:h===0?"#fafafa":"white" }}>
                      {h===0?"—":h.toFixed(2)}
                    </td>
                  ))}
                  <td style={{ padding:"12px 14px",textAlign:"center",fontSize:14,fontWeight:800,color:"#1e40af" }}>
                    {(emp.regularHours+emp.otHours).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval Timeline */}
        <div style={{ background:"white",borderRadius:8,border:"1px solid #e2e8f0",marginTop:14,padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:12 }}>Approval Timeline</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { date:"Apr 27, 2026",event:"Timesheet Submitted",status:"done" },
              { date:"Apr 29, 2026",event:"Supervisor Review",status:"done" },
              { date:"May 3, 2026", event:emp.approvalStatus==="Approved"?"Manager Approved":"Manager Approval Pending",status:emp.approvalStatus==="Approved"?"done":"pending" },
              { date:"May 4, 2026", event:"Payroll Processing",status:emp.approvalStatus==="Approved"?"done":"waiting" },
            ].map((step,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:step.status==="done"?"#dcfce7":step.status==="pending"?"#fef9c3":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {step.status==="done"?<CheckCircle size={13} color="#16a34a"/>:<Clock size={13} color={step.status==="pending"?"#a16207":"#cbd5e1"}/>}
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:"#0f172a" }}>{step.event}</div>
                  <div style={{ fontSize:10,color:"#94a3b8" }}>{step.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
