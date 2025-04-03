"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, CreditCard, Calendar, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const plans = [
  {
    name: "Basic",
    price: "Free",
    features: [
      "Basic sprint tracking",
      "Personal dashboard",
      "Limited workout plans",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$9.99/mo",
    features: [
      "Advanced sprint analytics",
      "Custom workout plans",
      "Progress tracking",
      "Priority support",
      "Video analysis",
    ],
  },
  {
    name: "Elite",
    price: "$19.99/mo",
    features: [
      "All Pro features",
      "1-on-1 coaching",
      "Team management",
      "Advanced analytics",
      "Custom reports",
      "API access",
    ],
  },
]

export default function SubscriptionStep({ userData, updateUserData, onNext, onPrev }) {
  const [selectedPlan, setSelectedPlan] = useState(userData.plan || "Basic")
  const [errors, setErrors] = useState({})
  const [paymentData, setPaymentData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: ""
  })

  const validatePaymentForm = () => {
    const newErrors = {}
    if (selectedPlan !== "Basic") {
      if (!paymentData.cardName) newErrors.cardName = "Name is required"
      if (!paymentData.cardNumber) newErrors.cardNumber = "Card number is required"
      if (!paymentData.expiry) newErrors.expiry = "Expiry date is required"
      if (!paymentData.cvc) newErrors.cvc = "CVC is required"
      
      // Card number validation (16 digits)
      if (paymentData.cardNumber && !/^\d{16}$/.test(paymentData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = "Invalid card number"
      }
      
      // Expiry date validation (MM/YY)
      if (paymentData.expiry && !/^\d{2}\/\d{2}$/.test(paymentData.expiry)) {
        newErrors.expiry = "Invalid format (MM/YY)"
      }
      
      // CVC validation (3-4 digits)
      if (paymentData.cvc && !/^\d{3,4}$/.test(paymentData.cvc)) {
        newErrors.cvc = "Invalid CVC"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (selectedPlan === "Basic" || validatePaymentForm()) {
      updateUserData({ plan: selectedPlan })
      onNext()
    }
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const handleInputChange = (field, value) => {
    let formattedValue = value
    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value)
    } else if (field === "expiry") {
      // Format MM/YY
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})/, "$1/")
        .substr(0, 5)
    } else if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "").substr(0, 4)
    }
    
    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl font-bold text-white">
          Choose Your Plan
        </h2>
        <p className="text-lg text-white/70">
          Select the plan that best fits your needs
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            className={`relative p-6 rounded-lg border ${
              selectedPlan === plan.name
                ? "bg-white/10 border-blue-600"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            } transition-all duration-200`}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2 text-white">{plan.price}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/80">
                    <Check className="w-5 h-5 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={selectedPlan === plan.name ? "default" : "outline"}
                className={
                  selectedPlan === plan.name
                    ? "w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20"
                    : "w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                }
                onClick={() => setSelectedPlan(plan.name)}
              >
                {selectedPlan === plan.name ? "Selected" : "Select"}
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {selectedPlan !== "Basic" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 border-2 border-white/20 rounded-xl p-8 bg-white"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Payment Details
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-gray-700 font-medium">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={paymentData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  variant="onboarding"
                  className={errors.cardName ? "border-red-500" : ""}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-sm">{errors.cardName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-gray-700 font-medium">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  maxLength={19}
                  variant="onboarding"
                  className={errors.cardNumber ? "border-red-500" : ""}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-gray-700 font-medium">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={paymentData.expiry}
                    onChange={(e) => handleInputChange("expiry", e.target.value)}
                    maxLength={5}
                    variant="onboarding"
                    className={errors.expiry ? "border-red-500" : ""}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.expiry && (
                  <p className="text-red-500 text-sm">{errors.expiry}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-gray-700 font-medium">CVC</Label>
                <div className="relative">
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={paymentData.cvc}
                    onChange={(e) => handleInputChange("cvc", e.target.value)}
                    maxLength={4}
                    variant="onboarding"
                    className={errors.cvc ? "border-red-500" : ""}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.cvc && (
                  <p className="text-red-500 text-sm">{errors.cvc}</p>
                )}
              </div>
            </div>

            <div className="pt-2 text-sm text-gray-600 flex items-center gap-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <Lock className="w-5 h-5 text-blue-600" />
              Your payment information is secured with 256-bit encryption
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-between pt-4"
      >
        <Button
          variant="outline"
          onClick={onPrev}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 px-8"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8"
        >
          {selectedPlan === "Basic" ? "Continue" : "Subscribe & Continue"}
        </Button>
      </motion.div>
    </div>
  )
} 