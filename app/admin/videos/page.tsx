import { VideoManager } from "@/components/admin/videos/VideoManager";
import AdminLayout from "@/layouts/AdminLayout";

export default function AdminVideosPage() {
  return (
    <AdminLayout>
      <VideoManager />
    </AdminLayout>
  );
} 