import {
  Activity,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Cpu,
  Cube,
  Database,
  Download,
  DotsGrid3x3,
  EditPencil,
  Eye,
  EyeClosed,
  History,
  Image,
  Key,
  Lock,
  Mail,
  NavArrowLeft,
  NavArrowRight,
  Plus,
  QrCode,
  RefreshCircle,
  Search,
  Settings,
  TextSquare,
  Trash,
  Upload,
  User,
  Users,
  WarningTriangle,
  XmarkCircle,
} from "iconoir-react";

import { cn } from "@/lib/utils";

export const Icons = {
  activity: Activity,
  admin: BadgeCheck,
  badge: BadgeCheck,
  calendar: Calendar,
  camera: Camera,
  check: CheckCircle,
  close: XmarkCircle,
  clock: Clock,
  cpu: Cpu,
  cube: Cube,
  database: Database,
  download: Download,
  edit: EditPencil,
  eye: Eye,
  eyeClosed: EyeClosed,
  history: History,
  image: Image,
  inventory: TextSquare,
  key: Key,
  lock: Lock,
  logout: NavArrowRight,
  mail: Mail,
  more: DotsGrid3x3,
  next: NavArrowRight,
  notes: TextSquare,
  plus: Plus,
  previous: NavArrowLeft,
  qr: QrCode,
  refresh: RefreshCircle,
  search: Search,
  settings: Settings,
  trash: Trash,
  upload: Upload,
  user: User,
  users: Users,
  warning: WarningTriangle,
} as const;

export type AppIconName = keyof typeof Icons;

interface IconBadgeProps {
  className?: string;
  iconClassName?: string;
  icon: AppIconName;
}

export const IconBadge = ({ className, iconClassName, icon }: IconBadgeProps) => {
  const Icon = Icons[icon];

  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,246,248,0.98))] text-foreground shadow-[0_10px_30px_rgba(16,24,40,0.06)]",
        className,
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", iconClassName)} />
    </span>
  );
};
