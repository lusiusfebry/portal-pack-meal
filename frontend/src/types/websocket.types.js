/**
 * WebSocket (Socket.IO) types untuk frontend.
 * Diselaraskan dengan gateway dan event backend:
 * - Gateway: backend/src/websocket/websocket.gateway.ts
 *   Listeners: 'order.created', 'order.status.changed', 'order.approval.requested', 'order.approval.decided'
 * - Events:
 *   - OrderStatusChangedEvent: backend/src/common/events/order-status-changed.event.ts
 *   - OrderApprovalRequestedEvent: backend/src/common/events/order-approval-requested.event.ts
 *   - OrderApprovalDecidedEvent: backend/src/common/events/order-approval-decided.event.ts
 */
export {};
