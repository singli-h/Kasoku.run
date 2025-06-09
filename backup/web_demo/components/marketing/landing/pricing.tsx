/*
<ai_context>
This client component provides the pricing section for the GuideLayer AI landing page, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const pricingPlans = [
  {
    title: "Virtual Assistant Professional",
    price: "$1,197",
    period: "per month",
    description: "Perfect for businesses needing dedicated support",
    features: [
      "20 Hours per week",
      "Dedicated Smart Staff Assistant",
      "Customer Success Manager", 
      "Managed Onboarding",
      "GuideLayer® AI Integration"
    ],
    popular: false,
    buttonText: "Get Started",
    effectiveRate: "$14/hour"
  },
  {
    title: "Virtual Assistant Enterprise",
    price: "$1,997", 
    period: "per month",
    description: "For businesses that need full-time dedicated support",
    features: [
      "40 Hours per week",
      "Dedicated Smart Staff Assistant",
      "Customer Success Manager",
      "Managed Onboarding", 
      "GuideLayer® AI Integration",
      "Priority Support",
      "Custom Workflows"
    ],
    popular: true,
    buttonText: "Get Started",
    effectiveRate: "$11/hour"
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-50 py-20 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
            PRICING
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-6 dark:text-slate-100">
            Comparable Pricing, With Far Better Results
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto dark:text-slate-400">
            Hiring GuideLayer "Smart Staff" is comparable in price to a typical "virtual assistant". 
            But with our AI driven approach, you'll get far better results at around half the cost of another provider.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={cn(
                "relative flex flex-col h-full",
                plan.popular 
                  ? "border-2 border-blue-500 shadow-lg scale-105" 
                  : "border border-slate-200 dark:border-slate-700"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {plan.title}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                    {plan.price}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {plan.period}
                  </div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Effective Rate: {plan.effectiveRate}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    What's included:
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className={cn(
                    "w-full font-medium",
                    plan.popular 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900"
                  )}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            One-time setup fee: <span className="font-medium">$997</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No long-term contracts • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  )
} 