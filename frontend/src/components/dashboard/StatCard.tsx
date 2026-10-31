"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-violet-500",
  bg = "bg-violet-500/10",
  index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color?: string;
  bg?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card rounded-3xl p-5 flex items-center gap-4"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          bg,
          color
        )}
      >
        <Icon size={22} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-400 truncate">
          {label}
        </p>

        <p className="text-2xl font-display font-bold">
          {value}
        </p>

        {sub && (
          <p className="text-xs text-zinc-500 truncate">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}