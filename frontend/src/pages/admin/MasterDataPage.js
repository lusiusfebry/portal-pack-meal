// frontend/src/pages/admin/MasterDataPage.js
// Legacy proxy: forward to TSX implementation to prevent stale read-only view.
// Do not put UI logic here. The source of truth is MasterDataPage.tsx.
import MasterDataPage from './MasterDataPage.tsx';

export default MasterDataPage;
export * from './MasterDataPage.tsx';
