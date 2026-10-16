import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getUnreadNotificationCount } from "../../services/notification.service.js";
import { unwrapApiData } from "../../utils/apiData.js";
import Sidebar from "../common/Sidebar.jsx";
import MobileSidebar from "../common/MobileSidebar.jsx";
import Header from "../common/Header.jsx";
import Footer from "../common/Footer.jsx";

export default function MainLayout() {
  const location = useLocation();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadNotificationCount(unwrapApiData(response)?.count ?? 0);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnreadNotifications();
    window.addEventListener(
      "notifications:updated",
      refreshUnreadNotifications,
    );
    window.addEventListener("focus", refreshUnreadNotifications);

    return () => {
      window.removeEventListener(
        "notifications:updated",
        refreshUnreadNotifications,
      );
      window.removeEventListener("focus", refreshUnreadNotifications);
    };
  }, [location.pathname, refreshUnreadNotifications]);

  return (
    <div className="min-h-screen bg-page text-fg flex">
      {/* Mobile sidebar drawer */}
      <MobileSidebar unreadNotificationCount={unreadNotificationCount} />

      {/* Desktop sidebar — full height, top se start */}
      <Sidebar unreadNotificationCount={unreadNotificationCount} />

      {/* Right column: header + content + footer */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header unreadNotificationCount={unreadNotificationCount} />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
