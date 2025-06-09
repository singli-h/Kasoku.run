/*
<ai_context>
This client component showcases the browser extension functionality for the GuideLayer AI landing page.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import { Chrome, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"

export const BrowserExtensionSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const integrations = [
    { name: "Slack", logo: "/images/integrations/slack.svg" },
    { name: "Asana", logo: "/images/integrations/asana.svg" },
    { name: "Basecamp", logo: "/images/integrations/basecamp.svg" },
    { name: "Notion", logo: "/images/integrations/notion.svg" },
    { name: "Trello", logo: "/images/integrations/trello.svg" },
    { name: "Monday", logo: "/images/integrations/monday.svg" }
  ]

  return (
    <section id="browser-extension" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                <Chrome className="mr-2 size-4" /> Browser Extension
              </div>
              <h2 className="mb-6 mt-4 text-4xl font-bold">
                Use GuideLayer AI in Your Existing Tools
              </h2>
              <p className="mb-6 text-xl text-muted-foreground">
                Our browser extension seamlessly integrates with your favorite tools, 
                allowing you to use GuideLayer AI without changing your workflow.
              </p>

              <div className="mb-8 space-y-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    ✓
                  </div>
                  <p>Create task briefs directly in Slack, Asana, or any task management system</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    ✓
                  </div>
                  <p>Access AI Copilot guidance while working in any platform</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    ✓
                  </div>
                  <p>Mirror tasks between systems with one click</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    ✓
                  </div>
                  <p>No platform lock-in - use your preferred tools</p>
                </div>
              </div>

              <Link href="/download-extension">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Download className="mr-2 size-5" /> Download Extension
                </Button>
              </Link>
            </motion.div>

            {/* Right Column - Image */}
            <div ref={ref}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative rounded-lg border bg-white p-2 shadow-xl dark:bg-gray-800"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
                  {/* Replace with actual extension screenshot */}
                  <div className="relative h-full w-full">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      Browser Extension Screenshot
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800">
                  <Chrome className="size-8 text-purple-600" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-24 text-center"
          >
            <h3 className="mb-8 text-2xl font-bold">Works With Your Favorite Tools</h3>
            <div className="mx-auto flex flex-wrap items-center justify-center gap-8">
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="flex h-16 w-32 items-center justify-center rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800"
                >
                  <div className="text-center text-sm font-medium">{integration.name}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 