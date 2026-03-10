"use client"

import Image from "next/image"
import { Check, X, Trash2, User, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoModerationCardProps {
  id: string
  src: string
  username: string
  date: string
  status: "pending" | "approved" | "rejected"
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/10 text-warning-foreground border-warning/30",
  },
  approved: {
    label: "Approved",
    icon: Check,
    className: "bg-accent/10 text-accent border-accent/30",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
}

export function PhotoModerationCard({
  id,
  src,
  username,
  date,
  status,
  onApprove,
  onReject,
  onDelete,
}: PhotoModerationCardProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image
          src={src}
          alt={`Photo by ${username}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.className
          )}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{username}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => onApprove?.(id)}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject?.(id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
