import { ReactNode } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  currentPath: string;
}

export function SidebarItem({ href, icon: Icon, label, currentPath }: SidebarItemProps) {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full h-9 px-3 rounded-lg transition-all duration-200",
          "flex items-center justify-start",
          "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100/80 dark:hover:bg-gray-800/60 font-medium",
          isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
        )}
      >
        <div className="flex items-center">
          <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{label}</span>
        </div>
      </Button>
    </Link>
  );
}
