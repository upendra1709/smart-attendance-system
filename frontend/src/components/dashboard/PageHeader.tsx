"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
    >
      <div>
        <h2 className="text-2xl lg:text-3xl font-display font-bold">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-zinc-500 font-semibold mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </motion.div>
  );
}