import AdminAccessGate from "@/components/admin/AdminAccessGate";
import AdminOrders from "@/components/admin/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <AdminAccessGate mode="orders">
      <AdminOrders />
    </AdminAccessGate>
  );
}
