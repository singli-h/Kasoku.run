"use client"

import React from "react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '../ui/button'

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "Basic training plans",
      "Performance tracking",
      "Community support",
      "Mobile app access",
      "1 training program",
      "100% free"
    ]
  },
  {
    name: "Pro",
    price: "19",
    description: "Most popular for serious athletes",
    features: [
      "Everything in Free",
      "AI-powered insights",
      "Advanced analytics",
      "Custom training plans",
      "Priority support",
      "Unlimited programs"
    ],
  },
  {
    name: "Elite",
    price: "49",
    description: "For professional athletes & teams",
    features: [
      "Everything in Pro",
      "1-on-1 coaching",
      "Team management",
      "Custom branding",
      "API access",
      "Dedicated account manager"
    ]
  }
]

const PricingCard = ({ plan, index }) => {
  const { name, price, description, features, highlighted } = plan
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-8 ${
        highlighted 
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
          : 'bg-white text-gray-900'
      } rounded-2xl shadow-xl`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="text-center">
        <h3 className={`text-2xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <p className={`mt-2 ${highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
          {description}
        </p>
        <div className="mt-4">
          <span className="text-5xl font-bold">${price}</span>
          <span className={`${highlighted ? 'text-blue-100' : 'text-gray-600'}`}>/month</span>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-center">
            <Check className={`h-5 w-5 ${highlighted ? 'text-blue-200' : 'text-blue-500'} mr-3`} />
            <span className={highlighted ? 'text-blue-100' : 'text-gray-600'}>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button 
          className={`w-full py-3 ${
            highlighted 
              ? 'bg-white text-blue-600 hover:bg-blue-50' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Get Started
        </Button>
      </div>
    </motion.div>
  )
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-900"
          >
            Simple, Transparent
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Pricing
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Choose the perfect plan for your training needs
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
} 