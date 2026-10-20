import { FileText, Download } from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { getInitials } from "@/lib/initials";
import { ACTIVITY_TYPE_LABELS, ROLE_LABELS } from "@/lib/permissions";
import { ActivityReply } from "@/components/cards/ActivityReply";
import { MentionText } from "@/components/cards/MentionText";
import { EntryOwnerActions } from "@/components/cards/EntryOwnerActions";
import type { MentionUser } from "@/components/cards/MentionTextarea";
import type { ActivityFile, ActivityReply as ActivityReplyType, ActivityWithAuthor } from "@/lib/types";
import type { Role } from "@prisma/client";

const TYPE_BADGE: Record<string, string> = {
  SALES_UPDATE: "bg-sky-100 text-sky-700",
  DEV_PROGRESS: "bg-amber-100 text-amber-700",
  MARKETING_OFFER: "bg-violet-100 text-violet-700",
  STATUS_CHANGE: "bg-zinc-200 text-zinc-600",
  NOTE: "bg-zinc-100 text-zinc-600",
  REPLY: "bg-blue-100 text-blue-700",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(value: unknown) {
  if (value == null) return null;
  const num = Number(String(value));
  if (Number.isNaN(num)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileAttachments({ cardId, files }: { cardId: string; files: ActivityFile[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {files.map((file) => (
        <a
          key={file.id}
          href={`/uploads/cards/${cardId}/${file.storedName}`}
          target="_blank"
          rel="noopener noreferrer"
          download={file.filename}
          title={file.filename}
          className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 hover:border-brand hover:text-brand"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1 truncate font-medium">{file.filename}</span>
          <span className="shrink-0 text-zinc-400">{formatSize(file.size)}</span>
          <Download className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
        </a>
      ))}
    </div>
  );
}

const USER_WRITTEN_TYPES = ["SALES_UPDATE", "DEV_PROGRESS", "MARKETING_OFFER", "NOTE", "REPLY"];

type Viewer = { id: string; role: Role };

function EntryHeader({
  author,
  type,
  createdAt,
  editedAt,
  actions,
}: {
  author: { name: string; role: Role };
  type: string;
  createdAt: Date;
  editedAt: Date | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-900">{author.name}</span>
        <span className="text-xs text-zinc-400">{ROLE_LABELS[author.role]}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            TYPE_BADGE[type] ?? "bg-zinc-100 text-zinc-600"
          }`}
        >
          {ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">
          {formatDate(createdAt)}
          {editedAt && (
            <span title={`Edited ${formatDate(editedAt)}`} className="ml-1 italic">
              (edited)
            </span>
          )}
        </span>
        {actions}
      </div>
    </div>
  );
}

function OwnerActions({
  entry,
  viewer,
  users,
}: {
  entry: {
    id: string;
    type: string;
    content: string;
    offerAmount: unknown;
    authorId: string;
    replyCount: number;
  };
  viewer: Viewer;
  users: MentionUser[];
}) {
  if (!USER_WRITTEN_TYPES.includes(entry.type)) return null;
  const isAuthor = entry.authorId === viewer.id;
  const canDelete = isAuthor || viewer.role === "ADMIN";
  if (!isAuthor && !canDelete) return null;
  const amount = entry.offerAmount == null ? null : Number(String(entry.offerAmount));
  return (
    <EntryOwnerActions
      activityId={entry.id}
      content={entry.content}
      offerAmount={amount != null && !Number.isNaN(amount) ? amount : null}
      isOffer={entry.type === "MARKETING_OFFER"}
      canEdit={isAuthor}
      canDelete={canDelete}
      replyCount={entry.replyCount}
      users={users}
    />
  );
}

function ReplyItem({
  cardId,
  reply,
  names,
  viewer,
  users,
}: {
  cardId: string;
  reply: ActivityReplyType;
  names: string[];
  viewer: Viewer;
  users: MentionUser[];
}) {
  return (
    <li className="flex gap-2.5">
      <Avatar
        avatarUrl={reply.author.avatarUrl}
        initials={getInitials(reply.author.name)}
        size={26}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-3 py-2">
        <EntryHeader
          author={reply.author}
          type={reply.type}
          createdAt={reply.createdAt}
          editedAt={reply.editedAt}
          actions={
            <OwnerActions
              entry={{ ...reply, authorId: reply.author.id, replyCount: 0 }}
              viewer={viewer}
              users={users}
            />
          }
        />
        <MentionText
          content={reply.content}
          names={names}
          className="mt-1 whitespace-pre-wrap text-sm text-zinc-700"
        />
        <FileAttachments cardId={cardId} files={reply.files} />
      </div>
    </li>
  );
}

export function ActivityTimeline({
  activities,
  cardId,
  users,
  viewer,
}: {
  activities: ActivityWithAuthor[];
  cardId: string;
  users: MentionUser[];
  viewer: Viewer;
}) {
  const names = users.map((u) => u.name);
  if (activities.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-400">
        No reports yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities
        .slice()
        .reverse()
        .map((activity) => (
          <li
            key={activity.id}
            className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <Avatar
              avatarUrl={activity.author.avatarUrl}
              initials={getInitials(activity.author.name)}
              size={32}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <EntryHeader
                author={activity.author}
                type={activity.type}
                createdAt={activity.createdAt}
                editedAt={activity.editedAt}
                actions={
                  <OwnerActions
                    entry={{
                      ...activity,
                      authorId: activity.author.id,
                      replyCount: activity.replies.length,
                    }}
                    viewer={viewer}
                    users={users}
                  />
                }
              />

              <MentionText
                content={activity.content}
                names={names}
                className="mt-2 whitespace-pre-wrap text-sm text-zinc-700"
              />

              {activity.offerAmount != null && (
                <p className="mt-1 text-sm font-medium text-violet-700">
                  Offer amount: {formatCurrency(activity.offerAmount)}
                </p>
              )}

              <FileAttachments cardId={cardId} files={activity.files} />

              <ActivityReply cardId={cardId} activityId={activity.id} users={users} />

              {activity.replies.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 border-l-2 border-zinc-100 pl-3">
                  {activity.replies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      cardId={cardId}
                      reply={reply}
                      names={names}
                      viewer={viewer}
                      users={users}
                    />
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
    </ul>
  );
}
