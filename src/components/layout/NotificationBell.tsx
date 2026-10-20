"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, UserPlus, CheckCircle2, MessageCircle, XCircle, ShieldCheck, CalendarClock, AtSign, Send } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";

export type NotificationEntry = {
  id: string;
  type: NotificationType;
  message: string;
  cardId: string | null;
  read: boolean;
  createdAt: Date;
};

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  LEAD_ASSIGNED: UserPlus,
  LEAD_CLAIMED: CheckCircle2,
  COMMENT_REPLY: MessageCircle,
  ASSIGNMENT_ACCEPTED: CheckCircle2,
  ASSIGNMENT_DECLINED: XCircle,
  ROLE_CHANGE_REQUESTED: ShieldCheck,
  ROLE_CHANGE_APPROVED: CheckCircle2,
  ROLE_CHANGE_REJECTED: XCircle,
  DEADLINE_APPROACHING: CalendarClock,
  STATUS_APPROVAL_REQUESTED: ShieldCheck,
  STATUS_APPROVED: CheckCircle2,
  STATUS_REJECTED: XCircle,
  MENTION: AtSign,
  LEAD_HANDOFF: Send,
};

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function handleNotificationClick(notification: NotificationEntry) {
    setOpen(false);
    if (!notification.read) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        router.refresh();
      });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="cursor-pointer text-xs font-medium text-brand hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type] ?? Bell;
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                      !notification.read ? "bg-brand/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-700">{notification.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    )}
                  </div>
                );

                return notification.cardId ? (
                  <Link
                    key={notification.id}
                    href={`/cards/${notification.cardId}`}
                    onClick={() => handleNotificationClick(notification)}
                    className="block border-b border-zinc-50 last:border-b-0"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="block w-full cursor-pointer border-b border-zinc-50 last:border-b-0"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
