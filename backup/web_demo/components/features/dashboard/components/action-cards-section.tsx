"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ACTION_CARDS } from "../constants/dashboard-config"

export function ActionCardsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {ACTION_CARDS.map((card) => {
        const Icon = card.icon
        
        return (
          <Link key={card.id} href={card.href}>
            <Card className={cn(
              "transition-all duration-200 hover:shadow-lg group cursor-pointer border-border",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    // Blue theme
                    card.color === 'blue' && "bg-blue-600 dark:bg-blue-600 group-hover:bg-blue-700 dark:group-hover:bg-blue-700",
                    // Gray theme 
                    card.color === 'gray' && "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700",
                    // Orange theme
                    card.color === 'orange' && "bg-orange-500 dark:bg-orange-600 group-hover:bg-orange-600 dark:group-hover:bg-orange-700"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      card.color === 'blue' && "text-white",
                      card.color === 'gray' && "text-gray-700 dark:text-gray-300",
                      card.color === 'orange' && "text-white"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
} 