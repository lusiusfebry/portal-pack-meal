/* frontend/src/hooks/useNotifications.ts */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { showInfo, showSuccess, showError } from '@/components/ui/Toast';
import { StatusPesanan } from '@/types/order.types';
/**
 * useNotifications
 * - Mengaktifkan side-effect notifikasi real-time untuk seluruh aplikasi.
 * - Mendengarkan semua event WebSocket (namespace /notifications).
 * - Menentukan relevansi berdasarkan role user.
 * - Menampilkan toast dengan konteks yang sesuai.
 *
 * Catatan penggunaan:
 * - Pasang hook ini sekali di lapisan atas aplikasi setelah user terautentikasi,
 *   misalnya di AppShell atau App (setelah ProtectedRoute).
 * - Hook ini tidak mengembalikan apa-apa (side-effect only).
 */
export default function useNotifications() {
    const user = useAuthStore((s) => s.user);
    const role = user?.role;
    const navigate = useNavigate();
    // 1) order.created → Info toast untuk dapur
    useWebSocket('order.created', (payload) => {
        if (role !== 'dapur')
            return;
        const label = payload.kodePesanan ?? `#${payload.orderId}`;
        showInfo(`Pesanan baru: ${label}`);
    }, [role]);
    // 2) order.status.changed → Toast berdasarkan role yang relevan
    useWebSocket('order.status.changed', (event) => {
        const status = event.newStatus;
        // Employee menerima event hanya untuk pesanan miliknya (gateway: room karyawan:<id>).
        // Tetap validasi guard sisi-klien untuk berjaga-jaga.
        const isEmployeeOwner = role === 'employee' && user?.karyawanId === event.karyawanPemesanId;
        const kode = event.kodePesanan;
        const baseMsg = `Status ${kode}: ${event.oldStatus ?? '—'} → ${event.newStatus}`;
        switch (status) {
            case StatusPesanan.MENUNGGU:
            case StatusPesanan.IN_PROGRESS: {
                if (role === 'dapur') {
                    showInfo(baseMsg);
                }
                break;
            }
            case StatusPesanan.READY: {
                if (role === 'dapur' || role === 'delivery') {
                    showSuccess(`Pesanan siap: ${kode}`);
                }
                break;
            }
            case StatusPesanan.ON_DELIVERY: {
                if (role === 'delivery') {
                    showInfo(`Dalam pengantaran: ${kode}`);
                }
                break;
            }
            case StatusPesanan.COMPLETE: {
                if (role === 'administrator' || isEmployeeOwner) {
                    showSuccess(`Pesanan selesai: ${kode}`);
                }
                break;
            }
            case StatusPesanan.DITOLAK: {
                if (role === 'administrator' || isEmployeeOwner) {
                    showError(`Pesanan ditolak: ${kode}`);
                }
                break;
            }
            case StatusPesanan.MENUNGGU_PERSETUJUAN: {
                if (role === 'administrator') {
                    showInfo(`Menunggu persetujuan admin: ${kode}`, { icon: '⚠️' });
                }
                break;
            }
            default: {
                // Fallback untuk admin jika ada status di luar map
                if (role === 'administrator') {
                    showInfo(baseMsg);
                }
                break;
            }
        }
    }, [role, user?.karyawanId]);
    // 3) order.approval.requested → Warning toast untuk admin dengan action button
    useWebSocket('order.approval.requested', (event) => {
        if (role !== 'administrator') {
            // Opsional: notif ringan untuk employee pemilik pesanan jika menerima event (room karyawan:<id>)
            if (role === 'employee' && user?.karyawanId === event.karyawanPemesanId) {
                showInfo(`Permintaan approval diajukan untuk ${event.kodePesanan}`, {
                    icon: '📝',
                });
            }
            return;
        }
        // Custom warning toast dengan action button menuju /approvals
        toast((t) => React.createElement('div', { className: 'flex items-start gap-3' }, React.createElement('div', { className: 'flex-1' }, React.createElement('div', { className: 'font-semibold' }, 'Permintaan Approval'), React.createElement('div', { className: 'text-sm opacity-90' }, `${event.requestType === 'REJECT' ? 'Penolakan' : 'Edit'} untuk pesanan `, React.createElement('span', { className: 'font-mono' }, event.kodePesanan), ` (dept ${event.departmentId})`)), React.createElement('button', {
            onClick: () => {
                navigate('/approvals');
                toast.dismiss(t.id);
            },
            className: 'px-3 py-1 rounded-md text-sm bg-amber-500 hover:bg-amber-600 text-black',
        }, 'Buka')), {
            duration: 5000,
            style: {
                background: '#0b1220', // slate-950 approx
                color: '#f1f5f9',
                border: '1px solid #f59e0b', // amber-500
                boxShadow: '0 8px 24px rgba(2,6,23,0.35)',
            },
            icon: '⚠️',
        });
    }, [role, user?.karyawanId, navigate]);
    // 4) order.approval.decided → Toast untuk dapur dan employee
    useWebSocket('order.approval.decided', (event) => {
        const decision = event.decision;
        const kode = event.kodePesanan;
        // Dapur: selalu diberi tahu keputusan admin untuk tindakan produksi
        if (role === 'dapur') {
            if (decision === 'APPROVED') {
                showSuccess(`Approval disetujui untuk ${kode}`);
            }
            else if (decision === 'REJECTED') {
                showError(`Approval ditolak untuk ${kode}`);
            }
            else {
                showInfo(`Approval pending untuk ${kode}`);
            }
        }
        // Employee (pemilik request/originator): diberi tahu keputusan admin
        if (role === 'employee' && user?.karyawanId === event.requestedBy) {
            if (decision === 'APPROVED') {
                showSuccess(`Keputusan admin: disetujui (${kode})`);
            }
            else if (decision === 'REJECTED') {
                showError(`Keputusan admin: ditolak (${kode})`);
            }
            else {
                showInfo(`Keputusan admin: pending (${kode})`);
            }
        }
        // Administrator dapat diabaikan di sini (sudah berada di pusat persetujuan).
    }, [role, user?.karyawanId]);
}
