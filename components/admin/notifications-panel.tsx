"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X, CheckCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  title: string;
  message: string;
  notification_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified notification setup - just fetch once
    fetchNotifications();
  }, []);

  // Close notification panel when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && 
          event.target instanceof Element && 
          !event.target.closest('.notification-panel')) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    // Add multiple event listeners for better compatibility
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    // Temporarily disable notifications completely to prevent errors
    console.log('Notifications temporarily disabled - using empty state');
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Since we're using bookings as notifications, we'll just update local state
      // In a real implementation, you might want to add a read_status field to bookings
      console.log('Marking notification as read:', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      console.log('Marking all notifications as read:', unreadIds);

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("Semua notifikasi ditandai sebagai dibaca");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return date.toLocaleDateString("id-ID");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "anonymous_booking":
        return <User className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (!notification.is_read) return "bg-amber-50 border-amber-200";
    return "bg-white border-gray-200";
  };

  if (loading) {
    return (
      <div className="relative">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          console.log('Notification button clicked, current state:', { isOpen, unreadCount });
          setIsOpen(!isOpen);
        }}
        className="relative hover:bg-gray-100 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : 'No notifications'}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-600 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5 text-gray-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="notification-panel absolute right-0 top-12 w-96 max-h-96 overflow-hidden shadow-lg border z-[60]">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tandai semua dibaca
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors ${getNotificationColor(notification)}`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.notification_type || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(notification.created_at)}</span>
                          {notification.booking_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                #{notification.booking_id.slice(0, 8)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
