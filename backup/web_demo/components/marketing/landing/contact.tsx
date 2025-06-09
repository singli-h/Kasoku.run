/*
<ai_context>
This client component provides the contact section for the GuideLayer AI landing page, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Phone, Clock } from "lucide-react"
import { useEffect, useState } from "react"

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6 text-blue-600" />,
    title: "Email Us",
    description: "Get in touch via email",
    details: "hello@guidelayer.ai",
    action: "mailto:hello@guidelayer.ai"
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-green-600" />,
    title: "Live Chat",
    description: "Chat with our support team",
    details: "Available 24/7",
    action: "#chat"
  },
  {
    icon: <Phone className="w-6 h-6 text-purple-600" />,
    title: "Schedule Demo",
    description: "Book a personalized demo",
    details: "30-minute consultation",
    action: "#demo"
  },
  {
    icon: <Clock className="w-6 h-6 text-orange-600" />,
    title: "Response Time",
    description: "We typically respond within",
    details: "24 hours",
    action: null
  }
]

export function ContactSection() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
            GET IN TOUCH
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-6 dark:text-slate-100">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto dark:text-slate-400">
            Contact us today to learn how GuideLayer AI can help you achieve better results 
            with intelligent virtual assistant solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {contactInfo.map((info, index) => (
                <Card key={index} className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {info.icon}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {info.description}
                        </p>
                        {info.action ? (
                          <a 
                            href={info.action}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            {info.details}
                          </a>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-100 font-medium text-sm">
                            {info.details}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-lg p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Why Choose GuideLayer AI?
              </h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Proven track record with $500M+ in direct revenue
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  AI-powered solutions that actually work
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Dedicated support and account management
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  No long-term contracts, cancel anytime
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Send us a message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6" suppressHydrationWarning>
              {isMounted ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300">
                        First Name
                      </Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        placeholder="John" 
                        autoComplete="given-name"
                        className="border-slate-300 dark:border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300">
                        Last Name
                      </Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        placeholder="Doe" 
                        autoComplete="family-name"
                        className="border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                      Email Address
                    </Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="john@company.com" 
                      autoComplete="email"
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">
                      Company
                    </Label>
                    <Input 
                      id="company" 
                      name="company"
                      placeholder="Your Company" 
                      autoComplete="organization"
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-700 dark:text-slate-300">
                      Message
                    </Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder="Tell us about your needs..." 
                      className="border-slate-300 dark:border-slate-600 min-h-[120px]"
                    />
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    size="lg"
                  >
                    Send Message
                  </Button>

                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                    We'll get back to you within 24 hours
                  </p>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 