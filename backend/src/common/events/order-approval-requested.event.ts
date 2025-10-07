export class OrderApprovalRequestedEvent {
  constructor(
    public readonly orderId: number,
    public readonly kodePesanan: string,
    public readonly requestType: 'REJECT' | 'EDIT',
    public readonly requestedBy: number,
    public readonly requestedByNik: string,
    public readonly catatanDapur: string,
    public readonly jumlahPesananAwal: number,
    public readonly departmentId: number,
    public readonly karyawanPemesanId: number,
    public readonly jumlahPesananBaru?: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
