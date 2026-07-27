import { bambooGet } from "@/lib/bamboohr/client";
import { cached } from "@/lib/bamboohr/cache";

// Fields pulled from the standard "Get Employees Directory" endpoint.
// This endpoint returns whatever fields your BambooHR account has
// configured as "directory visible" — these are the common defaults.
const DIRECTORY_FIELDS = [
  "displayName",
  "firstName",
  "lastName",
  "jobTitle",
  "workEmail",
  "department",
  "location",
  "division",
  "photoUrl",
  "supervisor",
  "status",
  "hireDate",
];

/**
 * Full company directory. Cached briefly since this is used by almost
 * every page (dashboard KPIs, employee list, department rollups).
 */
export async function getEmployeeDirectory() {
  return cached("directory", async () => {
    const data = await bambooGet("/employees/directory");
    return (data?.employees ?? []).map(normalizeDirectoryEmployee);
  });
}

function normalizeDirectoryEmployee(emp) {
  return {
    id: emp.id,
    name: emp.displayName || `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
    firstName: emp.firstName ?? "",
    lastName: emp.lastName ?? "",
    title: emp.jobTitle ?? "",
    email: emp.workEmail ?? "",
    department: emp.department ?? "Unassigned",
    location: emp.location ?? "",
    division: emp.division ?? "",
    photoUrl: emp.photoUrl ?? null,
    manager: emp.supervisor ?? "",
    status: emp.status === "Active" ? "Active" : emp.status || "Inactive",
    hireDate: emp.hireDate ?? null,
  };
}

/**
 * Single employee detail — pulls a broader field set than the directory.
 */
export async function getEmployeeById(id) {
  const fields = [
    ...DIRECTORY_FIELDS,
    "mobilePhone",
    "workPhone",
    "employeeNumber",
    "employmentHistoryStatus",
    "terminationDate",
    "payRate",
    "payType",
  ];

  return cached(`employee:${id}`, async () => {
    const data = await bambooGet(`/employees/${id}`, { fields: fields.join(",") });
    return {
      id: data.id,
      name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      title: data.jobTitle ?? "",
      department: data.department ?? "Unassigned",
      email: data.workEmail ?? "",
      phone: data.mobilePhone || data.workPhone || "",
      manager: data.supervisor ?? "",
      status: data.employmentHistoryStatus || data.status || "Active",
      hireDate: data.hireDate ?? null,
      terminationDate: data.terminationDate ?? null,
      employeeNumber: data.employeeNumber ?? "",
      photoUrl: `/employees/${id}/photo`, // proxied, see photoService
      location: data.location ?? "",
    };
  });
}

/**
 * Dashboard-level KPIs computed from the directory.
 * (BambooHR has no single "KPI" endpoint — these are derived client-side
 * of the API, i.e. computed here on the server from directory data.)
 */
export async function getEmployeeKpis() {
  const employees = await getEmployeeDirectory();
  const active = employees.filter((e) => e.status === "Active");

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);

  const newJoinees = active.filter((e) => {
    if (!e.hireDate) return false;
    const hired = new Date(e.hireDate);
    return hired >= ninetyDaysAgo && hired <= now;
  });

  const departmentCounts = active.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});

  const locationCounts = active.reduce((acc, e) => {
    if (!e.location) return acc;
    acc[e.location] = (acc[e.location] || 0) + 1;
    return acc;
  }, {});

  return {
    totalEmployees: employees.length,
    activeEmployees: active.length,
    newJoinees: newJoinees.length,
    departmentDistribution: Object.entries(departmentCounts).map(([name, count]) => ({
      name,
      count,
    })),
    locationDistribution: Object.entries(locationCounts).map(([name, count]) => ({
      name,
      count,
    })),
  };
}
