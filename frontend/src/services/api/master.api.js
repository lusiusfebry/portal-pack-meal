// frontend/src/services/api/master.api.js
// Legacy JS proxy — explicit named re-exports from TS source.
// Do not add logic here. Source of truth is master.api.ts.

// READ
export { getDepartments, getShifts, getJabatan } from './master.api.ts';

// Departments CRUD
export { createDepartment, updateDepartment, deleteDepartment } from './master.api.ts';

// Jabatan CRUD
export { createJabatan, updateJabatan, deleteJabatan } from './master.api.ts';

// Shifts CRUD
export { createShift, updateShift, deleteShift } from './master.api.ts';

// Lokasi CRUD
export { getLokasi, createLokasi, updateLokasi, deleteLokasi } from './master.api.ts';
